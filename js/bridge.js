/* Liên thông AMG: HR Analytics ⇄ Sale Analytics.
   HR gửi: hr.roster (nhân sự khối Kinh doanh: đang làm, thử việc, người mới, người nghỉ 12 tháng).
   HR nhận: sale.perf (đạt chỉ tiêu & hoa hồng tháng → tham chiếu lương P3, KPI) và sale.hiring (nhu cầu tuyển sales → yêu cầu tuyển dụng chờ duyệt).
   Dữ liệu đi qua máy chủ của chính Owner (tab AMG_Bridge trong file CSDL riêng tư); không dùng dịch vụ bên ngoài. */
if(!COLS.includes('bridge')){COLS.push('bridge');S.col.bridge={}}
const PEER_SALE=(window.APP_CONFIG&&APP_CONFIG.PEER_SALE)||'https://levitri2711-glitch.github.io/sale-analytics/';
const BR={status:null,loading:false,busy:''};
const brLive=()=>typeof API!=='undefined'&&!!API.session&&!(typeof DEMO!=='undefined'&&DEMO);
const saleLink=(view,label)=>`<a href="${PEER_SALE}${view?'#'+view:''}" target="_blank" rel="noopener">${label||'Sale Analytics'} ↗</a>`;
const brGot=k=>(S.col.bridge||{})[k]||null;
const brName=id=>(M.emps.find(e=>e.id===id)||{}).name||'';

function hrRoster(){const since=iso(addDays(M.T,-365));
  const rows=M.emps.filter(e=>e.dept==='SAL'&&(!e.exit||e.exit>=since)).map(e=>({id:e.id,name:e.name,title:e.title,grade:e.grade,site:e.site,hire:e.hire,probEnd:e.probEnd||null,status:e.status,exit:e.exit||null,exitReason:e.exitReason||null,email:e.email,rating:e.rating||null}));
  return{asOf:iso(M.T),dept:'SAL',rows}}

async function brCall(a,p){if(!brLive())throw new Error('Cần đăng nhập (không chạy ở bản demo) để liên thông với Sale Analytics');return API.call(a,p)}
async function brRun(k,fn){if(BR.busy)return;BR.busy=k;render();try{const s=await fn();await logRun('Liên thông Sale – '+k,s);toast(s)}catch(e){toast((e&&e.message)||'Lỗi liên thông')}finally{BR.busy='';BR.status=null;render()}}
async function brLoadStatus(){if(!brLive()||BR.loading||BR.status)return;BR.loading=true;try{BR.status=await API.call('bridgeStatus',{})}catch(e){BR.status=[]}finally{BR.loading=false;scheduleRender()}}

Object.assign(ACT,{
 brRoster:()=>brRun('gửi nhân sự',async()=>{const d=hrRoster();await brCall('bridgePush',{topic:'hr.roster',data:d});await put('bridge','hr.roster',{at:Date.now(),by:S.meId,n:d.rows.length});
   return `Đã gửi Sale ${d.rows.filter(r=>!r.exit).length} nhân sự kinh doanh đang làm, ${d.rows.filter(r=>r.exit).length} người nghỉ trong 12 tháng`}),
 brPerf:()=>brRun('nhận hiệu suất & hoa hồng',async()=>{const r=await brCall('bridgePull',{topic:'sale.perf'});if(!r||!r.data)return 'Sale chưa gửi hiệu suất – bên Sale chạy “Liên thông HR: gửi hiệu suất & hoa hồng”';
   await put('bridge','sale.perf',Object.assign({},r.data,{from:r.by,sentAt:r.at,pulledAt:Date.now()}));
   return `Nhận hoa hồng tháng ${r.data.month}: ${r.data.rows.length} nhân viên, tổng ${fmtM(r.data.total)} (${r.data.rows.filter(x=>x.hrId).length} đã ghép mã HR)`}),
 brHiring:()=>brRun('nhận nhu cầu tuyển',async()=>{const r=await brCall('bridgePull',{topic:'sale.hiring'});if(!r||!r.data)return 'Sale chưa gửi nhu cầu tuyển dụng';
   await put('bridge','sale.hiring',Object.assign({},r.data,{from:r.by,sentAt:r.at,pulledAt:Date.now()}));
   let n=0;for(const h of r.data.rows){const id='REQ-'+h.key;if(S.col.reqs[id])continue;const op=M.T;
     await put('reqs',id,{_new:true,dept:'SAL',title:h.title,qty:h.qty,grade:h.grade||5,prio:h.prio||'Trung bình',channel:'TopCV / LinkedIn / giới thiệu nội bộ',budget:h.budget||15e6*h.qty,spent:0,
       opened:iso(op),target:iso(addDays(op,45)),applied:0,screened:0,interviewed:0,offered:0,hired:0,status:'Đang tuyển',closed:null,appr:1,src:'Sale Analytics',note:(h.teamName?h.teamName+': ':'')+h.reason,_at:Date.now(),_by:S.meId||null});n++}
   return r.data.rows.length?`Nhận ${r.data.rows.length} nhu cầu từ Sale; tạo ${n} yêu cầu tuyển dụng mới chờ duyệt (bỏ qua ${r.data.rows.length-n} đã có)`:'Sale chưa có nhu cầu tuyển mới'}),
});

function bridgePanel(){if(brLive()&&!BR.status)brLoadStatus();
  const T={'hr.roster':'Nhân sự kinh doanh → Sale','sale.perf':'Hiệu suất & hoa hồng ← Sale','sale.hiring':'Nhu cầu tuyển sales ← Sale'};
  const st=BR.status||[],row=k=>{const s=st.find(x=>x.topic===k);return `<tr><td>${T[k]}</td><td class="small">${s?new Date(s.at).toLocaleString('vi-VN'):'<span class="muted">Chưa có</span>'}</td><td class="small">${s?esc(s.by):''}</td></tr>`};
  const card=(a,t,d)=>`<div class="card"><h4>${t}</h4><p>${d}</p><div><button class="btn pri" data-act="${a}"${brLive()?lock():' disabled title="Cần đăng nhập"'}>${BR.busy&&BR.busy===a?'<span class="spin"></span> Đang chạy…':'Chạy'}</button></div></div>`;
  return panel('Liên thông với Sale Analytics',`<p class="small muted" style="margin:0 0 10px">Hai app cùng tập đoàn AMG trao đổi dữ liệu qua máy chủ riêng của Owner – không qua dịch vụ bên ngoài, không tốn phí.</p>
   <div class="auto">${card('brRoster','Gửi nhân sự kinh doanh sang Sale','Người mới, thử việc, nghỉ việc của khối Kinh doanh → Sale tạo việc giao tuyến, chỉ tiêu tăng dần, bàn giao khách hàng.')}
   ${card('brPerf','Nhận hiệu suất & hoa hồng từ Sale','Bảng đạt chỉ tiêu và hoa hồng tháng đã đóng sổ (đã ghép mã nhân sự) → tham chiếu khi chốt lương P3 và đánh giá KPI.')}
   ${card('brHiring','Nhận nhu cầu tuyển sales từ Sale','Nhóm vượt chỉ tiêu/quá tải khách, vị trí trống do nghỉ việc → yêu cầu tuyển dụng mới ở bước 1 phê duyệt.')}</div>
   ${brLive()?tbl(['Luồng dữ liệu','Lần gần nhất','Người gửi'],Object.keys(T).map(row)):'<p class="banner" style="margin-top:12px">Bản demo không liên thông. Đăng nhập để gửi/nhận dữ liệu với Sale Analytics.</p>'}`,
   {act:saleLink('automation','Mở Sale Analytics'),cls:'mt'})}

function salePerfPanel(kind){const d=brGot('sale.perf');
  if(!d||!d.rows)return panel('Hiệu suất kinh doanh từ Sale Analytics',`<p class="muted small">Chưa nhận dữ liệu. Vào Trung tâm tự động → “Nhận hiệu suất & hoa hồng từ Sale”.</p>`,{act:saleLink('kpi'),cls:'mt'});
  const rows=d.rows.slice().sort((a,b)=>b.commission-a.commission);
  if(kind==='pay')return panel(`Hoa hồng kinh doanh tháng ${esc(d.month)} (Sale Analytics)`,
    tbl(['Mã HR','Nhân viên (HR)','Nhân viên (Sale)',['% đạt'],['Tiền đã thu'],['Hoa hồng']],rows.map(r=>`<tr><td class="mono small">${esc(r.hrId||'—')}</td><td>${esc(brName(r.hrId)||r.hrName||'Chưa ghép')}</td><td class="small">${esc(r.name)} · ${esc(r.title)}</td><td class="n">${pct(r.ach,0)}</td><td class="n">${fmtM(r.collected)}</td><td class="n"><b>${fmtM(r.commission)}</b></td></tr>`),
     `<tr><td colspan="5"><b>Tổng hoa hồng</b></td><td class="n"><b>${fmtM(d.total)}</b></td></tr>`)+
    `<p class="small muted mt">${esc(d.rule||'')}. Hoa hồng là thu nhập từ tiền lương, tiền công: tính vào thu nhập chịu thuế TNCN của kỳ chi trả; không tính vào tiền lương đóng BHXH nếu không gắn với kết quả công việc cố định hằng tháng (theo quy chế lương của AMG).</p>`,
    {sub:`Nhận lúc ${new Date(d.sentAt||d.pulledAt).toLocaleString('vi-VN')}${d.from?' · '+esc(d.from):''}`,act:saleLink('kpi','Chi tiết trên Sale'),cls:'mt'});
  const hit=rows.filter(r=>r.ach>=1).length,low=rows.filter(r=>r.ach<.7);
  return `<div class="kpis mt">${kpi('Đạt chỉ tiêu tháng '+esc(d.month),fmt(hit)+'/'+fmt(rows.length),'Nguồn: Sale Analytics')}${kpi('Dưới 70% chỉ tiêu',fmt(low.length),low.length?'Ứng viên cho kế hoạch cải thiện (PIP)':'Không có',low.length?'warn':'')}${kpi('Tổng hoa hồng',fmtM(d.total),'Đưa vào kỳ lương')}</div>`+
   panel('Hiệu suất bán hàng theo người (Sale Analytics)',tbl(['Nhân viên (HR)','Chức danh Sale',['Chỉ tiêu'],['Doanh thu'],['% đạt'],'Gợi ý'],rows.slice().sort((a,b)=>a.ach-b.ach).map(r=>`<tr><td>${esc(brName(r.hrId)||r.hrName||r.name)}<div class="small muted">${esc(r.hrId||'')}</div></td><td class="small">${esc(r.title)}</td><td class="n">${fmtM(r.tgt)}</td><td class="n">${fmtM(r.rev)}</td><td class="n">${pct(r.ach,0)}</td><td>${r.ach>=1.2?pill('Xét thưởng/thăng tiến','ok'):r.ach<.7?pill('Kèm cặp / PIP','warn'):pill('Theo dõi','mute')}</td></tr>`)),{sub:'Tháng '+esc(d.month),act:saleLink('team','Đội ngũ trên Sale'),cls:'mt'})}

{const a=V.automation;V.automation=()=>a()+bridgePanel()}
{const p=V.payroll;V.payroll=()=>p()+salePerfPanel('pay')}
{const k=V.kpi;V.kpi=()=>k()+salePerfPanel('kpi')}
{const a=document.getElementById('peerSale');if(a)a.href=PEER_SALE}
