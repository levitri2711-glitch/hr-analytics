/* Talent Acquisition – các màn hình. */
"use strict";
const TA_VIEWS=[['ta_dash','Tổng quan tuyển dụng'],['ta_plan','Hoạch định & yêu cầu'],['ta_jd','Phân tích công việc & JD'],['ta_comp','Khung năng lực ASK'],['ta_brand','Thương hiệu & chiến dịch'],['ta_social','Kênh mạng xã hội'],['ta_ats','Pipeline ứng viên'],['ta_screen','Sàng lọc CV'],['ta_test','Trắc nghiệm năng lực'],['ta_interview','Phỏng vấn STAR'],['ta_decide','Ma trận quyết định'],['ta_offer','Offer & phúc lợi'],['ta_onboard','Onboarding & thử việc'],['ta_legal','Pháp lý & dữ liệu ứng viên'],['ta_auto','Tự động hoá tuyển dụng'],['ta_kit','Bộ biểu mẫu Excel']];
const srcName=id=>(CH[id]||{name:id}).name;
const stPill=c=>pill(c.status==='active'?STAGES[c.st].l:ST_NAME[c.status],ST_PILL[c.status]);
const yes=v=>v==null?'<span class="muted">—</span>':v?'<span class="yes">✓</span>':'<span class="no">✗</span>';
function reqOpts(cur,open){const rs=open?M.reqs.filter(r=>r.status!=='Hoàn tất'):M.reqs;return rs.map(r=>`<option value="${esc(r.id)}"${r.id===cur?' selected':''}>${esc(r.id)} · ${esc(r.title)}</option>`).join('')}
function curReq(open){const rs=open?M.reqs.filter(r=>r.status!=='Hoàn tất'):M.reqs;let r=rs.find(x=>x.id===S.f.ta_req);if(!r){r=rs[0];S.f.ta_req=r&&r.id}return r}
const reqSel=(open)=>`<div class="filters"><select data-f="ta_req" aria-label="Chọn yêu cầu tuyển dụng">${reqOpts(curReq(open)&&curReq(open).id,open)}</select></div>`;
const scoreCell=(v,max=5)=>v==null?'<td class="n muted">—</td>':`<td class="n"><span class="heat" style="--h:${(v/max).toFixed(2)}">${typeof v==='number'?(Number.isInteger(v)?v:v.toFixed(1)):v}</span></td>`;

V.ta_dash=()=>{
  const t=M.ta,open=M.openReqs,cs=t.cands,T=M.T;
  const conv=t.stageCount.map((v,i)=>({l:STAGES[i].l,v}));
  const hiresBySrc=countBy(t.hired,c=>srcName(c.src)).sort((a,b)=>b.v-a.v);
  const months=MONTHS.map((_,i)=>{const p=T.getFullYear()+'-'+z2(i+1);return{a:cs.filter(c=>c.dates[0].startsWith(p)).length,h:t.hired.filter(c=>(c.dates[5]||'').startsWith(p)).length}});
  const chRows=CHANNELS.map(ch=>{const l=cs.filter(c=>c.src===ch.id);if(!l.length)return null;const h=l.filter(c=>c.status==='hired').length,cost=sum(t.camps.filter(x=>x.src===ch.id),x=>x.spent);return{ch,n:l.length,q:l.filter(c=>c.st>=1).length/l.length,h,cost,cph:h?cost/h:null,cpa:cost/l.length}}).filter(Boolean).sort((a,b)=>b.h-a.h);
  const flow=[['ta_plan','Hoạch định',open.length,'yêu cầu mở'],['ta_jd','JD & năng lực',open.length,'JD'],['ta_brand','Kênh & chiến dịch',t.camps.filter(c=>c.status==='Đang chạy').length,'đang chạy'],['ta_screen','Sàng lọc',cs.filter(c=>c.status==='active'&&c.st<=1).length,'chờ xử lý'],['ta_test','Trắc nghiệm',cs.filter(c=>c.status==='active'&&c.st===2).length,'đang test'],['ta_interview','Phỏng vấn',cs.filter(c=>c.status==='active'&&c.st===3).length,'chờ chấm'],['ta_decide','Quyết định',cs.filter(c=>c.status==='active'&&c.st===4).length,'chờ duyệt'],['ta_offer','Offer',cs.filter(c=>c.status==='active'&&c.st===5).length,'chờ phản hồi'],['ta_onboard','Thử việc',t.prob.length,'đang thử việc']];
  const aiBad=t.ai.filter(x=>x.ratio<.8);
  return `
  <div class="kpis">
   ${kpi('Yêu cầu đang mở',fmt(open.length),`${sum(open,r=>r.qty-r.hired)} vị trí còn trống`)}
   ${kpi('Ứng viên đang xử lý',fmt(t.active.length),`${fmt(cs.length)} hồ sơ năm ${T.getFullYear()}`)}
   ${kpi('Time-to-fill',Math.round(t.ttf)+' ngày',`Time-to-hire ${Math.round(t.tth)} ngày`,t.ttf>45?'crit':'')}
   ${kpi('Cost-per-hire',fmtM(t.cph),`Ngoài ${fmtB(t.ext)} · nội bộ ${fmtB(t.internal)}`)}
   ${kpi('Tỷ lệ nhận offer',pct(t.offAcc/Math.max(1,t.offAcc+t.offDec),0),`${t.offAcc} nhận · ${t.offDec} từ chối`)}
   ${kpi('Candidate NPS',(t.nps>0?'+':'')+t.nps,'Khảo sát trải nghiệm ứng viên')}
  </div>
  ${panel('Quy trình tuyển dụng đầu – cuối',`<div class="life">${flow.map(([v,l,n,s])=>`<div class="st" data-act="go" data-v="${v}" role="button" tabindex="0"><b>${l}</b><em class="num">${fmt(n)}</em><span>${s}</span></div>`).join('')}</div>`,{sub:'Bấm vào từng bước để mở màn hình xử lý'})}
  <div class="grid g2 mt">
   ${panel('Phễu tuyển dụng năm nay',hbars(conv,{color:'var(--c2)'})+`<p class="small muted">Yield ratio: ${conv.slice(1).map((x,i)=>`${esc(STAGES[i].l)}→${esc(x.l)} ${pct(x.v/Math.max(1,conv[i].v),0)}`).join(' · ')}</p>`)}
   ${panel('Nguồn tuyển thành công (source of hire)',donut(hiresBySrc.slice(0,6)))}
  </div>
  <div class="grid g2 mt">
   ${panel('Hồ sơ và nhận việc theo tháng',colChart(MONTHS,[{n:'Hồ sơ ứng tuyển',c:'var(--c1)',values:months.map(x=>x.a)}],{line:{n:'Nhận offer',c:'var(--c4)',values:months.map(x=>x.h*20)}})+'<p class="small muted">Đường nhận offer nhân 20 để cùng thang.</p>')}
   ${panel('Bình đẳng trong tuyển chọn (quy tắc 4/5)',tbl(['Bước','Tỷ lệ Nam','Tỷ lệ Nữ',['Tỷ số'],'Đánh giá'],t.ai.map(x=>`<tr><td>${esc(x.from)} → ${esc(x.to)}</td><td>${pct(x.g[0].rate,0)}</td><td>${pct(x.g[1].rate,0)}</td><td class="n">${x.ratio.toFixed(2)}</td><td>${x.ratio<.8?pill('Cần rà soát','warn'):pill('Đạt','ok')}</td></tr>`))+`<p class="small muted">Tỷ số tỷ lệ được chọn của nhóm thấp / nhóm cao &lt; 0,8 là dấu hiệu tác động bất lợi (EEOC Uniform Guidelines). Giới tính chỉ dùng thống kê tổng hợp, không dùng để ra quyết định. ${aiBad.length?aiBad.length+' bước cần rà soát.':''}</p>`)}
  </div>
  ${panel('Hiệu quả kênh tuyển dụng',tbl(['Kênh','Loại',['Hồ sơ'],['% đạt sàng lọc'],['Nhận việc'],['Chi phí'],['Chi phí/hồ sơ'],['Chi phí/người']],chRows.map(x=>`<tr><td><span class="dotc" style="background:${x.ch.col}"></span>${esc(x.ch.name)}</td><td>${esc(x.ch.type)}</td><td class="n">${fmt(x.n)}</td><td class="n">${pct(x.q,0)}</td><td class="n">${x.h}</td><td class="n">${fmtM(x.cost)}</td><td class="n">${fmt(x.cpa)}</td><td class="n">${x.cph?fmtM(x.cph):'—'}</td></tr>`)),{cls:'mt',sub:'Cost-per-hire theo SHRM/ANSI: (chi phí bên ngoài + nội bộ) / số người tuyển'})}
  ${panel('Yêu cầu đang mở – tình trạng pipeline',tbl(['Mã','Vị trí',['SL'],['Ngày mở'],...STAGES.slice(0,6).map(s=>[s.l]),'Rủi ro'],open.map(r=>{const l=t.byReq[r.id]||[],age=days(parse(r.opened),T);const n=STAGES.slice(0,6).map((s,k)=>l.filter(c=>c.status==='active'&&c.st===k).length);const risk=age>45&&!n[3]&&!n[4]&&!n[5]?pill('Thiếu ứng viên vòng cuối','crit'):age>45?pill('Quá 45 ngày','warn'):pill('Đúng tiến độ','ok');
    return `<tr class="click" data-act="taReq" data-id="${r.id}"><td class="mono">${r.id}</td><td>${esc(r.title)}</td><td class="n">${r.qty-r.hired}/${r.qty}</td><td class="n">${age}</td>${n.map(v=>`<td class="n">${v||'<span class="muted">0</span>'}</td>`).join('')}<td>${risk}</td></tr>`}))+'<p class="small muted">Số trong cột = ứng viên đang xử lý ở từng bước. Bấm một dòng để mở pipeline.</p>',{cls:'mt'})}`;
};

V.ta_plan=()=>{
  const m=M,T=m.T,G={SAL:1.08,IT:1.1,RND:1.08,PRD:1.05,MKT:1.05};
  const rows=DEPTS.map(d=>{const a=m.active.filter(e=>e.dept===d.id).length,ex=m.exitsY.filter(e=>e.dept===d.id).length,rate=ex/Math.max(1,a)*12/(T.getMonth()+1);
    const plan=Math.round(d.n*(G[d.id]||1)),repl=Math.round(a*rate),need=Math.max(0,plan-a)+repl,op=sum(m.openReqs.filter(r=>r.dept===d.id),r=>r.qty-r.hired);return{d,a,plan,rate,repl,need,op,gap:need-op}});
  const APPR=['Trưởng bộ phận đề xuất','HRBP thẩm định','Giám đốc khối duyệt','CEO duyệt','Đăng tuyển'];
  return `
  <div class="kpis">${kpi('Định biên 2027',fmt(sum(rows,x=>x.plan)),`Hiện có ${fmt(sum(rows,x=>x.a))}`)}${kpi('Nhu cầu tuyển 12 tháng',fmt(sum(rows,x=>x.need)),`${fmt(sum(rows,x=>x.repl))} thay thế nghỉ việc`)}${kpi('Đang tuyển',fmt(sum(rows,x=>x.op)),'vị trí còn trống')}${kpi('Khoảng trống cần mở yêu cầu',fmt(sum(rows,x=>Math.max(0,x.gap))),'',sum(rows,x=>Math.max(0,x.gap))>40?'crit':'')}</div>
  ${panel('Hoạch định nguồn nhân lực theo khối',tbl(['Khối',['Hiện có'],['Định biên 2027'],['Tỷ lệ nghỉ/năm'],['Thay thế dự kiến'],['Nhu cầu tuyển'],['Đang tuyển'],['Khoảng trống']],rows.map(x=>`<tr><td>${esc(x.d.name)}</td><td class="n">${x.a}</td><td class="n">${x.plan}</td><td class="n">${pct(x.rate,0)}</td><td class="n">${x.repl}</td><td class="n">${x.need}</td><td class="n">${x.op}</td><td class="n">${x.gap>0?`<b style="color:var(--crit)">${x.gap}</b>`:x.gap}</td></tr>`)),{sub:'Nhu cầu = (định biên − hiện có) + nghỉ việc dự kiến; cầu – cung nội bộ trước khi tuyển ngoài',act:`<button class="btn sm pri" data-act="newReq"${lock()}>Tạo yêu cầu tuyển dụng</button>`})}
  ${panel('Quy trình phê duyệt yêu cầu tuyển dụng',tbl(['Mã','Vị trí','Bậc','Bước hiện tại','Tiến độ',''],m.reqs.filter(r=>r.status!=='Hoàn tất').map(r=>{const s=r.appr!=null?Number(r.appr):r._new?1:4;return `<tr><td class="mono">${r.id}</td><td>${esc(r.title)}</td><td>GS${z2(r.grade)}</td><td>${esc(APPR[s])}</td><td><div class="prog"><i style="width:${s/4*100}%"></i></div></td><td>${s<4?`<button class="btn sm" data-act="taAppr" data-id="${r.id}"${lock()}>Duyệt bước này</button>`:pill('Đã đăng tuyển','ok')}</td></tr>`}))+'<p class="small muted">Vị trí GS09 trở lên hoặc ngoài định biên cần CEO duyệt. Ưu tiên tuyển nội bộ (đăng nội bộ 5 ngày làm việc) trước khi tuyển ngoài.</p>',{cls:'mt'})}
  ${panel('Lựa chọn nguồn: nội bộ hay bên ngoài',`<div class="grid g2"><div class="small"><b>Tuyển nội bộ</b><ul class="list"><li>Ưu: hiểu văn hoá, nhanh, chi phí thấp, tạo động lực thăng tiến.</li><li>Nhược: hạn chế ý tưởng mới, tạo vị trí trống dây chuyền.</li><li>Công cụ: job posting nội bộ, kế hoạch kế nhiệm, talent pool.</li></ul></div><div class="small"><b>Tuyển bên ngoài</b><ul class="list"><li>Ưu: nguồn rộng, mang kỹ năng mới.</li><li>Nhược: chi phí, thời gian hội nhập dài, rủi ro phù hợp văn hoá.</li><li>Công cụ: trang việc làm, mạng xã hội, giới thiệu, headhunter, campus.</li></ul></div></div><p class="small muted">Chiến lược tuyển gồm 6 bước: mục tiêu → tuyển mở hay nhắm mục tiêu → tổ chức & ngân sách → phản ứng của ứng viên → thông điệp (thương hiệu, nhắm mục tiêu, thực tế công việc) → triển khai và đánh giá bằng chỉ số.</p>`,{cls:'mt'})}`;
};

V.ta_jd=()=>{
  const r=curReq(false);if(!r)return '<p>Chưa có yêu cầu.</p>';
  const jd=jdFor(r),d=S.jdDraft[r.id]||{},txt=jdText({...jd,...d,tasks:d.tasks?d.tasks.split('\n').filter(Boolean):jd.tasks});
  const flags=biasCheck(txt),crit=FAM[r.dept]?FAM[r.dept].t:[];
  const imp=crit.map((t,i)=>{const h=mulberry32(hseed(r.id+i));const I=3+Math.round(h()*2),F=2+Math.round(h()*3);return{t,I,F,c:I*F}});
  return `${reqSel(false)}
  <div class="grid g2">
   ${panel('Mô tả công việc (JD)',`<pre class="doc" id="jd_out">${esc(txt)}</pre>`,{sub:jd.approved?'Đã phê duyệt':'Bản nháp',act:`<button class="btn sm" data-act="jdCopy">Sao chép</button><button class="btn sm" data-act="jdTxt">Tải .txt</button><button class="btn sm" data-act="jdPrompt">Prompt AI (0 đ)</button>`})}
   <div>
    ${panel('Kiểm tra ngôn từ phân biệt đối xử',flags.length?`<div class="list">${flags.map(f=>`<div class="sev crit"><b>“${esc(f.hit)}”</b> – ${esc(f.msg)}<div class="small muted">${esc(f.law)}</div></div>`).join('')}</div>`:`<p class="small" style="color:var(--ok)">✓ Không phát hiện yêu cầu về giới tính, tuổi, ngoại hình, hôn nhân, quê quán, tôn giáo, thu phí hay giữ giấy tờ.</p>`,{sub:'Điều 8, 11, 17 BLLĐ 2019 · Luật Việc làm 2025 · ILO C111'})}
    ${panel('Chỉnh sửa JD',`<div class="form"><label class="full">Mục đích công việc<textarea data-jd="purpose" id="jd_p" rows="2">${esc(d.purpose??jd.purpose)}</textarea></label><label class="full">Trách nhiệm (mỗi dòng một việc)<textarea data-jd="tasks" id="jd_t" rows="6">${esc(d.tasks??jd.tasks.join('\n'))}</textarea></label><label class="full">Ghi chú thêm vào JD<textarea data-jd="extra" id="jd_x" rows="2" placeholder="Ví dụ: Ưu tiên ứng viên có chứng chỉ IPC-A-610">${esc(d.extra??jd.extra)}</textarea></label></div><div style="margin-top:10px;display:flex;gap:8px"><button class="btn pri" data-act="jdSave" data-id="${r.id}"${lock()}>Lưu & phê duyệt JD</button><button class="btn" data-act="jdReset" data-id="${r.id}"${lock()}>Về mẫu chuẩn</button></div>`,{cls:'mt'})}
   </div>
  </div>
  <div class="grid g2 mt">
   ${panel('Phân tích công việc dựa trên nhiệm vụ',tbl(['Nhiệm vụ',['Quan trọng'],['Tần suất'],['Mức then chốt']],imp.sort((a,b)=>b.c-a.c).map(x=>`<tr><td>${esc(x.t)}</td><td class="n">${x.I}</td><td class="n">${x.F}</td>${scoreCell(x.c,25)}</tr>`))+'<p class="small muted">Thu thập bằng phỏng vấn người làm, quản lý trực tiếp, bảng hỏi, quan sát. Mức then chốt = quan trọng × tần suất; nhiệm vụ then chốt dùng để chọn KSAO và câu hỏi phỏng vấn.</p>')}
   ${panel('KSAO ↔ mô hình ASK',tbl(['Yếu tố','Nội dung','ASK'],[['K – Kiến thức',jd.K.join('; '),'Knowledge'],['S – Kỹ năng',jd.S.join('; '),'Skills'],['A – Năng lực/thái độ',jd.A.join('; '),'Attitude'],['O – Yếu tố khác',(jd.O||[]).join('; '),'Điều kiện, chứng chỉ']].map(x=>`<tr><td><b>${x[0]}</b></td><td>${esc(x[1])}</td><td>${x[2]}</td></tr>`))+`<p class="small muted">Tiếp cận dựa trên năng lực: chuyển KSAO thành năng lực có thang hành vi (xem Khung năng lực ASK).</p>`)}
  </div>`;
};

V.ta_comp=()=>{
  const sel=CP[S.f.ta_c]||COMP[0],reqs=M.openReqs;
  const used=COMP.filter(c=>reqs.some(r=>roleProfile(r).some(x=>x.id===c.id)));
  const tier={core:'Năng lực cốt lõi (mọi nhân viên)',lead:'Năng lực lãnh đạo (GS07 trở lên)',func:'Năng lực chuyên môn (theo chức danh)'};
  return `
  <div class="grid g12">${Object.entries(tier).map(([k,l])=>panel(l,`<div class="chips">${COMP.filter(c=>c.tier===k).map(c=>`<button class="btn sm${c.id===sel.id?' pri':''}" data-act="taComp" data-id="${c.id}">${esc(c.n)}</button>`).join('')}</div>`)).join('')}</div>
  <div class="grid g2 mt">
   ${panel(esc(sel.n),`<p class="small">${esc(sel.d)}</p><div class="kv"><div>Great Eight</div><div>${esc(G8[sel.g8])}</div><div>A – Thái độ</div><div>${esc(sel.A)}</div><div>S – Kỹ năng</div><div>${esc(sel.S)}</div><div>K – Kiến thức</div><div>${esc(sel.K)}</div></div>
    <h4 style="margin:12px 0 6px">Thang hành vi 5 cấp</h4>${tbl(['Cấp','Biểu hiện hành vi'],sel.lv.map((x,i)=>`<tr><td class="nowrap">${LV[i]}</td><td>${esc(x)}</td></tr>`))}`,{sub:tier[sel.tier]})}
   ${panel('Câu hỏi hành vi STAR & thang chấm BARS',`<ol class="small">${sel.q.map(q=>`<li style="margin-bottom:6px">${esc(q)}<div class="muted">Hỏi thêm: Bối cảnh (S)? Nhiệm vụ của bạn (T)? Bạn đã làm gì (A)? Kết quả đo được (R)?</div></li>`).join('')}</ol>${tbl(['Điểm','Neo hành vi'],[1,3,5].map(k=>`<tr><td class="n">${k}</td><td>${esc(sel.bars[k])}</td></tr>`))}<p class="small muted">Điểm 2 và 4 dùng khi bằng chứng nằm giữa hai mức neo.</p>`)}
  </div>
  ${panel('Ma trận năng lực theo chức danh đang tuyển (cấp yêu cầu)',`<div class="tw"><table class="tbl heatmap"><thead><tr><th>Vị trí</th>${used.map(c=>`<th title="${esc(c.n)}">${esc(c.id)}</th>`).join('')}</tr></thead><tbody>${reqs.map(r=>{const p=Object.fromEntries(roleProfile(r).map(x=>[x.id,x.req]));return `<tr><td>${esc(r.title)} <span class="muted">GS${z2(r.grade)}</span></td>${used.map(c=>p[c.id]?`<td class="n"><span class="heat" style="--h:${(p[c.id]/5).toFixed(2)}">${p[c.id]}</span></td>`:'<td></td>').join('')}</tr>`}).join('')}</tbody></table></div><p class="small muted">${used.map(c=>`<b>${c.id}</b> ${esc(c.n)}`).join(' · ')}</p>`,{cls:'mt'})}`;
};

V.ta_brand=()=>{
  const t=M.ta,cs=t.camps.filter(c=>c.status==='Đang chạy');
  const ab=Object.keys(MSG_TYPES).map(k=>{const l=t.cands.filter(c=>c.msg===k);return{k,n:l.length,q:l.filter(c=>c.st>=1).length/Math.max(1,l.length),h:l.filter(c=>c.status==='hired').length/Math.max(1,l.length),ret:l.filter(c=>c.st>=3).length/Math.max(1,l.length)}});
  return `
  ${panel('Giá trị đề xuất cho nhân viên (EVP)',`<div class="chips">${EVP.map(x=>pill(x,'info')).join(' ')}</div><p class="small muted">Thông điệp nhất quán trên mọi kênh; dùng xem trước thực tế công việc (RJP) để giảm nghỉ việc sớm.</p>`)}
  ${panel('Chiến dịch thương hiệu tuyển dụng',tbl(['Mã','Chiến dịch','Kênh','Đối tượng',['Ngân sách'],['Đã chi'],['Tiếp cận'],['Tương tác'],['Lead'],['Vào ATS']],BRAND.map(b=>`<tr><td class="mono">${b.id}</td><td><b>${esc(b.name)}</b><div class="small muted">${b.evp.join(' · ')}</div></td><td>${b.ch.map(c=>`<span class="dotc" style="background:${CH[c].col}" title="${esc(CH[c].name)}"></span>`).join('')}</td><td class="small">${esc(b.target)}</td><td class="n">${fmtM(b.budget)}</td><td class="n">${fmtM(b.spent)}</td><td class="n">${fmt(b.reach)}</td><td class="n">${pct(b.eng)}</td><td class="n">${fmt(b.leads)}</td><td class="n">${fmt(b.ats)}</td></tr>`)),{cls:'mt'})}
  ${panel('Thử nghiệm A/B loại thông điệp',tbl(['Thông điệp',['Hồ sơ'],['% đạt sàng lọc'],['% vào phỏng vấn'],['% nhận việc']],ab.map(x=>`<tr><td>${esc(MSG_TYPES[x.k])}</td><td class="n">${fmt(x.n)}</td><td class="n">${pct(x.q)}</td><td class="n">${pct(x.ret)}</td><td class="n">${pct(x.h)}</td></tr>`))+'<p class="small muted">Thông điệp nhắm mục tiêu thường tăng số hồ sơ; RJP giảm số lượng nhưng tăng tỷ lệ phù hợp và giữ chân.</p>',{cls:'mt'})}
  ${panel('Chiến dịch theo yêu cầu tuyển dụng (đang chạy)',tbl(['Chiến dịch','Thông điệp',['Ngân sách'],['Đã chi'],['Hiển thị'],['Click'],['CTR'],['Hồ sơ'],['CPA'],['Nhận việc'],''],cs.map(c=>`<tr><td><span class="dotc" style="background:${c.ch.col}"></span>${esc(c.name)}<div class="small muted mono">${c.id}</div></td><td class="small">${esc(MSG_TYPES[c.msg]||'')}</td><td class="n">${fmtM(c.budget)}</td><td class="n">${fmtM(c.spent)}</td><td class="n">${fmt(c.impr)}</td><td class="n">${fmt(c.clicks)}</td><td class="n">${pct(c.clicks/Math.max(1,c.impr))}</td><td class="n">${c.applies}</td><td class="n">${c.spent?fmt(c.spent/Math.max(1,c.applies)):'—'}</td><td class="n">${c.hires}</td><td><button class="btn sm" data-act="campPause" data-id="${c.id}"${lock()}>Tạm dừng</button></td></tr>`)),{cls:'mt',sub:'Số liệu mô phỏng; chi phí kênh trả phí phân bổ theo số hồ sơ'})}`;
};

function postText(r,pf,type){
  const jd=jdFor(r),b=jd.band,site=(SITES[jd.site]||SITES.HCM).name,hook={brand:`Tại AMG Việt Nam, mỗi thiết bị chúng tôi làm ra đang vận hành hàng nghìn nhà máy.`,target:`Bạn có ${jd.exp?jd.exp+'+ năm kinh nghiệm':'mong muốn bắt đầu sự nghiệp'} trong lĩnh vực ${(DEPT[r.dept]||{}).name||''}?`,rjp:`Một ngày làm ${jd.title} tại AMG: ${jd.tasks[0].toLowerCase()}, ${jd.tasks[1].toLowerCase()}.`}[type];
  const foot='AMG là nhà tuyển dụng bình đẳng, không thu bất kỳ khoản phí nào của ứng viên. Dữ liệu ứng viên được xử lý theo Luật Bảo vệ dữ liệu cá nhân 2025.';
  const ben=[`Lương ${fmtM(b.min)}–${fmtM(b.max)} + thưởng thành tích`,'BHXH, BHYT, BHTN đầy đủ + bảo hiểm sức khoẻ','Lộ trình đào tạo, khung năng lực rõ ràng',`${P('leaveBase')} ngày phép năm, thưởng tháng 13`];
  const tag='#AMGCareers #TuyenDung #'+slug((DEPT[r.dept]||{}).name||'').replace(/\./g,'');
  if(pf==='linkedin')return `🚀 AMG Việt Nam tuyển ${jd.title} – ${site}\n\n${hook}\n\nBạn sẽ:\n${jd.tasks.slice(0,3).map(x=>'• '+x).join('\n')}\n\nChúng tôi tìm:\n${jd.must.slice(0,3).map(x=>'• '+x).join('\n')}\n\nBạn nhận được:\n${ben.map(x=>'• '+x).join('\n')}\n\n👉 Ứng tuyển qua trang tuyển dụng AMG (mã ${r.id}).\n\n${foot}\n${tag}`;
  if(pf==='facebook')return `🔥 ${hook}\n\n📍 ${site} · ${r.qty} vị trí ${jd.title}\n💰 ${ben[0]}\n🛡️ ${ben[1]}\n📚 ${ben[2]}\n\n✅ Yêu cầu: ${jd.must.slice(0,2).join(', ')}\n📩 Inbox fanpage hoặc nộp hồ sơ online – phản hồi trong 3 ngày làm việc.\n\n${foot}\n${tag}`;
  if(pf==='tiktok')return `KỊCH BẢN VIDEO 30 GIÂY – ${jd.title}\n[0–3s] Hook: “${hook}”\n[3–12s] Cảnh làm việc thật: ${jd.tasks[0].toLowerCase()} (quay tại ${site}).\n[12–22s] Nhân viên hiện tại chia sẻ 1 câu về môi trường, đào tạo.\n[22–27s] Chữ trên màn hình: ${ben[0]} · ${ben[1]}\n[27–30s] CTA: Bấm link trong bio, mã ${r.id}.\nCaption: ${jd.title} tại AMG ${tag} #ViecLam\nGhi chú: ${foot}`;
  if(pf==='zalo')return `[AMG Việt Nam] Tuyển ${r.qty} ${jd.title} tại ${site}. ${ben[0]}. ${ben[1]}. Nộp hồ sơ: trang tuyển dụng AMG, mã ${r.id}. ${foot}`;
  return `${jd.title.toUpperCase()}\nĐịa điểm: ${site} · Số lượng: ${r.qty} · Hạn nộp: ${vn(r.target)}\nMức lương: ${fmtM(b.min)} – ${fmtM(b.max)}\n\nMÔ TẢ CÔNG VIỆC\n${jd.tasks.map(x=>'- '+x).join('\n')}\n\nYÊU CẦU\n${jd.must.map(x=>'- '+x).join('\n')}\n\nQUYỀN LỢI\n${ben.map(x=>'- '+x).join('\n')}\n\n${foot}`;
}
const PF=[['linkedin','LinkedIn'],['facebook','Facebook'],['tiktok','TikTok'],['zalo','Zalo OA'],['topcv','TopCV'],['vnw','VietnamWorks'],['itviec','ITviec']];
function basePosts(){
  const out=[];for(const r of M.openReqs){const mix=sourceMix(r).filter(x=>PF.some(p=>p[0]===x.id)).slice(0,2);mix.forEach((x,i)=>{const h=mulberry32(hseed(r.id+x.id));const type=['target','brand','rjp'][Math.floor(h()*3)];const reach=Math.round((x.id==='tiktok'?18000:x.id==='facebook'?9000:x.id==='linkedin'?5200:3000)*(.6+h()));
    out.push({id:'PB-'+r.id.slice(-2)+'-'+x.id,req:r.id,pf:x.id,type,at:iso(addDays(parse(r.opened),1+i*5)),text:postText(r,x.id,type),reach,react:Math.round(reach*(.02+h()*.04)),cmt:Math.round(reach*(.002+h()*.006)),share:Math.round(reach*(.001+h()*.004)),clicks:Math.round(reach*(.015+h()*.03)),base:true})})}
  return out;
}
V.ta_social=()=>{
  const r=curReq(true),pf=S.f.ta_pf||'linkedin',type=S.f.ta_mt||'target';
  const draft=r?postText(r,pf,type):'',flags=biasCheck(draft);
  const posts=[...Object.entries(S.col.posts).map(([id,p])=>({...p,id})),...basePosts()].sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  const show=posts.filter(p=>(S.f.ta_feed||'all')==='all'||p.pf===S.f.ta_feed).slice(0,24);
  const pfName=k=>(PF.find(x=>x[0]===k)||[k,k])[1];
  return `
  <div class="grid g2">
   ${panel('Soạn bài đăng tuyển dụng',`<div class="filters"><select data-f="ta_req">${reqOpts(r&&r.id,true)}</select><select data-f="ta_pf">${PF.map(([k,l])=>`<option value="${k}"${k===pf?' selected':''}>${l}</option>`).join('')}</select><select data-f="ta_mt">${Object.entries(MSG_TYPES).map(([k,l])=>`<option value="${k}"${k===type?' selected':''}>${l}</option>`).join('')}</select></div>
    <div class="post pf-${pf}"><div class="ph"><span class="av">AMG</span><div><b>AMG Việt Nam</b><small>${pfName(pf)} · Được tài trợ · bản xem trước</small></div></div><pre>${esc(draft)}</pre></div>
    ${flags.length?`<div class="sev crit small">${flags.map(f=>esc(f.msg)).join('; ')}</div>`:'<p class="small" style="color:var(--ok)">✓ Nội dung đạt kiểm tra không phân biệt đối xử.</p>'}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn pri" data-act="postPub"${lock()}>Đăng (mô phỏng)</button><button class="btn" data-act="postCopy">Sao chép nội dung</button><button class="btn" data-act="postPrompt">Prompt AI viết lại (0 đ)</button></div>
    <p class="small muted">Ứng dụng không kết nối tài khoản mạng xã hội thật và không tự đăng bài. Khi đăng thật, dùng tài khoản doanh nghiệp và tuân thủ Luật Quảng cáo, chính sách của từng nền tảng.</p>`)}
   ${panel('Hiệu quả theo nền tảng',tbl(['Nền tảng',['Bài'],['Tiếp cận'],['Tương tác'],['Click'],['Tỷ lệ tương tác']],PF.map(([k,l])=>{const p=posts.filter(x=>x.pf===k);if(!p.length)return '';const re=sum(p,x=>x.reach),en=sum(p,x=>x.react+x.cmt+x.share);return `<tr><td><span class="dotc" style="background:${CH[k].col}"></span>${l}</td><td class="n">${p.length}</td><td class="n">${fmt(re)}</td><td class="n">${fmt(en)}</td><td class="n">${fmt(sum(p,x=>x.clicks))}</td><td class="n">${pct(en/Math.max(1,re))}</td></tr>`}))+`<div class="filters" style="margin-top:12px"><select data-f="ta_feed"><option value="all">Bảng tin: mọi nền tảng</option>${PF.map(([k,l])=>`<option value="${k}"${S.f.ta_feed===k?' selected':''}>${l}</option>`).join('')}</select></div>`)}
  </div>
  <div class="feed mt">${show.map(p=>`<article class="post pf-${p.pf}"><div class="ph"><span class="av">AMG</span><div><b>AMG Việt Nam</b><small>${pfName(p.pf)} · ${vn(p.at)}${p.base?'':' · '+esc(nameOf(p.by))}</small></div></div><pre>${esc(String(p.text).slice(0,520))}${String(p.text).length>520?'…':''}</pre><div class="pm"><span>👁 ${fmt(p.reach)}</span><span>👍 ${fmt(p.react)}</span><span>💬 ${fmt(p.cmt)}</span><span>↗ ${fmt(p.share)}</span><span>🔗 ${fmt(p.clicks)}</span></div></article>`).join('')}</div>`;
};

V.ta_ats=()=>{
  const t=M.ta,f=S.f;let l=t.cands;
  if(f.ta_req2)l=l.filter(c=>c.req===f.ta_req2);
  if(f.ta_src)l=l.filter(c=>c.src===f.ta_src);
  const stf=f.ta_stf||'active';if(stf!=='all')l=l.filter(c=>c.status===stf);
  if(f.ta_q){const q=f.ta_q.toLowerCase();l=l.filter(c=>c.name.toLowerCase().includes(q)||c.id.toLowerCase().includes(q))}
  const mode=f.ta_mode||'kanban';
  const filters=`<div class="filters"><input data-f="ta_q" id="ta_q" placeholder="Tìm tên hoặc mã ứng viên" value="${esc(f.ta_q||'')}"><select data-f="ta_req2"><option value="">Mọi yêu cầu</option>${reqOpts(f.ta_req2,false)}</select><select data-f="ta_src"><option value="">Mọi nguồn</option>${CHANNELS.map(c=>`<option value="${c.id}"${f.ta_src===c.id?' selected':''}>${esc(c.name)}</option>`).join('')}</select><select data-f="ta_stf">${[['active','Đang xử lý'],['all','Mọi trạng thái'],...Object.entries(ST_NAME).filter(([k])=>k!=='active')].map(([k,v])=>`<option value="${k}"${stf===k?' selected':''}>${v}</option>`).join('')}</select><select data-f="ta_mode"><option value="kanban"${mode==='kanban'?' selected':''}>Kanban</option><option value="table"${mode==='table'?' selected':''}>Bảng</option></select><button class="btn pri" data-act="candNew"${lock()}>Thêm ứng viên</button></div>`;
  if(mode==='kanban'){
    const cols=STAGES.map((s,k)=>{const x=l.filter(c=>c.st===k).sort((a,b)=>b.comp-a.comp);return `<div class="kcol"><h4>${esc(s.l)} <span class="cnt">${x.length}</span></h4>${x.slice(0,30).map(c=>`<div class="kcard" data-act="cand" data-id="${c.id}" role="button" tabindex="0"><b>${esc(c.name)}</b><span class="small muted">${esc(c.r.title)}</span><span class="small">${esc(srcName(c.src))} · ${c.comp} điểm</span>${c.status!=='active'?stPill(c):''}</div>`).join('')}${x.length>30?`<p class="small muted">+${x.length-30} ứng viên khác (xem dạng bảng)</p>`:''}</div>`}).join('');
    return filters+`<div class="kanban">${cols}</div><p class="small muted">${fmt(l.length)} ứng viên · sắp xếp theo điểm tổng hợp. Bấm thẻ để xem hồ sơ và chuyển bước.</p>`;
  }
  const pg=Number(f.ta_pg||0),per=50,rows=l.sort((a,b)=>String(b.lastAt).localeCompare(String(a.lastAt))).slice(pg*per,pg*per+per);
  return filters+panel('Danh sách ứng viên',tbl(['Mã','Họ tên','Vị trí','Nguồn','Ngày nộp','Trạng thái',['CV'],['Test'],['PV'],['Tổng']],rows.map(c=>`<tr class="click" data-act="cand" data-id="${c.id}"><td class="mono">${c.id}</td><td>${esc(c.name)}</td><td>${esc(c.r.title)}</td><td>${esc(srcName(c.src))}</td><td>${vn(c.dates[0])}</td><td>${stPill(c)}</td><td class="n">${c.cv}</td><td class="n">${c.tt??'—'}</td><td class="n">${c.ia??'—'}</td><td class="n"><b>${c.comp}</b></td></tr>`))+`<div class="pager"><button class="btn sm" data-act="taPg" data-d="-1"${pg?'':' disabled'}>‹ Trước</button><span class="small">Trang ${pg+1}/${Math.max(1,Math.ceil(l.length/per))} · ${fmt(l.length)} ứng viên</span><button class="btn sm" data-act="taPg" data-d="1"${(pg+1)*per<l.length?'':' disabled'}>Sau ›</button></div>`);
};

V.ta_screen=()=>{
  const r=curReq(true);if(!r)return '<p>Không có yêu cầu đang mở.</p>';
  const l=(M.ta.byReq[r.id]||[]).filter(c=>c.st<=1&&(c.status==='active'||S.f.ta_all)).sort((a,b)=>b.cv-a.cv);
  const cut=TS('cvCut');
  return `${reqSel(true)}
  <div class="grid g2">
   ${panel('Tiêu chí loại trừ (knockout)',`<ul class="list small">${KO.map(k=>`<li>${esc(k[1])}</li>`).join('')}</ul><p class="small muted">Không dùng giới tính, tuổi (ngoài điều kiện đủ 18), ngoại hình, tình trạng hôn nhân, quê quán làm tiêu chí.</p>`)}
   ${panel('Ma trận chấm điểm CV',tbl(['Tiêu chí',['Trọng số'],'Thang 1–5'],CV_CRIT.map(([k,l,w])=>`<tr><td>${esc(l)}</td><td class="n">${w}%</td><td class="small muted">1 không đáp ứng · 3 đáp ứng · 5 vượt yêu cầu</td></tr>`))+`<p class="small">Ngưỡng đạt: <b>${cut}</b>/100 · Điểm = Σ(điểm × trọng số)/5</p>`)}
  </div>
  ${panel(`Hồ sơ chờ sàng lọc – ${esc(r.title)}`,tbl(['Ứng viên','Nguồn',...CV_CRIT.map(c=>[c[1].split(' ')[0]]),'KO',['Điểm'],'Đề xuất',''],l.map(c=>{const ko=koPass(c),ok=ko&&c.cv>=cut;return `<tr><td><a href="#" data-act="cand" data-id="${c.id}">${esc(c.name)}</a><div class="small muted">${c.exp} năm KN · ${esc(c.edu)} · kỳ vọng ${fmtM(c.expect)}</div></td><td class="small">${esc(srcName(c.src))}</td>${CV_CRIT.map(([k])=>scoreCell(c.cvParts[k])).join('')}<td>${yes(ko)}</td><td class="n"><b>${c.cv}</b></td><td>${c.status!=='active'?stPill(c):ok?pill('Đạt','ok'):pill('Loại','mute')}</td><td>${c.status==='active'?`<button class="btn sm" data-act="candMove" data-id="${c.id}" data-st="${c.st===0?1:2}"${lock()}>${c.st===0?'Đạt sàng lọc':'Gửi bài test'}</button> <button class="btn sm ghost" data-act="candRej" data-id="${c.id}"${lock()}>Loại</button>`:''}</td></tr>`}))+`<label class="small" style="display:flex;gap:6px;margin-top:8px"><input type="checkbox" data-act="taAll"${S.f.ta_all?' checked':''}> Hiện cả hồ sơ đã xử lý</label>`,{cls:'mt',act:`<button class="btn sm pri" data-act="autoScreen" data-id="${r.id}"${lock()}>Sàng lọc tự động yêu cầu này</button>`})}`;
};

V.ta_test=()=>{
  const t=M.ta,tt=S.tt,tested=t.cands.filter(c=>c.tt!=null);
  const bins=[0,10,20,30,40,50,60,70,80,90].map(a=>tested.filter(c=>c.tt>=a&&c.tt<a+10).length);
  const cut=TS('testCut');
  const cands=t.cands.filter(c=>c.status==='active'&&(c.st===1||c.st===2)).slice(0,200);
  const left=tt.on?Math.max(0,TEST_MIN*60-Math.floor((Date.now()-tt.start)/1000)):0;
  const test=tt.on?`<div class="testbar"><b>Đang làm bài${tt.cand?' cho '+esc((t.cands.find(c=>c.id===tt.cand)||{}).name||''):' (làm thử)'}</b><span class="mono" id="ttimer">${Math.floor(left/60)}:${z2(left%60)}</span><span class="small">${Object.keys(tt.ans).length}/${QBANK.length} câu</span><button class="btn pri sm" data-act="testSubmit">Nộp bài</button></div>${QBANK.map((q,i)=>`<fieldset class="tq"><legend><b>Câu ${i+1}</b> · ${TEST_SEC[q.s]}</legend><p>${esc(q.q)}</p>${q.o.map((o,j)=>`<label><input type="radio" name="tq_${q.id}" value="${j}"${tt.ans[q.id]===j?' checked':''}> ${esc(o)}</label>`).join('')}</fieldset>`).join('')}<button class="btn pri" data-act="testSubmit">Nộp bài</button>`
   :`<div class="form"><label class="full">Người làm bài<select id="tt_cand"><option value="">Làm thử (không ghi vào hồ sơ)</option>${cands.map(c=>`<option value="${c.id}">${esc(c.id)} · ${esc(c.name)} · ${esc(c.r.title)}</option>`).join('')}</select></label></div><div style="margin-top:10px"><button class="btn pri" data-act="testStart">Bắt đầu bài ${QBANK.length} câu · ${TEST_MIN} phút</button></div>${tt.res?`<div class="panel mt"><h4>Kết quả: ${tt.res.total}/100 · bách phân vị ${t.pctl(tt.res.total)??'—'}</h4>${hbars(Object.entries(TEST_SEC).map(([k,l])=>({l,v:tt.res[k]})),{f:v=>v+'%',max:100})}<p class="small">${tt.res.total>=cut?'✓ Đạt ngưỡng '+cut:'✗ Dưới ngưỡng '+cut}${tt.res.cand?' · đã ghi vào hồ sơ '+esc(tt.res.cand):''}</p></div>`:''}`;
  return `
  <div class="kpis">${kpi('Đã làm test',fmt(tested.length),'ứng viên năm nay')}${kpi('Điểm trung bình',Math.round(avg(tested,c=>c.tt)),'/100')}${kpi('Tỷ lệ đạt ngưỡng '+cut,pct(tested.filter(c=>c.tt>=cut).length/Math.max(1,tested.length),0))}${kpi('Đang chờ làm test',fmt(t.cands.filter(c=>c.status==='active'&&c.st===2).length))}</div>
  <div class="grid g2">
   ${panel('Bài trắc nghiệm năng lực',test,{sub:'Câu hỏi tự biên soạn, minh hoạ'})}
   <div>${panel('Phân bố điểm',colChart(bins.map((_,i)=>i*10+''),[{n:'Số ứng viên',c:'var(--c1)',values:bins}]))}
   ${panel('Cấu trúc & nguyên tắc',tbl(['Phần','Đo lường',['Câu']],Object.entries(TEST_SEC).map(([k,l])=>`<tr><td>${l}</td><td class="small">${{V:'Đọc hiểu, suy luận ngôn ngữ',N:'Tính toán, tỷ lệ, số liệu',L:'Quy luật, suy luận trừu tượng',J:'Phán đoán tình huống theo giá trị cốt lõi'}[k]}</td><td class="n">${QBANK.filter(q=>q.s===k).length}</td></tr>`))+'<ul class="list small"><li>Cùng đề, cùng thời gian, cùng cách chấm cho mọi ứng viên của một vị trí.</li><li>Hỗ trợ hợp lý cho người khuyết tật (thêm thời gian, cỡ chữ).</li><li>Không dùng bài test làm căn cứ duy nhất; kết hợp phỏng vấn có cấu trúc.</li><li>Theo dõi tác động bất lợi theo nhóm (quy tắc 4/5) và độ tin cậy định kỳ.</li></ul>',{cls:'mt'})}</div>
  </div>`;
};

V.ta_interview=()=>{
  const r=curReq(true);if(!r)return '<p>Không có yêu cầu đang mở.</p>';
  const comps=interviewComps(r),l=(M.ta.byReq[r.id]||[]).filter(c=>c.status==='active'&&(c.st===2||c.st===3));
  const sc=S.sc.req===r.id?S.sc:(S.sc={req:r.id,cand:'',vals:{},notes:{},rec:''});
  const saved=Object.entries(S.col.scorecards).map(([id,x])=>({...x,id})).filter(x=>x.req===r.id).sort((a,b)=>b.at-a.at);
  return `${reqSel(true)}
  <div class="grid g2">
   ${panel('Hướng dẫn phỏng vấn có cấu trúc',comps.map(p=>{const c=CP[p.id];return `<div class="guide"><b>${esc(c.n)}</b> <span class="muted small">yêu cầu cấp ${p.req} · ${esc(G8[c.g8])}</span><ol class="small">${c.q.map(q=>`<li>${esc(q)}</li>`).join('')}</ol><div class="small muted">1: ${esc(c.bars[1])} · 3: ${esc(c.bars[3])} · 5: ${esc(c.bars[5])}</div></div>`}).join('')+'<p class="small muted">STAR: Situation – bối cảnh · Task – nhiệm vụ · Action – hành động của chính ứng viên · Result – kết quả đo được. Không hỏi về hôn nhân, thai sản, tôn giáo, chính trị, sức khoẻ không liên quan công việc.</p>')}
   ${panel('Phiếu chấm phỏng vấn (BARS)',`<div class="form"><label class="full">Ứng viên<select data-sc="cand" id="sc_cand"><option value="">— Chọn ứng viên —</option>${l.map(c=>`<option value="${c.id}"${sc.cand===c.id?' selected':''}>${esc(c.name)} · ${STAGES[c.st].l}</option>`).join('')}</select></label></div>
    ${comps.map(p=>`<div class="scrow"><b>${esc(CP[p.id].n)}</b><div class="rad">${[1,2,3,4,5].map(v=>`<label><input type="radio" name="sc_${p.id}" data-sc="v_${p.id}" value="${v}"${Number(sc.vals[p.id])===v?' checked':''}> ${v}</label>`).join('')}</div><textarea data-sc="n_${p.id}" id="scn_${p.id}" rows="2" placeholder="Bằng chứng STAR: bối cảnh, hành động, kết quả">${esc(sc.notes[p.id]||'')}</textarea></div>`).join('')}
    <div class="form"><label class="full">Khuyến nghị<select data-sc="rec" id="sc_rec">${['','Tuyển mạnh','Tuyển','Cân nhắc','Không tuyển'].map(x=>`<option${sc.rec===x?' selected':''}>${x}</option>`).join('')}</select></label></div>
    <div style="margin-top:10px"><button class="btn pri" data-act="scSave"${lock()}>Lưu phiếu chấm</button></div>`)}
  </div>
  ${panel('Phiếu chấm đã lưu',tbl(['Thời gian','Ứng viên','Người chấm',['Điểm TB'],'Khuyến nghị'],saved.map(x=>{const c=M.ta.cands.find(z=>z.id===x.cand);const v=Object.values(x.vals||{}).map(Number);return `<tr><td>${new Date(x.at).toLocaleString('vi-VN')}</td><td>${esc(c?c.name:x.cand)}</td><td>${esc(nameOf(x.by))}</td><td class="n">${v.length?avg(v,y=>y).toFixed(1):'—'}</td><td>${esc(x.rec||'')}</td></tr>`})),{cls:'mt'})}`;
};

V.ta_decide=()=>{
  const r=curReq(true);if(!r)return '<p>Không có yêu cầu đang mở.</p>';
  const l=(M.ta.byReq[r.id]||[]).filter(c=>c.st>=3&&(c.status==='active'||c.status==='pool'||S.f.ta_all)).sort((a,b)=>b.comp-a.comp);
  const w=[['wCv','CV'],['wTest','Trắc nghiệm'],['wInt','Phỏng vấn'],['wRef','Tham chiếu']];
  return `${reqSel(true)}
  <div class="grid g2">
   ${panel('Trọng số mô hình bù trừ (compensatory)',`<div class="form">${w.map(([k,l])=>`<label>${l} (%)<input type="number" min="0" max="100" id="w_${k}" value="${TS(k)}"${lockAdmin()}></label>`).join('')}</div><div style="margin-top:8px"><button class="btn sm" data-act="taWeights"${lockAdmin()}>Lưu trọng số</button></div><p class="small muted">Điểm tổng = Σ trọng số × điểm chuẩn hoá 0–100 của các phần đã có kết quả.</p>`)}
   ${panel('Rào cản nhiều lớp (multiple hurdle)',`<ul class="list small"><li>Đạt mọi tiêu chí bắt buộc</li><li>CV ≥ ${TS('cvCut')} · Trắc nghiệm ≥ ${TS('testCut')} · Phỏng vấn ≥ ${TS('intCut')}</li><li>Không có năng lực Chính trực hoặc An toàn dưới 2</li><li>Tham chiếu không có kết quả “Không đạt”</li></ul><p class="small muted">Kết hợp: loại theo rào cản trước, xếp hạng theo điểm bù trừ sau. Kiểm tra tham chiếu chỉ thực hiện khi ứng viên đồng ý bằng văn bản.</p>`)}
  </div>
  ${panel('Ma trận ra quyết định – '+esc(r.title),tbl(['Ứng viên',['CV'],['Test (BPV)'],['PV'],'Tham chiếu',['Tổng'],'Rào cản','Trạng thái',''],l.map(c=>{const h=hurdles(c),pass=h.every(x=>x[1]!==false);return `<tr><td><a href="#" data-act="cand" data-id="${c.id}">${esc(c.name)}</a></td><td class="n">${c.cv}</td><td class="n">${c.tt??'—'}${c.pctl!=null?` <span class="muted">(${c.pctl})</span>`:''}</td><td class="n">${c.ia??'—'}</td><td>${c.ref==null?`<button class="btn sm ghost" data-act="candRef" data-id="${c.id}"${lock()}>Đã kiểm tra – đạt</button>`:c.ref==='ok'?pill('Đạt','ok'):c.ref==='note'?pill('Có lưu ý','warn'):pill('Không đạt','crit')}</td><td class="n"><b>${c.comp}</b></td><td class="small">${h.map(x=>`<span title="${esc(x[0])}">${yes(x[1])}</span>`).join('')}</td><td>${stPill(c)}</td><td>${c.status==='active'||c.status==='pool'?`<button class="btn sm${pass?' pri':''}" data-act="candMove" data-id="${c.id}" data-st="5"${lock()}>Gửi offer</button> <button class="btn sm ghost" data-act="candPool" data-id="${c.id}"${lock()}>Talent pool</button> <button class="btn sm ghost" data-act="candRej" data-id="${c.id}"${lock()}>Loại</button>`:''}</td></tr>`}))+`<label class="small" style="display:flex;gap:6px;margin-top:8px"><input type="checkbox" data-act="taAll"${S.f.ta_all?' checked':''}> Hiện cả ứng viên đã kết thúc</label>`,{cls:'mt'})}`;
};

function offerCalc(c){
  const g=c.r.grade,band=salaryBand(g),p1=c.offer&&c.offer.p1?c.offer.p1:Math.round(band.mid*clamp(.92+(c.comp-60)/250,.85,1.15)/1e5)*1e5;
  const site=Object.keys((DEPT[c.r.dept]||{sites:{HCM:1}}).sites)[0];
  const base={status:'Đang làm việc',site,p1,comp:1,kpi:3.5,otM:0,dep:0,expat:false,att:null};
  return{p1,band,site,off:calcPay({...base,contract:C_DEF}),prob:calcPay({...base,contract:C_PROB}),days:probDaysOf(g)};
}
V.ta_offer=()=>{
  const t=M.ta,pend=t.cands.filter(c=>c.st===5&&c.status==='active'),recent=t.cands.filter(c=>c.st>=5&&c.status!=='active').sort((a,b)=>String(b.lastAt).localeCompare(String(a.lastAt))).slice(0,15);
  const sel=t.cands.find(c=>c.id===S.f.ta_oc)||pend[0];const o=sel?offerCalc(sel):null;
  const BEN=[['Bảo hiểm bắt buộc','BHXH, BHYT, BHTN theo Luật BHXH 2024 (NSDLĐ đóng '+(P('c_bhxh')+P('c_bhyt')+P('c_bhtn'))+'%)','Pháp luật'],['Nghỉ phép năm',P('leaveBase')+' ngày, +1 ngày mỗi '+P('leaveStep')+' năm thâm niên (Điều 113–114 BLLĐ)','Pháp luật'],['Thai sản','Nữ nghỉ 6 tháng; nam nghỉ 5–14 ngày khi vợ sinh, hưởng chế độ BHXH','Pháp luật'],['Lương thử việc',P('probPay')+'% lương chính thức (tối thiểu 85%)','Pháp luật'],['Phụ cấp ăn trưa',fmtM(P('lunch'))+'/tháng','Công ty'],['Phụ cấp điện thoại, đi lại',fmtM(P('phone')+P('travel'))+'/tháng','Công ty'],['Bảo hiểm sức khoẻ',fmtM(P('healthIns'))+'/người/tháng, khám sức khoẻ định kỳ','Công ty'],['Thưởng tháng 13 & thưởng P3','Theo xếp loại thành tích A–E','Công ty'],['Đào tạo','Lộ trình theo khung năng lực, ngân sách đào tạo cá nhân','Công ty'],['Xe đưa đón, suất ăn ca','Cho nhân viên nhà máy Đồng Nai','Công ty'],['Làm việc linh hoạt','Tối đa 2 ngày/tuần với vị trí văn phòng','Công ty'],['Thưởng giới thiệu',fmtM(TS('referralBonus'))+' cho mỗi người giới thiệu qua thử việc','Công ty']];
  return `
  <div class="kpis">${kpi('Offer đang chờ',fmt(pend.length))}${kpi('Tỷ lệ nhận offer',pct(t.offAcc/Math.max(1,t.offAcc+t.offDec),0))}${kpi('Từ chối offer',fmt(t.offDec),'Lý do chính: '+(countBy(t.cands.filter(c=>c.status==='declined'),c=>c.reason).sort((a,b)=>b.v-a.v)[0]||{l:'—'}).l)}</div>
  <div class="grid g2">
   ${panel('Offer đang chờ phản hồi',tbl(['Ứng viên','Vị trí',['P1 đề xuất'],''],pend.map(c=>`<tr class="click${sel&&sel.id===c.id?' sel':''}" data-act="taOc" data-id="${c.id}"><td>${esc(c.name)}</td><td>${esc(c.r.title)}</td><td class="n">${fmtM(offerCalc(c).p1)}</td><td>›</td></tr>`)))}
   ${sel?panel('Bảng tính offer – '+esc(sel.name),`<div class="form"><label>Lương P1 (đ)<input type="number" step="100000" id="of_p1" value="${o.p1}"${lock()}></label><label>Khung GS${z2(sel.r.grade)}<input disabled value="${fmtM(o.band.min)} – ${fmtM(o.band.max)}"></label></div>
     <div class="kv mt"><div>Thử việc</div><div>${o.days} ngày · ${probBasis(sel.r.grade)}</div><div>Gross thử việc</div><div class="num">${fmt(o.prob.gross)} đ</div><div>Gross chính thức (P1+P2+P3 mục tiêu + phụ cấp)</div><div class="num">${fmt(o.off.gross)} đ</div><div>BH người lao động</div><div class="num">${fmt(o.off.insE)} đ</div><div>Thuế TNCN ước tính</div><div class="num">${fmt(o.off.tax)} đ</div><div class="tot">Thực lĩnh chính thức</div><div class="tot num">${fmt(o.off.net)} đ</div><div>Chi phí công ty/tháng</div><div class="num">${fmt(o.off.cost)} đ</div><div>Kỳ vọng ứng viên</div><div class="num">${fmt(sel.expect)} đ ${o.p1>=sel.expect?pill('Đáp ứng','ok'):pill('Thấp hơn '+fmtM(sel.expect-o.p1),'warn')}</div></div>
     ${sel.status==='active'&&sel.st===5?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn" data-act="offerSave" data-id="${sel.id}"${lock()}>Lưu mức P1</button><button class="btn" data-act="offerLetter" data-id="${sel.id}">Soạn thư mời nhận việc</button><button class="btn pri" data-act="offerAccept" data-id="${sel.id}"${lock()}>Ứng viên chấp nhận</button><button class="btn ghost" data-act="offerDecline" data-id="${sel.id}"${lock()}>Ứng viên từ chối</button></div>`:''}
     <p class="small muted">Thông tin cung cấp trước khi giao kết HĐ theo Điều 16 BLLĐ 2019. Không yêu cầu đặt cọc, không giữ bản chính giấy tờ (Điều 17).</p>`):panel('Bảng tính offer','<p class="small muted">Chưa có offer đang chờ.</p>')}
  </div>
  ${panel('Kết quả offer gần đây',tbl(['Ứng viên','Vị trí','Kết quả','Ngày','Lý do'],recent.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.r.title)}</td><td>${stPill(c)}</td><td>${vn(c.lastAt)}</td><td class="small">${esc(c.reason||'')}</td></tr>`)),{cls:'mt'})}
  ${panel('Chính sách phúc lợi',tbl(['Phúc lợi','Nội dung','Nguồn'],BEN.map(b=>`<tr><td><b>${esc(b[0])}</b></td><td>${esc(b[1])}</td><td>${pill(b[2],b[2]==='Pháp luật'?'info':'ok')}</td></tr>`)),{cls:'mt',sub:'Số liệu lấy trực tiếp từ tham số Chính sách & pháp luật'})}`;
};

V.ta_onboard=()=>{
  const t=M.ta,T=M.T,hires=t.cands.filter(c=>c.status==='hired'&&days(parse(c.dates[6]||c.dates[5]),T)<=120).sort((a,b)=>String(b.dates[6]).localeCompare(String(a.dates[6])));
  const pe=t.probEval;
  return `
  <div class="kpis">${kpi('Nhận việc 120 ngày qua',fmt(hires.length))}${kpi('Đang thử việc',fmt(pe.length),`${pe.filter(p=>p.left<=7).length} người hết hạn trong 7 ngày`,pe.some(p=>p.left<0)?'crit':'')}${kpi('Tỷ lệ qua thử việc',pct(t.passRate,0),'Chất lượng tuyển dụng')}${kpi('Hồ sơ chưa tạo NV',fmt(hires.filter(c=>!c.emp).length))}</div>
  ${panel('Pre-onboarding → onboarding',tbl(['Ứng viên','Vị trí','Ngày bắt đầu','Pre-onboarding','Hồ sơ nhân viên','Onboarding',''],hires.map(c=>{const pb=S.col.preboard[c.id]||{},start=parse(c.dates[6]||c.dates[5]),done=PRE.filter(([k])=>pb[k]!==undefined?pb[k]:start<=T).length;const life=c.emp&&M.life.onb.find(x=>x.e.id===c.emp);
    return `<tr><td>${esc(c.name)}</td><td>${esc(c.r.title)}</td><td>${vn(start)}</td><td><div class="prog"><i style="width:${done/PRE.length*100}%"></i></div><span class="small">${done}/${PRE.length}</span></td><td>${c.emp?`<a href="#" data-act="emp" data-id="${c.emp}" class="mono">${c.emp}</a>`:`<button class="btn sm pri" data-act="candEmp" data-id="${c.id}"${lock()}>Tạo hồ sơ NV</button>`}</td><td>${life?`${life.done}/${life.items.length}${life.over.length?' '+pill(life.over.length+' trễ','crit'):''}`:'<span class="muted">—</span>'}</td><td><button class="btn sm" data-act="preOpen" data-id="${c.id}">Checklist</button>${life?` <button class="btn sm ghost" data-act="lcOpen" data-kind="onb" data-id="${c.emp}">Onboarding</button>`:''}</td></tr>`})),{sub:'Hồ sơ nhân viên tạo từ ứng viên được nối với yêu cầu tuyển dụng, bảng lương và rà soát tuân thủ'})}
  ${panel('Đánh giá thử việc 30/60/90 ngày → HĐLĐ chính thức',tbl(['Nhân viên','Vị trí','Bắt đầu','Kết thúc thử việc','Mốc đánh giá',['Điểm'],'Đề xuất',''],pe.map(p=>`<tr><td><a href="#" data-act="emp" data-id="${p.e.id}">${esc(p.e.name)}</a></td><td class="small">${esc(p.e.title)}</td><td>${vn(p.hire)}</td><td>${vn(p.end)} ${p.left<0?pill('Quá '+(-p.left)+' ngày','crit'):p.left<=7?pill('Còn '+p.left+' ngày','warn'):''}</td><td class="small">${p.cps.map(c=>`<span class="${parse(c.due)<=T?'':'muted'}">${c.final?'Kết thúc':c.d+'d'}</span>`).join(' · ')}</td><td class="n">${p.total??'—'}</td><td>${p.final?pill(p.final==='pass'?'Đã ký chính thức':'Đã chấm dứt',p.final==='pass'?'ok':'mute'):p.rec?pill(p.rec==='pass'?'Đạt':p.rec==='watch'?'Theo dõi':'Không đạt',p.rec==='pass'?'ok':p.rec==='watch'?'warn':'crit'):'<span class="muted">Chưa đánh giá</span>'}</td><td><button class="btn sm" data-act="probOpen" data-id="${p.e.id}">Đánh giá</button></td></tr>`))+'<p class="small muted">Điều 27 BLLĐ 2019: khi kết thúc thử việc phải thông báo kết quả; đạt thì tiếp tục thực hiện/ký HĐLĐ, trong thời gian thử việc mỗi bên có quyền huỷ bỏ không cần báo trước và không bồi thường. Không được thử việc với HĐ dưới 1 tháng.</p>',{cls:'mt'})}`;
};

V.ta_legal=()=>{
  const t=M.ta,jdFlags=M.openReqs.filter(r=>biasCheck(jdText(jdFor(r))).length).length,postFlags=Object.values(S.col.posts).filter(p=>biasCheck(p.text).length).length;
  const noConsent=t.cands.filter(c=>!c.ko||!c.ko.consent).length,aiBad=t.ai.filter(x=>x.ratio<.8).length,probOver=t.probEval.filter(p=>p.left<0&&!p.final).length,expats=M.openReqs.filter(r=>r.grade>=9).length;
  const ck=[['Tin tuyển dụng & JD không phân biệt đối xử','Điều 8 BLLĐ 2019; Luật Việc làm 2025; ILO C111',jdFlags+postFlags===0,`${jdFlags} JD, ${postFlags} bài đăng có cảnh báo`],
   ['Không thu phí, không đặt cọc, không giữ bản chính giấy tờ','Điều 11, 17 BLLĐ 2019',true,'Đã đưa vào mọi JD và tin đăng'],
   ['Đồng ý xử lý dữ liệu cá nhân của ứng viên','Luật BVDLCN 2025; GDPR Điều 6–7 (ứng viên EU)',noConsent===0,`${noConsent} hồ sơ thiếu đồng ý`],
   ['Hồ sơ hết thời hạn lưu trữ ('+TS('retention')+' tháng)','Luật BVDLCN 2025 – nguyên tắc lưu trữ có thời hạn',t.expiring.length===0,`${t.expiring.length} hồ sơ cần xoá/ẩn danh`],
   ['Tác động bất lợi trong tuyển chọn (quy tắc 4/5)','EEOC Uniform Guidelines; ILO C111',aiBad===0,`${aiBad} bước cần rà soát`],
   ['Thời gian thử việc và thông báo kết quả','Điều 24–27 BLLĐ 2019',probOver===0,`${probOver} người quá hạn chưa có kết quả`],
   ['Lương thử việc ≥ 85%','Điều 26 BLLĐ 2019',P('probPay')>=85,'Tham số hiện tại: '+P('probPay')+'%'],
   ['Tuyển người nước ngoài: thông báo tuyển người Việt Nam trước, giải trình nhu cầu, giấy phép lao động','BLLĐ 2019 Điều 151–153; NĐ 219/2025/NĐ-CP',null,`${expats} vị trí cấp cao có thể tuyển ứng viên nước ngoài`],
   ['Tuyển lao động chưa thành niên, người khuyết tật đúng điều kiện','Điều 143–147, 158–160 BLLĐ 2019',null,'Không tuyển người dưới 18 tuổi cho công việc nặng nhọc, độc hại']];
  const LAWS=[['Bộ luật Lao động 2019 (Luật 45/2019/QH14)','Tuyển dụng, HĐLĐ, thử việc, không phân biệt đối xử'],['Luật Việc làm 2025','Dịch vụ việc làm, thông tin thị trường lao động, bình đẳng về việc làm (hiệu lực 01/01/2026)'],['Luật Bảo vệ dữ liệu cá nhân 2025','Đồng ý, mục đích, lưu trữ, quyền chủ thể dữ liệu (hiệu lực 01/01/2026)'],['Luật Bình đẳng giới 2006','Bình đẳng giới trong lao động'],['Luật Người khuyết tật 2010','Việc làm cho người khuyết tật'],['NĐ 145/2020/NĐ-CP','Hướng dẫn BLLĐ về điều kiện lao động, quan hệ lao động'],['NĐ 12/2022/NĐ-CP','Xử phạt vi phạm hành chính lĩnh vực lao động'],['NĐ 219/2025/NĐ-CP','Người lao động nước ngoài làm việc tại Việt Nam'],['ILO C111, C100','Không phân biệt đối xử trong việc làm; trả lương bình đẳng'],['GDPR (EU) 2016/679','Áp dụng khi xử lý dữ liệu ứng viên tại EU'],['EEOC Uniform Guidelines (Hoa Kỳ)','Tham chiếu phương pháp đánh giá tác động bất lợi'],['ISO 30414, ISO 10667','Báo cáo vốn con người; dịch vụ đánh giá con người']];
  return `
  ${panel('Kiểm tra tuân thủ tuyển dụng (tự động)',tbl(['Yêu cầu','Căn cứ','Trạng thái','Chi tiết'],ck.map(x=>`<tr><td>${esc(x[0])}</td><td class="small">${esc(x[1])}</td><td>${x[2]==null?pill('Theo dõi','info'):x[2]?pill('Đạt','ok'):pill('Cần xử lý','crit')}</td><td class="small">${esc(x[3])}</td></tr>`)),{act:`<button class="btn sm pri" data-act="taCompliance"${lock()}>Tạo việc cần xử lý</button>`})}
  <div class="grid g2 mt">
   ${panel('Thông báo xử lý dữ liệu cá nhân cho ứng viên (mẫu)',`<pre class="doc small">AMG Việt Nam (bên kiểm soát dữ liệu) xử lý họ tên, thông tin liên hệ, học vấn, kinh nghiệm, kết quả đánh giá của Anh/Chị chỉ nhằm mục đích tuyển dụng vị trí đã ứng tuyển${'\n'}và (nếu Anh/Chị đồng ý riêng) đưa vào nguồn ứng viên tiềm năng.
Thời hạn lưu: ${TS('retention')} tháng kể từ ngày nộp; sau đó dữ liệu được xoá hoặc ẩn danh.
Dữ liệu không bán, không chia sẻ cho bên thứ ba ngoài đối tác tuyển dụng có hợp đồng bảo mật.
Anh/Chị có quyền biết, truy cập, chỉnh sửa, xoá, rút lại đồng ý, phản đối xử lý bằng cách liên hệ bộ phận Nhân sự.
Kiểm tra tham chiếu chỉ thực hiện khi Anh/Chị đồng ý bằng văn bản.
Căn cứ: Luật Bảo vệ dữ liệu cá nhân 2025 và văn bản hướng dẫn.</pre>`)}
   ${panel('Văn bản áp dụng',tbl(['Văn bản','Phạm vi'],LAWS.map(x=>`<tr><td><b>${esc(x[0])}</b></td><td class="small">${esc(x[1])}</td></tr>`))+'<p class="small muted">Thông tin tham khảo, cần đối chiếu văn bản gốc trên vbpl.vn trước khi áp dụng.</p>')}
  </div>`;
};

const TA_PKGS=[
 {id:'pdpl',name:'Luật BVDLCN 2025 – dữ liệu ứng viên',law:'Luật Bảo vệ dữ liệu cá nhân 2025',vals:{retention:12},input:{k:'retention',l:'Thời hạn lưu hồ sơ (tháng)',def:12,min:1,max:36},tasks:['Cập nhật thông báo xử lý dữ liệu trên mọi kênh nhận hồ sơ','Lập hồ sơ đánh giá tác động xử lý dữ liệu cá nhân của hoạt động tuyển dụng','Rà soát hợp đồng bảo mật với headhunter và trang việc làm']},
 {id:'vl2025',name:'Luật Việc làm 2025 – bình đẳng trong tuyển dụng',law:'Luật Việc làm 2025',vals:{},tasks:['Rà soát toàn bộ JD và tin đăng bằng bộ kiểm tra ngôn từ','Đào tạo người phỏng vấn về câu hỏi bị cấm','Cập nhật quy trình tiếp nhận khiếu nại của ứng viên']},
 {id:'fw',name:'NĐ 219/2025 – lao động nước ngoài',law:'NĐ 219/2025/NĐ-CP',vals:{},tasks:['Đăng thông báo tuyển người Việt Nam trước khi giải trình nhu cầu sử dụng người nước ngoài','Chuẩn bị hồ sơ đề nghị cấp giấy phép lao động cho vị trí cấp cao','Theo dõi thời hạn giấy phép lao động hiện có']},
 {id:'wint',name:'Tăng trọng số phỏng vấn có cấu trúc',law:'Thực hành tốt về độ hiệu lực dự báo',vals:{},input:{k:'wInt',l:'Trọng số phỏng vấn (%)',def:45,min:20,max:60},tasks:['Thông báo trọng số mới cho hội đồng tuyển dụng']},
 {id:'cut',name:'Điều chỉnh ngưỡng trắc nghiệm',law:'Quy chế tuyển dụng nội bộ',vals:{},input:{k:'testCut',l:'Ngưỡng điểm test',def:55,min:30,max:80},tasks:['Kiểm tra tác động bất lợi sau khi đổi ngưỡng (quy tắc 4/5)']},
];
V.ta_auto=()=>{
  const runs=Object.values(S.col.runs).filter(r=>/^TA/.test(r.type)).sort((a,b)=>b.at-a.at).slice(0,20);
  const hist=Object.entries(S.col.taPolicy).map(([id,h])=>({...h,id})).sort((a,b)=>b.at-a.at);
  const pk=TA_PKGS.find(p=>p.id===(S.f.ta_pkg||'pdpl'))||TA_PKGS[0];
  const cards=[['taInflow','Thu hồ sơ mới từ các kênh','Mô phỏng hồ sơ đổ về theo ngân sách từng kênh cho mọi yêu cầu đang mở.'],['autoScreenAll','Sàng lọc tự động','Áp tiêu chí loại trừ và ma trận CV cho mọi hồ sơ chờ sàng lọc.'],['taTestRemind','Mời làm test & nhắc hạn','Tạo việc gửi link bài test cho ứng viên đạt sàng lọc.'],['taSchedule','Lên lịch phỏng vấn','Tạo việc xếp lịch hội đồng cho ứng viên đạt test.'],['taCompliance','Rà soát tuân thủ tuyển dụng','JD, đồng ý dữ liệu, lưu trữ, quy tắc 4/5, hạn thử việc → tạo việc.'],['taPurge','Ẩn danh hồ sơ hết hạn lưu','Xoá thông tin định danh của hồ sơ quá thời hạn lưu trữ.'],['pushSheets','Đồng bộ Google Sheets','Ghi các tab nhân sự và tuyển dụng vào Sheet báo cáo của Owner.']];
  return `
  ${panel('Tác vụ tự động',`<div class="auto">${cards.map(([a,ti,d])=>`<div class="card"><h4>${esc(ti)}</h4><p>${esc(d)}</p><div><button class="btn pri" data-act="${a}"${lock()}>Chạy</button></div></div>`).join('')}</div>`)}
  <div class="grid g2 mt">
   ${panel('Cập nhật quy định tuyển dụng',`<div class="form"><label class="full">Gói cập nhật<select data-f="ta_pkg">${TA_PKGS.map(p=>`<option value="${p.id}"${p.id===pk.id?' selected':''}>${esc(p.name)}</option>`).join('')}</select></label>${pk.input?`<label class="full">${esc(pk.input.l)}<input type="number" id="ta_pkgx" min="${pk.input.min}" max="${pk.input.max}" value="${pk.input.def}"></label>`:''}</div><p class="small">Căn cứ: ${esc(pk.law)}</p><ul class="list small">${pk.tasks.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="btn pri" data-act="taPkgApply"${lockAdmin()}>Áp dụng & tạo việc</button>`)}
   ${panel('Lịch sử cập nhật',tbl(['Thời điểm','Gói','Người áp dụng',''],hist.map(h=>`<tr><td>${new Date(h.at).toLocaleString('vi-VN')}</td><td>${esc(h.name)}${h.rolledBack?' '+pill('Đã hoàn tác','mute'):''}</td><td>${esc(nameOf(h.by))}</td><td>${h.rolledBack?'':`<button class="btn sm ghost" data-act="taPkgBack" data-id="${h.id}"${lockAdmin()}>Hoàn tác</button>`}</td></tr>`)))}
  </div>
  ${panel('Nhật ký tự động hoá tuyển dụng',tbl(['Thời điểm','Tác vụ','Kết quả','Người chạy'],runs.map(r=>`<tr><td>${new Date(r.at).toLocaleString('vi-VN')}</td><td>${esc(r.type)}</td><td class="small">${esc(r.summary)}</td><td>${esc(nameOf(r.by))}</td></tr>`)),{cls:'mt'})}`;
};

const KIT=[['req','Phiếu yêu cầu tuyển dụng & hoạch định'],['jd','Bộ mô tả công việc (JD) – KSAO/ASK'],['comp','Từ điển năng lực 3 tầng + Great Eight'],['matrix','Ma trận năng lực theo chức danh'],['camp','Theo dõi chiến dịch & kênh'],['posts','Lịch nội dung mạng xã hội'],['cands','Danh sách ứng viên (ATS)'],['screen','Ma trận sàng lọc CV'],['test','Ngân hàng câu hỏi trắc nghiệm'],['interview','Hướng dẫn phỏng vấn STAR & phiếu BARS'],['decide','Ma trận ra quyết định'],['offer','Bảng tính offer & phúc lợi'],['prob','Phiếu đánh giá thử việc'],['metrics','Bảng chỉ số tuyển dụng']];
V.ta_kit=()=>panel('Bộ biểu mẫu & ma trận tuyển dụng (.xlsx)',`<div class="auto">${KIT.map(([k,l])=>`<div class="card"><h4>${esc(l)}</h4><p>Sinh trực tiếp từ dữ liệu hiện tại của ứng dụng.</p><div><button class="btn" data-act="kitOne" data-id="${k}">Tải Excel</button></div></div>`).join('')}</div><div style="margin-top:14px"><button class="btn pri" data-act="kitAll">Tải trọn bộ ${KIT.length} sheet trong một file</button></div><p class="small muted">File Excel được tạo ngay trên trình duyệt của bạn, không gửi lên máy chủ nào. Dữ liệu ứng viên trong file là mô phỏng; với dữ liệu thật, chỉ chia sẻ cho người có nhu cầu công việc.</p>`);
