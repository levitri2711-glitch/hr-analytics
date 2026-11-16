/* Talent Acquisition – thao tác, tự động hoá, liên kết với HR Analytics, xuất Excel. */
"use strict";
S.jdDraft={};S.tt={on:false,ans:{},cand:'',start:0,res:null};S.sc={req:'',cand:'',vals:{},notes:{},rec:''};

/* ---- nối mô hình: phễu yêu cầu tuyển dụng lấy từ ứng viên thật trong ATS ---- */
const _mergedReqs=mergedReqs;
mergedReqs=function(){
  const rs=_mergedReqs(),by=groupBy(mergedCands(),c=>c.req);
  for(const r of rs){const l=by[r.id];if(!l)continue;const at=k=>l.filter(c=>c.st>=k).length;
    r.applied=l.length;r.screened=at(1);r.interviewed=at(3);r.offered=at(5);r.hired=Math.max(Number(r.hired)||0,l.filter(c=>c.status==='hired').length)}
  return rs;
};
const _build=build;
build=function(){_build();M.ta=buildTA(M)};
for(const v of TA_VIEWS){VIEWS.push(v)}
const _sheetTabs=sheetTabs;
sheetTabs=function(m){const t=m.ta||buildTA(m);return{..._sheetTabs(m),
  'TA – Ứng viên':[['Mã','Họ tên','Yêu cầu','Vị trí','Nguồn','Ngày nộp','Bước','Trạng thái','CV','Test','Phỏng vấn','Tổng','Lý do'],...t.cands.map(c=>[c.id,c.name,c.req,c.r.title,srcName(c.src),c.dates[0],STAGES[c.st].l,ST_NAME[c.status],c.cv,c.tt??'',c.ia??'',c.comp,c.reason||''])],
  'TA – Chiến dịch':[['Mã','Chiến dịch','Kênh','Ngân sách','Đã chi','Hiển thị','Click','Hồ sơ','Nhận việc','Trạng thái'],...t.camps.map(c=>[c.id,c.name,c.ch.name,c.budget,c.spent,c.impr,c.clicks,c.applies,c.hires,c.status])],
  'TA – Chỉ số':metricRows(t)}};
function metricRows(t){return[['Chỉ số','Giá trị','Cách tính'],['Time-to-fill (ngày)',Math.round(t.ttf),'Ngày mở yêu cầu → ngày đóng'],['Time-to-hire (ngày)',Math.round(t.tth),'Ngày nộp → ngày nhận offer'],['Cost-per-hire (đ)',Math.round(t.cph),'(Chi phí ngoài + nội bộ) / số người tuyển'],['Tỷ lệ nhận offer (%)',Math.round(t.offAcc/Math.max(1,t.offAcc+t.offDec)*100),'Nhận / (nhận + từ chối)'],['Candidate NPS',t.nps,'% điểm 9–10 − % điểm 0–6'],['Tỷ lệ qua thử việc (%)',Math.round(t.passRate*100),'Chất lượng tuyển dụng'],...STAGES.map((s,k)=>['Số hồ sơ đến bước '+s.l,t.stageCount[k],'Phễu tuyển dụng'])]}

/* ---- tiện ích ---- */
async function copyText(t,msg){try{await navigator.clipboard.writeText(t);toast(msg||'Đã sao chép')}catch(_){toast('Trình duyệt chặn sao chép, hãy chọn và nhấn Ctrl/Cmd + C')}}
const findCand=id=>M.ta.cands.find(c=>c.id===id);
const CAND_KEYS=['req','name','gender','yob','city','src','edu','exp','expect','cvParts','ko','test','ints','ref','st','status','reason','dates','consentAt','nps','emp','offer','msg','anon'];
async function patchCand(c,patch,why){
  const prev=S.col.cands[c.id]||{};
  const doc=c.base?{...prev,...patch,_at:Date.now(),_by:S.meId||null}:{...Object.fromEntries(CAND_KEYS.map(k=>[k,c[k]])),...prev,...patch,_new:true,_at:Date.now(),_by:S.meId||null};
  await put('cands',c.id,doc);if(why)audit(why,`${c.id} ${c.name}`);
}
const stepDates=(c,st)=>{const d=[...(c.dates||[])];for(let k=0;k<=st;k++)if(!d[k])d[k]=iso(today());return d.slice(0,st+1)};
function moveCand(c,st){return patchCand(c,{st,status:'active',reason:'',dates:stepDates(c,st)},'Chuyển bước: '+STAGES[st].l)}
async function bulkPut(list){let n=0;for(const[col,id,doc]of list){S.col[col][id]=doc;n++}scheduleRender();
  if(S.db&&S.db.batch)await S.db.batch(list.map(([col,id,doc])=>({op:'set',col,id,data:doc})));return n}

/* ---- ngăn kéo: hồ sơ ứng viên ---- */
function candDrawer(id){
  const c=findCand(id);if(!c)return;const prof=interviewComps(c.r),h=hurdles(c),ret=addMonths(parse(c.consentAt),TS('retention'));
  openDrawer(`<div class="dh"><div><h2 style="font-size:20px">${esc(c.name)}</h2><div class="small muted">${c.id} · ${esc(c.r.title)} (${c.req}) · ${esc(srcName(c.src))}</div></div><button class="btn sm" data-act="close">Đóng</button></div>
   <div class="panel"><div class="steps2">${STAGES.map((s,k)=>`<div class="${k<=c.st?'on':''}${k===c.st?' cur':''}"><b>${esc(s.l)}</b><span class="small">${c.dates[k]?vn(c.dates[k]):''}</span></div>`).join('')}</div>
    <p style="margin:10px 0 0">${stPill(c)} ${c.reason?`<span class="small muted">${esc(c.reason)}</span>`:''}</p></div>
   <div class="panel"><div class="kv"><div>Kinh nghiệm</div><div>${c.exp} năm · ${esc(c.edu)}</div><div>Nơi ở</div><div>${esc(c.city||'—')}</div><div>Lương kỳ vọng</div><div class="num">${fmt(c.expect)} đ</div><div>Liên hệ</div><div class="muted">Ẩn (dữ liệu mô phỏng)</div><div>Đồng ý xử lý dữ liệu</div><div>${c.ko&&c.ko.consent?'Có, ngày '+vn(c.consentAt):'Chưa'} · lưu đến ${vn(ret)}</div><div>Hồ sơ nhân viên</div><div>${c.emp?`<a href="#" data-act="emp" data-id="${c.emp}">${c.emp}</a>`:'—'}</div></div></div>
   <div class="panel"><h4>Điểm đánh giá · tổng ${c.comp}/100</h4>${hbars([{l:'CV',v:c.cv},{l:'Trắc nghiệm',v:c.tt||0},{l:'Phỏng vấn',v:c.ia?Math.round((c.ia-1)/4*100):0}],{max:100,f:v=>v})}
    ${c.ints?tbl(['Năng lực',['Yêu cầu'],['Đạt được'],'Khoảng cách'],prof.map(p=>{const v=compAvg(c,p.id);return `<tr><td>${esc(CP[p.id].n)}</td><td class="n">${p.req}</td><td class="n">${v==null?'—':v.toFixed(1)}</td><td>${v==null?'':v>=p.req?pill('Đạt','ok'):pill((p.req-v).toFixed(1),'warn')}</td></tr>`})):''}
    <p class="small">Rào cản: ${h.map(x=>`${esc(x[0])} ${yes(x[1])}`).join(' · ')}</p></div>
   <div class="panel"><div style="display:flex;gap:6px;flex-wrap:wrap">${c.status==='active'||c.status==='pool'?`${c.st<5?`<button class="btn pri sm" data-act="candMove" data-id="${c.id}" data-st="${c.st+1}"${lock()}>Chuyển sang: ${esc(STAGES[c.st+1].l)}</button>`:''}<button class="btn sm" data-act="candRej" data-id="${c.id}"${lock()}>Loại</button><button class="btn sm" data-act="candPool" data-id="${c.id}"${lock()}>Talent pool</button><button class="btn sm ghost" data-act="candWd" data-id="${c.id}"${lock()}>Ứng viên rút hồ sơ</button>`:''}
    <button class="btn sm" data-act="candDoc" data-id="${c.id}" data-tpl="interview">Thư mời phỏng vấn</button><button class="btn sm" data-act="candDoc" data-id="${c.id}" data-tpl="reject">Thư cảm ơn/từ chối</button>${c.status!=='hired'?`<button class="btn sm ghost" data-act="candAnon" data-id="${c.id}"${lock()}>Xoá thông tin định danh</button>`:''}</div></div>`);
}
function candNewDrawer(){
  openDrawer(`<div class="dh"><div><h2 style="font-size:20px">Thêm ứng viên</h2><div class="small muted">Nhập thủ công hồ sơ nhận qua email, sự kiện, giới thiệu</div></div><button class="btn sm" data-act="close">Đóng</button></div>
   <div class="panel"><div class="form"><label class="full">Họ và tên<input id="cn_name" placeholder="Ví dụ: Trần Minh Khoa"></label><label class="full">Yêu cầu tuyển dụng<select id="cn_req">${reqOpts(S.f.ta_req,true)}</select></label>
   <label>Nguồn<select id="cn_src">${CHANNELS.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label><label>Số năm kinh nghiệm<input id="cn_exp" type="number" min="0" value="2"></label>
   <label>Trình độ<select id="cn_edu">${['THPT','Trung cấp','Cao đẳng','Đại học','Thạc sĩ'].map(x=>`<option>${x}</option>`).join('')}</select></label><label>Lương kỳ vọng (đ)<input id="cn_exp2" type="number" step="500000" value="15000000"></label>
   <label class="full" style="flex-direction:row;gap:8px;align-items:flex-start"><input type="checkbox" id="cn_consent"> Ứng viên đã đồng ý xử lý dữ liệu cá nhân cho mục đích tuyển dụng (bắt buộc)</label></div>
   <p class="small muted">Không nhập số CCCD, tình trạng hôn nhân, sức khoẻ, tôn giáo. Chỉ thu thập dữ liệu cần cho tuyển dụng.</p>
   <div style="margin-top:10px"><button class="btn pri" data-act="candSaveNew"${lock()}>Lưu ứng viên</button></div></div>`);
}
function preDrawer(id){
  const c=findCand(id);if(!c)return;const pb=S.col.preboard[c.id]||{},start=parse(c.dates[6]||c.dates[5]);
  openDrawer(`<div class="dh"><div><h2 style="font-size:20px">Pre-onboarding: ${esc(c.name)}</h2><div class="small muted">${esc(c.r.title)} · bắt đầu ${vn(start)}</div></div><button class="btn sm" data-act="close">Đóng</button></div>
   <div class="panel">${PRE.map(([k,l])=>{const d=pb[k]!==undefined?pb[k]:start<=M.T;return `<label class="chk"><input type="checkbox" data-act="preToggle" data-id="${c.id}" data-k="${k}"${d?' checked':''}${lock()}> ${esc(l)}</label>`}).join('')}</div>`);
}
function probDrawer(id){
  const p=M.ta.probEval.find(x=>x.e.id===id);if(!p)return;const sc=p.scores||{};
  openDrawer(`<div class="dh"><div><h2 style="font-size:20px">Đánh giá thử việc: ${esc(p.e.name)}</h2><div class="small muted">${esc(p.e.title)} · ${vn(p.hire)} → ${vn(p.end)} (${p.len} ngày)</div></div><button class="btn sm" data-act="close">Đóng</button></div>
   <div class="panel">${PROB_CRIT.map(([k,l,w])=>`<div class="scrow"><b>${esc(l)} <span class="muted small">${w}%</span></b><div class="rad">${[1,2,3,4,5].map(v=>`<label><input type="radio" name="pb_${k}" value="${v}"${Number(sc[k])===v?' checked':''}> ${v}</label>`).join('')}</div></div>`).join('')}
    <div class="form"><label class="full">Nhận xét của quản lý trực tiếp<textarea id="pb_note" rows="3">${esc(p.ov.note||'')}</textarea></label></div>
    <p class="small muted">Điểm ≥ 70: đạt · 55–69: theo dõi sát · &lt; 55: không đạt.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn" data-act="probSave" data-id="${id}"${lock()}>Lưu đánh giá</button>${p.final?'':`<button class="btn pri" data-act="probPass" data-id="${id}"${lock()}>Đạt – ký HĐLĐ chính thức</button><button class="btn ghost" data-act="probFail" data-id="${id}"${lock()}>Không đạt – chấm dứt thử việc</button>`}</div></div>`);
}
const readProb=()=>{const s={};PROB_CRIT.forEach(([k])=>{const el=document.querySelector(`#drawer input[name="pb_${k}"]:checked`);if(el)s[k]=Number(el.value)});return s};

/* ---- tạo hồ sơ nhân viên từ ứng viên (nối sang HR Analytics) ---- */
async function candToEmp(c){
  if(c.emp)return c.emp;const r=c.r,g=r.grade,id=nextEmpId(),hire=c.dates[6]||iso(addDays(today(),14)),o=offerCalc(c);
  const doc={_new:true,name:c.name,gender:c.gender||'Nam',dob:(c.yob||1998)+'-06-15',edu:c.edu||'Đại học',dept:r.dept,site:o.site,grade:g,title:r.title,hire,contract:C_PROB,cEnd:null,cSeq:0,probEnd:iso(addDays(parse(hire),probDaysOf(g))),
    p1:o.p1,comp:0,kpi:3.5,otM:0,otY:0,dep:0,union:false,status:'Đang làm việc',exit:null,exitReason:null,matEnd:null,expat:false,nat:'Việt Nam',wp:null,leaveFrac:0,leaveUsed:0,email:slug(c.name)+'@amg-vn.example',req:r.id,cand:c.id,_at:Date.now(),_by:S.meId||null};
  await put('employees',id,doc);await patchCand(c,{emp:id});audit('Tạo hồ sơ nhân viên từ ứng viên',`${c.id} → ${id} ${c.name}`);
  await put('tasks',safeId('onb_'+id),{title:`${c.name}: hoàn tất onboarding & báo tăng BHXH khi ký HĐLĐ`,sev:'info',due:iso(addDays(parse(hire),7)),law:'Điều 168 BLLĐ 2019; Luật BHXH 2024',status:'open',emp:id,module:'ta',at:Date.now(),by:S.meId||null}).catch(()=>{});
  return id;
}

/* ---- tự động hoá ---- */
async function taInflow(){
  const rnd=mulberry32(Date.now()%1e9),out=[],T=today();let k=Object.keys(S.col.cands).filter(x=>x.startsWith('UN')).length;
  for(const r of M.openReqs){const n=Math.min(8,Math.max(1,Math.round((r.qty-r.hired)*(.5+rnd()*1.5))));const mix=sourceMix(r),band=salaryBand(r.grade),fem=(DEPT[r.dept]||{fem:.5}).fem;
    for(let i=0;i<n&&out.length<80;i++){k++;const q=(rnd()+rnd()+rnd()-1.5)*1.6,f=rnd()<fem,id='UN'+String(Date.now()%1e6).padStart(6,'0')+String(k).padStart(3,'0');
      const pick=a=>a[Math.floor(rnd()*a.length)],c5=x=>clamp(Math.round(x),1,5);
      out.push(['cands',id,{_new:true,req:r.id,name:`${pick(SURN)} ${f?pick(MIDF):pick(MIDM)} ${f?pick(GIVF):pick(GIVM)}`,gender:f?'Nữ':'Nam',yob:2026-22-Math.round(rnd()*15),city:pick(CITY),src:pickW(mix,rnd()),edu:EDU_REQ(r.grade).includes('Đại học')?'Đại học':'Cao đẳng',exp:Math.max(0,Math.round(EXP_REQ(r.grade)+q)),expect:Math.round(band.mid*(1+q*.05+rnd()*.15)/1e5)*1e5,
        cvParts:{exp:c5(3+q),skill:c5(3+q+rnd()-.5),edu:c5(3+rnd()*2-1),ach:c5(2.8+q),sal:c5(3+rnd()*2-1)},ko:{age:true,consent:true,must:rnd()>.15,wp:true},st:0,status:'active',reason:'',dates:[iso(T)],consentAt:iso(T),nps:clamp(Math.round(7+q),0,10),msg:pick(['brand','target','rjp']),_at:Date.now(),_by:S.meId||null}])}}
  const n=await bulkPut(out);await logRun('TA · Thu hồ sơ từ các kênh',`${n} hồ sơ mới cho ${M.openReqs.length} yêu cầu`);toast(`Đã nhận ${n} hồ sơ mới`);
}
async function autoScreen(reqId){
  const cut=TS('cvCut'),l=M.ta.cands.filter(c=>c.status==='active'&&c.st===0&&(!reqId||c.req===reqId));const ops=[];let pass=0;
  for(const c of l){const ok=koPass(c)&&c.cv>=cut;if(ok)pass++;const prev=S.col.cands[c.id]||{};
    const patch=ok?{st:1,status:'active',dates:stepDates(c,1)}:{status:'rejected',reason:koPass(c)?REJ[1][0]:REJ[0][0]};
    ops.push(['cands',c.id,c.base?{...prev,...patch,_at:Date.now()}:{...Object.fromEntries(CAND_KEYS.map(k=>[k,c[k]])),...prev,...patch,_new:true,_at:Date.now()}])}
  await bulkPut(ops);await logRun('TA · Sàng lọc tự động',`${l.length} hồ sơ: ${pass} đạt, ${l.length-pass} loại (ngưỡng ${cut})`);toast(`Sàng lọc ${l.length} hồ sơ: ${pass} đạt`);
}
async function taTasks(kind){
  const st=kind==='test'?1:2,l=M.ta.cands.filter(c=>c.status==='active'&&c.st===st);const by=groupBy(l,c=>c.req);let n=0;
  for(const[req,a]of Object.entries(by)){const r=a[0].r,id=safeId(`ta_${kind}_${req}_${iso(today())}`);if(S.col.tasks[id])continue;n++;
    await put('tasks',id,{title:kind==='test'?`Gửi link trắc nghiệm cho ${a.length} ứng viên – ${r.title}`:`Xếp lịch phỏng vấn hội đồng cho ${a.length} ứng viên – ${r.title}`,sev:'info',due:iso(addDays(today(),kind==='test'?2:5)),law:'Quy trình tuyển dụng nội bộ',status:'open',module:'ta',at:Date.now(),by:S.meId||null}).catch(()=>{})}
  await logRun(kind==='test'?'TA · Mời làm test':'TA · Lên lịch phỏng vấn',`${l.length} ứng viên · ${n} việc mới`);toast(`Đã tạo ${n} việc cho ${l.length} ứng viên`);
}
async function taCompliance(){
  const t=M.ta,T=today(),add=[];
  M.openReqs.forEach(r=>{const f=biasCheck(jdText(jdFor(r)));if(f.length)add.push([`JD ${r.id} có ngôn từ cần sửa: ${f.map(x=>x.hit).join(', ')}`,'warn','Điều 8 BLLĐ 2019','jd_'+r.id])});
  if(t.expiring.length)add.push([`${t.expiring.length} hồ sơ ứng viên quá hạn lưu ${TS('retention')} tháng – xoá/ẩn danh`,'warn','Luật BVDLCN 2025','ret']);
  t.ai.filter(x=>x.ratio<.8).forEach(x=>add.push([`Rà soát tác động bất lợi bước ${x.from} → ${x.to} (tỷ số ${x.ratio.toFixed(2)})`,'warn','ILO C111; quy tắc 4/5','ai_'+x.k]));
  t.probEval.filter(p=>p.left<=7&&!p.final).forEach(p=>add.push([`${p.e.name}: thông báo kết quả thử việc trước ${vn(p.end)}`,p.left<0?'crit':'warn','Điều 27 BLLĐ 2019','prob_'+p.e.id]));
  let n=0;for(const[title,sev,law,key]of add){const id=safeId('tac_'+key+'_'+iso(T).slice(0,7));if(S.col.tasks[id])continue;n++;await put('tasks',id,{title,sev,due:iso(addDays(T,7)),law,status:'open',module:'ta',at:Date.now(),by:S.meId||null}).catch(()=>{})}
  await logRun('TA · Rà soát tuân thủ tuyển dụng',`${add.length} vấn đề · ${n} việc mới`);toast(n?`Đã tạo ${n} việc cần xử lý`:'Không có vấn đề mới');afterAuto();
}
async function taPurge(){
  const l=M.ta.expiring;const ops=l.map(c=>{const prev=S.col.cands[c.id]||{};const patch={name:'Ứng viên ẩn danh '+c.id.slice(-4),city:'',yob:null,expect:0,anon:true};return['cands',c.id,c.base?{...prev,...patch,_at:Date.now()}:{...Object.fromEntries(CAND_KEYS.map(k=>[k,c[k]])),...prev,...patch,_new:true,_at:Date.now()}]});
  await bulkPut(ops);audit('Ẩn danh hồ sơ hết hạn lưu',`${l.length} hồ sơ`);await logRun('TA · Ẩn danh hồ sơ hết hạn',`${l.length} hồ sơ quá ${TS('retention')} tháng`);toast(`Đã ẩn danh ${l.length} hồ sơ`);
}
async function taPkgApply(){
  if(!S.canAdmin)return toast('Chỉ Editor hoặc Owner được áp dụng');
  const pk=TA_PKGS.find(p=>p.id===(S.f.ta_pkg||'pdpl'))||TA_PKGS[0],cur=S.col.taSettings.main||{},vals={...pk.vals};
  if(pk.input){const x=Number(val('ta_pkgx'));if(!(x>=pk.input.min&&x<=pk.input.max))return toast(`Giá trị phải trong ${pk.input.min}–${pk.input.max}`);vals[pk.input.k]=x}
  const hid=uid();
  try{await put('taSettings','main',{...cur,...vals,updatedAt:Date.now(),updatedBy:S.meId||null});
    await put('taPolicy',hid,{at:Date.now(),by:S.meId||null,pkg:pk.id,name:pk.name,law:pk.law,before:cur,after:{...cur,...vals}});
    for(let i=0;i<pk.tasks.length;i++)await put('tasks',safeId('tap_'+hid+'_'+i),{title:pk.tasks[i],sev:'warn',due:iso(addDays(today(),15)),law:pk.law,status:'open',module:'ta',at:Date.now(),by:S.meId||null}).catch(()=>{});
    audit('Áp dụng quy định tuyển dụng',pk.name);await logRun('TA · Cập nhật quy định: '+pk.name,`${Object.keys(vals).length} tham số · ${pk.tasks.length} việc mới`);toast('Đã áp dụng: '+pk.name);afterAuto()}catch(_){}
}
async function taPkgBack(id){const h=S.col.taPolicy[id];if(!h||!S.canAdmin)return;
  try{await put('taSettings','main',{...(h.before||{}),updatedAt:Date.now(),updatedBy:S.meId||null});await put('taPolicy',id,{...h,rolledBack:Date.now()});audit('Hoàn tác quy định tuyển dụng',h.name);await logRun('TA · Hoàn tác: '+h.name,'Đã khôi phục tham số trước đó');toast('Đã hoàn tác')}catch(_){}}

/* ---- Excel ---- */
function kitSheet(k){
  const t=M.ta;
  switch(k){
   case'req':return['Yêu cầu tuyển dụng',[['Mã','Vị trí','Khối','Bậc','Số lượng','Đã nhận','Ưu tiên','Kênh','Ngân sách','Đã chi','Ngày mở','Hạn','Trạng thái','Lý do tuyển','Phê duyệt'],...M.reqs.map(r=>[r.id,r.title,(DEPT[r.dept]||{}).name,'GS'+z2(r.grade),r.qty,r.hired,r.prio,r.channel,r.budget,r.spent,r.opened,r.target,r.status,'',''])]];
   case'jd':return['JD',[['Mã','Chức danh','Mục đích','Trách nhiệm','Kiến thức (K)','Kỹ năng (S)','Thái độ (A)','Khác (O)','Bắt buộc','Lương P1 từ','Đến','Thử việc (ngày)'],...M.reqs.map(r=>{const j=jdFor(r);return[j.id,j.title,j.purpose,j.tasks.join('\n'),j.K.join('; '),j.S.join('; '),j.A.join('; '),(j.O||[]).join('; '),j.must.join('; '),j.band.min,j.band.max,j.prob]})]];
   case'comp':return['Từ điển năng lực',[['Mã','Năng lực','Tầng','Great Eight','Định nghĩa','A','S','K',...LV,'Câu hỏi STAR 1','Câu hỏi STAR 2','BARS 1','BARS 3','BARS 5'],...COMP.map(c=>[c.id,c.n,{core:'Cốt lõi',lead:'Lãnh đạo',func:'Chuyên môn'}[c.tier],G8[c.g8],c.d,c.A,c.S,c.K,...c.lv,...c.q,c.bars[1],c.bars[3],c.bars[5]])]];
   case'matrix':{const ids=COMP.map(c=>c.id);return['Ma trận năng lực',[['Vị trí','Bậc',...ids],...M.reqs.map(r=>{const p=Object.fromEntries(roleProfile(r).map(x=>[x.id,x.req]));return[r.title,'GS'+z2(r.grade),...ids.map(i=>p[i]||'')]})]]}
   case'camp':return['Chiến dịch',[['Mã','Chiến dịch','Kênh','Thông điệp','Ngân sách','Đã chi','Hiển thị','Click','CTR','Hồ sơ','Đạt sàng lọc','Phỏng vấn','Nhận việc','CPA','Trạng thái'],...BRAND.map(b=>[b.id,b.name,b.ch.map(c=>CH[c].name).join(', '),b.evp.join(', '),b.budget,b.spent,b.reach,'',b.eng,b.ats,'','','','','Thương hiệu']),...t.camps.map(c=>[c.id,c.name,c.ch.name,MSG_TYPES[c.msg]||'',c.budget,c.spent,c.impr,c.clicks,+(c.clicks/Math.max(1,c.impr)).toFixed(4),c.applies,c.qual,c.ints,c.hires,c.spent?Math.round(c.spent/Math.max(1,c.applies)):'',c.status])]];
   case'posts':return['Lịch nội dung MXH',[['Mã','Yêu cầu','Nền tảng','Thông điệp','Ngày','Nội dung','Tiếp cận','Tương tác','Click'],...[...Object.entries(S.col.posts).map(([id,p])=>({...p,id})),...basePosts()].map(p=>[p.id,p.req,p.pf,MSG_TYPES[p.type]||'',p.at,p.text,p.reach,p.react+p.cmt+p.share,p.clicks])]];
   case'cands':return['Ứng viên',[['Mã','Họ tên (mô phỏng)','Yêu cầu','Vị trí','Nguồn','Ngày nộp','Bước','Trạng thái','Kinh nghiệm','Trình độ','Lương kỳ vọng','CV','Test','Bách phân vị','Phỏng vấn','Tham chiếu','Tổng','Lý do','Đồng ý DLCN'],...t.cands.map(c=>[c.id,c.name,c.req,c.r.title,srcName(c.src),c.dates[0],STAGES[c.st].l,ST_NAME[c.status],c.exp,c.edu,c.expect,c.cv,c.tt??'',c.pctl??'',c.ia??'',c.ref||'',c.comp,c.reason||'',c.consentAt])]];
   case'screen':return['Ma trận sàng lọc CV',[['Tiêu chí','Trọng số (%)','1 điểm','3 điểm','5 điểm'],...CV_CRIT.map(([,l,w])=>[l,w,'Không đáp ứng','Đáp ứng','Vượt yêu cầu']),[],['Tiêu chí loại trừ'],...KO.map(k=>[k[1]]),[],['Mã UV','Họ tên','Vị trí',...CV_CRIT.map(c=>c[1]),'Đạt KO','Điểm CV'],...t.cands.filter(c=>c.st<=1&&c.status==='active').map(c=>[c.id,c.name,c.r.title,...CV_CRIT.map(([k])=>c.cvParts[k]),koPass(c)?'Có':'Không',c.cv])]];
   case'test':return['Ngân hàng câu hỏi',[['Mã','Phần','Câu hỏi','A','B','C','D','Đáp án'],...QBANK.map(q=>[q.id,TEST_SEC[q.s],q.q,...q.o,'ABCD'[q.a]])]];
   case'interview':return['Phỏng vấn STAR',[['Năng lực','Câu hỏi','Bối cảnh (S)','Nhiệm vụ (T)','Hành động (A)','Kết quả (R)','Điểm 1–5','Neo 1','Neo 3','Neo 5'],...COMP.flatMap(c=>c.q.map(q=>[c.n,q,'','','','','',c.bars[1],c.bars[3],c.bars[5]]))]];
   case'decide':return['Ma trận quyết định',[['Trọng số','CV '+TS('wCv')+'%','Test '+TS('wTest')+'%','Phỏng vấn '+TS('wInt')+'%','Tham chiếu '+TS('wRef')+'%'],[],['Mã UV','Họ tên','Vị trí','CV','Test','Phỏng vấn','Tham chiếu','Tổng','Qua rào cản','Trạng thái'],...t.cands.filter(c=>c.st>=3).map(c=>[c.id,c.name,c.r.title,c.cv,c.tt??'',c.ia??'',c.ref||'',c.comp,hurdles(c).every(x=>x[1]!==false)?'Có':'Không',ST_NAME[c.status]])]];
   case'offer':return['Offer & phúc lợi',[['Mã UV','Họ tên','Vị trí','Bậc','P1','Gross chính thức','Gross thử việc','BH NLĐ','Thuế TNCN','Thực lĩnh','Chi phí công ty','Thử việc (ngày)','Trạng thái'],...t.cands.filter(c=>c.st>=5).map(c=>{const o=offerCalc(c);return[c.id,c.name,c.r.title,'GS'+z2(c.r.grade),o.p1,Math.round(o.off.gross),Math.round(o.prob.gross),Math.round(o.off.insE),Math.round(o.off.tax),Math.round(o.off.net),Math.round(o.off.cost),o.days,ST_NAME[c.status]]})]];
   case'prob':return['Đánh giá thử việc',[['Mã NV','Họ tên','Vị trí','Bắt đầu','Kết thúc',...PROB_CRIT.map(c=>c[1]+' ('+c[2]+'%)'),'Tổng','Đề xuất'],...t.probEval.map(p=>[p.e.id,p.e.name,p.e.title,p.hire,p.end,...PROB_CRIT.map(([k])=>p.scores?p.scores[k]:''),p.total??'',p.final||p.rec||''])]];
   case'metrics':return['Chỉ số tuyển dụng',metricRows(t)];
  }
}
async function saveXlsx(name,sheets){const data=xlsxBytes(sheets);if(!S.downloads)return toast('Không tải được file');try{await S.downloads.save({filename:name,data,mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});toast('Đã tạo '+name)}catch(_){}}

/* ---- trạng thái nhập liệu không cần render lại ---- */
document.addEventListener('input',ev=>{const el=ev.target,d=el.dataset||{};
  if(d.jd){const r=curReq(false);if(!r)return;S.jdDraft[r.id]={...(S.jdDraft[r.id]||{}),[d.jd]:el.value};clearTimeout(S.jdT);S.jdT=setTimeout(render,400)}
  if(d.sc){if(d.sc==='cand'||d.sc==='rec')S.sc[d.sc]=el.value;else if(d.sc.startsWith('v_'))S.sc.vals[d.sc.slice(2)]=Number(el.value);else if(d.sc.startsWith('n_'))S.sc.notes[d.sc.slice(2)]=el.value}
  if(el.name&&el.name.startsWith('tq_')){S.tt.ans[el.name.slice(3)]=Number(el.value);const b=document.querySelector('.testbar .small');if(b)b.textContent=Object.keys(S.tt.ans).length+'/'+QBANK.length+' câu'}
});
document.addEventListener('change',ev=>{const el=ev.target;if(el.name&&el.name.startsWith('tq_'))S.tt.ans[el.name.slice(3)]=Number(el.value);if(el.dataset&&el.dataset.sc&&el.dataset.sc.startsWith('v_'))S.sc.vals[el.dataset.sc.slice(2)]=Number(el.value)});
setInterval(()=>{if(!S.tt.on)return;const left=TEST_MIN*60-Math.floor((Date.now()-S.tt.start)/1000),el=document.getElementById('ttimer');if(el)el.textContent=Math.max(0,Math.floor(left/60))+':'+z2(Math.max(0,left%60));if(left<=0)ACT.testSubmit()},1000);

Object.assign(ACT,{
 taReq:b=>{S.f.ta_req2=b.dataset.id;S.f.ta_stf='active';go('ta_ats')},
 taAppr:async b=>{const r=M.reqs.find(x=>x.id===b.dataset.id);if(!r)return;const s=(r.appr!=null?Number(r.appr):r._new?1:4)+1,prev=S.col.reqs[r.id]||{};await put('reqs',r.id,{...prev,appr:s,_at:Date.now()}).catch(()=>{});audit('Duyệt yêu cầu tuyển dụng',`${r.id} bước ${s}`)},
 taComp:b=>{S.f.ta_c=b.dataset.id;render()},
 jdCopy:()=>copyText(document.getElementById('jd_out').textContent),
 jdTxt:async()=>{const r=curReq(false);try{await S.downloads.save({filename:'JD-'+r.id+'.txt',data:document.getElementById('jd_out').textContent})}catch(_){}},
 jdPrompt:()=>{const r=curReq(false);copyText(`Bạn là chuyên gia tuyển dụng tại Việt Nam. Hãy biên tập JD dưới đây cho hấp dẫn, rõ ràng, giữ nguyên thông tin lương, không thêm yêu cầu về giới tính, tuổi, ngoại hình, hôn nhân, quê quán (Điều 8 BLLĐ 2019). Trả về JD hoàn chỉnh bằng tiếng Việt.\n\n${document.getElementById('jd_out').textContent}`,'Đã sao chép prompt – dán vào trợ lý AI miễn phí bạn dùng (ứng dụng không gọi AI trả phí)')},
 jdSave:async b=>{const id=b.dataset.id,d=S.jdDraft[id]||{},doc={...(S.col.jds[id]||{}),...(d.purpose!=null?{purpose:d.purpose}:{}),...(d.tasks!=null?{tasks:d.tasks.split('\n').map(x=>x.trim()).filter(Boolean)}:{}),...(d.extra!=null?{extra:d.extra}:{}),approved:true,_at:Date.now(),_by:S.meId||null};
   const flags=biasCheck(jdText({...jdFor(M.reqs.find(r=>r.id===id)),...doc}));if(flags.length)return toast('JD còn ngôn từ vi phạm: '+flags.map(f=>f.hit).join(', '));await put('jds',id,doc).catch(()=>{});delete S.jdDraft[id];audit('Phê duyệt JD',id);toast('Đã lưu JD')},
 jdReset:async b=>{delete S.jdDraft[b.dataset.id];if(S.col.jds[b.dataset.id])await remove('jds',b.dataset.id).catch(()=>{});render()},
 campPause:async b=>{await put('campaigns',b.dataset.id,{...(S.col.campaigns[b.dataset.id]||{}),status:'Tạm dừng',_at:Date.now()}).catch(()=>{});audit('Tạm dừng chiến dịch',b.dataset.id)},
 postPub:async()=>{const r=curReq(true),pf=S.f.ta_pf||'linkedin',type=S.f.ta_mt||'target',text=postText(r,pf,type);if(biasCheck(text).length)return toast('Nội dung chưa đạt kiểm tra');const h=mulberry32(Date.now()%1e9),reach=Math.round(4000+h()*12000);
   await put('posts',uid(),{req:r.id,pf,type,at:iso(today()),text,reach,react:Math.round(reach*.035),cmt:Math.round(reach*.004),share:Math.round(reach*.002),clicks:Math.round(reach*.025),by:S.meId||null}).catch(()=>{});await logRun('TA · Đăng bài '+pf,`${r.title} (${MSG_TYPES[type]})`);toast('Đã đăng (mô phỏng)')},
 postCopy:()=>{const r=curReq(true);copyText(postText(r,S.f.ta_pf||'linkedin',S.f.ta_mt||'target'))},
 postPrompt:()=>{const r=curReq(true);copyText(`Viết lại bài đăng tuyển dụng sau cho nền tảng ${S.f.ta_pf||'linkedin'}, giọng văn tự nhiên, ngắn gọn, có lời kêu gọi hành động. Giữ nguyên mức lương, câu cam kết bình đẳng và không thu phí. Không thêm yêu cầu về giới tính, tuổi, ngoại hình.\n\n${postText(r,S.f.ta_pf||'linkedin',S.f.ta_mt||'target')}`,'Đã sao chép prompt (0 đ)')},
 candNew:()=>candNewDrawer(),
 candSaveNew:async()=>{const name=val('cn_name').trim();if(!name)return toast('Nhập họ tên');if(!document.getElementById('cn_consent').checked)return toast('Cần có đồng ý xử lý dữ liệu cá nhân của ứng viên');
   const id='UM'+uid().slice(-7).toUpperCase(),exp=Number(val('cn_exp'))||0,r=M.reqs.find(x=>x.id===val('cn_req')),c5=x=>clamp(Math.round(x),1,5);
   await put('cands',id,{_new:true,req:r.id,name,gender:'',yob:null,city:'',src:val('cn_src'),edu:val('cn_edu'),exp,expect:Number(val('cn_exp2'))||0,cvParts:{exp:c5(1+exp/Math.max(1,EXP_REQ(r.grade))*2),skill:3,edu:3,ach:3,sal:3},ko:{age:true,consent:true,must:true,wp:true},st:0,status:'active',reason:'',dates:[iso(today())],consentAt:iso(today()),nps:null,msg:'target',_at:Date.now(),_by:S.meId||null}).catch(()=>{});audit('Thêm ứng viên',id);toast('Đã thêm '+id);closeDrawer()},
 cand:b=>candDrawer(b.dataset.id),
 taPg:b=>{S.f.ta_pg=Math.max(0,Number(S.f.ta_pg||0)+Number(b.dataset.d));render()},
 taAll:()=>{S.f.ta_all=!S.f.ta_all;render()},
 candMove:async b=>{const c=findCand(b.dataset.id);if(!c)return;const st=Number(b.dataset.st);
   if(st===5){const h=hurdles(c);if(h.some(x=>x[1]===false)&&!confirm('Ứng viên chưa qua đủ rào cản. Vẫn gửi offer?'))return}
   await moveCand(c,st).catch(()=>{});toast(`${c.name} → ${STAGES[st].l}`);if(!$('#drawerWrap').hidden)candDrawer(c.id)},
 candRej:async b=>{const c=findCand(b.dataset.id);if(!c)return;const reason=prompt('Lý do (hiển thị trong thư cảm ơn, không ghi lý do phân biệt):',REJ[Math.min(5,c.st)][0]);if(reason===null)return;await patchCand(c,{status:'rejected',reason:reason.slice(0,200)},'Loại ứng viên').catch(()=>{});toast('Đã cập nhật');if(!$('#drawerWrap').hidden)candDrawer(c.id)},
 candPool:async b=>{const c=findCand(b.dataset.id);if(c)await patchCand(c,{status:'pool'},'Đưa vào talent pool').catch(()=>{})},
 candWd:async b=>{const c=findCand(b.dataset.id);if(c){await patchCand(c,{status:'withdrawn',reason:'Ứng viên rút hồ sơ'},'Ứng viên rút hồ sơ').catch(()=>{});candDrawer(c.id)}},
 candRef:async b=>{const c=findCand(b.dataset.id);if(c)await patchCand(c,{ref:'ok',st:Math.max(c.st,4),dates:stepDates(c,Math.max(c.st,4))},'Kiểm tra tham chiếu').catch(()=>{})},
 candAnon:async b=>{const c=findCand(b.dataset.id);if(!c||!confirm('Xoá họ tên, nơi ở, năm sinh, lương kỳ vọng của hồ sơ này? Không hoàn tác được.'))return;await patchCand(c,{name:'Ứng viên ẩn danh '+c.id.slice(-4),city:'',yob:null,expect:0,anon:true},'Ẩn danh hồ sơ').catch(()=>{});closeDrawer()},
 candDoc:b=>{const c=findCand(b.dataset.id);if(!c)return;S.f.d_tpl=b.dataset.tpl;S.f.d_cand=c.name;S.f.d_pos=c.r.title;S.f.d_emp='';S.docText=genDoc(b.dataset.tpl,{cand:c.name,pos:c.r.title,date:iso(addDays(today(),3))});closeDrawer();go('docs')},
 autoScreen:b=>autoScreen(b.dataset.id),autoScreenAll:()=>autoScreen(null),
 testStart:()=>{S.tt={on:true,ans:{},cand:val('tt_cand'),start:Date.now(),res:null};render()},
 testSubmit:async()=>{if(!S.tt.on)return;const a=S.tt.ans,res={};for(const k of Object.keys(TEST_SEC)){const qs=QBANK.filter(q=>q.s===k);res[k]=Math.round(qs.filter(q=>a[q.id]===q.a).length/qs.length*100)}res.total=Math.round(avg(Object.keys(TEST_SEC),k=>res[k]));
   const cid=S.tt.cand;S.tt={on:false,ans:{},cand:'',start:0,res:{...res,cand:cid}};
   if(cid){const c=findCand(cid);if(c)await patchCand(c,{test:{V:res.V,N:res.N,L:res.L,J:res.J,at:iso(today())},st:Math.max(c.st,2),dates:stepDates(c,Math.max(c.st,2))},'Ghi kết quả trắc nghiệm').catch(()=>{})}
   await logRun('TA · Trắc nghiệm năng lực',`${cid||'Làm thử'}: ${res.total}/100`);render()},
 scSave:async()=>{const sc=S.sc,c=findCand(sc.cand);if(!c)return toast('Chọn ứng viên');const comps=interviewComps(c.r);if(comps.some(p=>!sc.vals[p.id]))return toast('Chấm đủ các năng lực');
   const id=uid();await put('scorecards',id,{req:c.req,cand:c.id,vals:{...sc.vals},notes:{...sc.notes},rec:sc.rec,at:Date.now(),by:S.meId||null}).catch(()=>{});
   const ints={...(c.ints||{})};for(const p of comps)ints[p.id]=[...(ints[p.id]||[]),sc.vals[p.id]];
   await patchCand(c,{ints,st:Math.max(c.st,3),dates:stepDates(c,Math.max(c.st,3))},'Lưu phiếu chấm phỏng vấn').catch(()=>{});S.sc={req:c.req,cand:'',vals:{},notes:{},rec:''};toast('Đã lưu phiếu chấm');render()},
 taWeights:async()=>{const v={};for(const k of['wCv','wTest','wInt','wRef']){v[k]=Number(val('w_'+k));if(!(v[k]>=0&&v[k]<=100))return toast('Trọng số 0–100')}if(sum(Object.values(v))!==100)return toast('Tổng trọng số phải bằng 100');await put('taSettings','main',{...(S.col.taSettings.main||{}),...v,updatedAt:Date.now()}).catch(()=>{});audit('Đổi trọng số quyết định',JSON.stringify(v));toast('Đã lưu')},
 taOc:b=>{S.f.ta_oc=b.dataset.id;render()},
 offerSave:async b=>{const c=findCand(b.dataset.id),p1=Number(val('of_p1')),band=salaryBand(c.r.grade);if(!(p1>0))return;if(p1<band.min*.9||p1>band.max*1.1)if(!confirm('Mức P1 nằm ngoài khung lương. Vẫn lưu?'))return;await patchCand(c,{offer:{...(c.offer||{}),p1,sentAt:c.offer&&c.offer.sentAt||iso(today())}},'Cập nhật offer').catch(()=>{})},
 offerLetter:b=>{const c=findCand(b.dataset.id);S.f.d_tpl='offer';S.f.d_cand=c.name;S.f.d_pos=c.r.title;S.f.d_emp='';S.docText=genDoc('offer',{cand:c.name,pos:c.r.title,date:iso(addDays(today(),14))});go('docs')},
 offerAccept:async b=>{const c=findCand(b.dataset.id);const start=iso(addDays(today(),14)),d=stepDates(c,5);d[6]=start;await patchCand(c,{st:6,status:'hired',dates:d,offer:{...(c.offer||{}),p1:offerCalc(c).p1,acceptedAt:iso(today())}},'Ứng viên nhận offer').catch(()=>{});
   build();const c2=findCand(c.id);await candToEmp(c2).catch(()=>{});await logRun('TA · Nhận offer',`${c.name} – ${c.r.title}, bắt đầu ${vn(start)}`);toast('Đã tạo hồ sơ thử việc trong HR');afterAuto()},
 offerDecline:async b=>{const c=findCand(b.dataset.id);const reason=prompt('Lý do từ chối:',REJ[5][0]);if(reason===null)return;await patchCand(c,{status:'declined',reason},'Ứng viên từ chối offer').catch(()=>{})},
 candEmp:async b=>{const c=findCand(b.dataset.id);if(c){await candToEmp(c).catch(()=>{});toast('Đã tạo hồ sơ nhân viên')}},
 preOpen:b=>preDrawer(b.dataset.id),
 preToggle:async b=>{const c=findCand(b.dataset.id),pb=S.col.preboard[c.id]||{},start=parse(c.dates[6]||c.dates[5]),cur=pb[b.dataset.k]!==undefined?pb[b.dataset.k]:start<=M.T;await put('preboard',c.id,{...pb,[b.dataset.k]:!cur,_at:Date.now()}).catch(()=>{});build();preDrawer(c.id)},
 probOpen:b=>probDrawer(b.dataset.id),
 probSave:async b=>{const s=readProb();if(Object.keys(s).length<PROB_CRIT.length)return toast('Chấm đủ các tiêu chí');await put('probation',b.dataset.id,{...(S.col.probation[b.dataset.id]||{}),scores:s,note:val('pb_note'),at:Date.now(),by:S.meId||null}).catch(()=>{});toast('Đã lưu đánh giá');build();probDrawer(b.dataset.id)},
 probPass:async b=>{const id=b.dataset.id,e=M.emps.find(x=>x.id===id);if(!e)return;const s=readProb();
   await put('probation',id,{...(S.col.probation[id]||{}),...(Object.keys(s).length?{scores:s}:{}),note:val('pb_note'),final:'pass',at:Date.now(),by:S.meId||null}).catch(()=>{});
   const start=e.probEnd&&parse(e.probEnd)>today()?e.probEnd:iso(today());
   await put('employees',id,{...(S.col.employees[id]||{}),contract:C_DEF,cEnd:iso(addMonths(parse(start),12)),cSeq:1,probEnd:null,_at:Date.now(),_by:S.meId||null}).catch(()=>{});
   await put('onboard',id,{...(S.col.onboard[id]||{}),probEval:true,official:true,_at:Date.now()}).catch(()=>{});
   await put('tasks',safeId('bhxh_'+id),{title:`${e.name}: báo tăng BHXH, BHYT, BHTN từ ${vn(start)}`,sev:'warn',due:iso(addDays(parse(start),30)),law:'Luật BHXH 2024',status:'open',emp:id,module:'ta',at:Date.now(),by:S.meId||null}).catch(()=>{});
   audit('Ký HĐLĐ chính thức sau thử việc',`${id} ${e.name}`);await logRun('TA · Kết thúc thử việc – đạt',`${e.name}: HĐ xác định thời hạn 12 tháng từ ${vn(start)}`);toast('Đã chuyển sang HĐLĐ chính thức');closeDrawer();afterAuto()},
 probFail:async b=>{const id=b.dataset.id,e=M.emps.find(x=>x.id===id);if(!e||!confirm(`Chấm dứt thử việc với ${e.name}? Cần thông báo kết quả bằng văn bản cho người lao động.`))return;
   await put('probation',id,{...(S.col.probation[id]||{}),final:'fail',note:val('pb_note'),at:Date.now(),by:S.meId||null}).catch(()=>{});
   await put('employees',id,{...(S.col.employees[id]||{}),plannedExit:iso(addDays(today(),1)),plannedReason:'Không đạt thử việc',_at:Date.now()}).catch(()=>{});
   audit('Chấm dứt thử việc',`${id} ${e.name}`);await logRun('TA · Kết thúc thử việc – không đạt',e.name);closeDrawer()},
 taInflow,taTestRemind:()=>taTasks('test'),taSchedule:()=>taTasks('interview'),taCompliance,taPurge,taPkgApply,taPkgBack:b=>taPkgBack(b.dataset.id),
 kitOne:b=>{const s=kitSheet(b.dataset.id);return saveXlsx('AMG-TA-'+b.dataset.id+'-'+stamp()+'.xlsx',[{name:s[0],rows:s[1]}])},
 kitAll:()=>saveXlsx('AMG-Talent-Acquisition-Toolkit-'+stamp()+'.xlsx',KIT.map(([k])=>{const s=kitSheet(k);return{name:s[0],rows:s[1]}})),
});
