/* Khởi động ứng dụng: đăng nhập không mật khẩu, phân quyền, đồng bộ dữ liệu với máy chủ Apps Script (miễn phí). */
"use strict";
const CFG=window.APP_CONFIG||{API_URL:'/api'};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(_){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}},del(k){try{localStorage.removeItem(k)}catch(_){}}};
const API={
  session:LS.get('hts.session',null),
  async call(action,payload){
    let res;
    try{res=await fetch(CFG.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,payload:payload||{},session:API.session})})}
    catch(_){throw Object.assign(new Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'),{code:'network'})}
    if(res.status===402){API.call('reportCost',{source:'api',status:402}).catch(()=>{});throw Object.assign(new Error('Máy chủ báo yêu cầu thanh toán – đã dừng để tránh phát sinh chi phí.'),{code:'payment'})}
    const data=await res.json().catch(()=>({ok:false,error:{code:'server',message:'Máy chủ trả về dữ liệu lỗi'}}));
    if(!data.ok){if(data.error&&data.error.code==='auth'&&API.session&&action!=='verifyLogin'){API.logout();location.reload()}throw Object.assign(new Error(data.error.message),{code:data.error.code})}
    return data.data;
  },
  setSession(s){API.session=s;LS.set('hts.session',s)},
  logout(){API.session=null;LS.del('hts.session');LS.del('hts.demo')},
};
const RANK=['viewer','commenter','contributor','editor','owner'];
const ROLE_VI={viewer:'Viewer – chỉ xem',commenter:'Commenter – xem & bình luận',contributor:'Contributor – sửa dữ liệu',editor:'Editor – toàn quyền, gồm chính sách & mời người',owner:'Owner – chủ sở hữu'};
let ME=null,DEMO=false;
const can=r=>ME&&RANK.indexOf(ME.user.role)>=RANK.indexOf(r);

/* ---------- tải file, sao chép prompt (thay AI trả phí) ---------- */
const DL={async save({filename,data,mimeType}){const blob=data instanceof Uint8Array?new Blob([data],{type:mimeType||'application/octet-stream'}):new Blob([data],{type:(mimeType||'text/plain')+';charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}};
const SAMPLE=Object.assign(async function(prompt){await copyPrompt(prompt)},{json:async prompt=>copyPrompt(prompt+'\n\nChỉ trả về JSON.')});
async function copyPrompt(p){try{await navigator.clipboard.writeText(p)}catch(_){}throw Object.assign(new Error('Đã sao chép prompt – dán vào trợ lý AI miễn phí bạn dùng (ứng dụng không gọi AI trả phí).'),{code:'copied'})}

/* ---------- kho dữ liệu dùng chung (thay cho runtime artifact) ---------- */
const STORE={docs:{},since:0,subs:{},timer:0,queue:[],flushT:0,started:false};
function notify(col){const m=STORE.docs[col]||{};let docs=Object.entries(m).map(([id,x])=>({id,data:()=>x}));
  if(col==='settings'&&!m.sheets&&ME&&ME.config.report_sheet_id)docs.push({id:'sheets',data:()=>({id:ME.config.report_sheet_id,title:'Google Sheet báo cáo của Owner',auto:false})});
  (STORE.subs[col]||[]).forEach(cb=>{try{cb({docs})}catch(_){}})}
function applyDocs(list){const touched=new Set();for(const d of list){const c=(STORE.docs[d.col]=STORE.docs[d.col]||{});if(d.data==null)delete c[d.id];else c[d.id]=d.data;touched.add(d.col);if(d.at>STORE.since)STORE.since=d.at}return touched}
async function pull(full){
  try{const r=await API.call('pull',{since:full?0:Math.max(0,STORE.since-60000)});const t=applyDocs(r.docs);if(full){STORE.since=Math.max(STORE.since,r.now-60000);Object.keys(STORE.subs).forEach(notify)}else t.forEach(notify);setSync('on','Đồng bộ · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}))}
  catch(e){setSync('off',e.code==='network'?'Mất kết nối – thử lại sau':'Lỗi đồng bộ')}
}
function startStore(){if(STORE.started)return;STORE.started=true;pull(true);STORE.timer=setInterval(()=>{if(!document.hidden)pull(false)},20000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull(false)})}
function enqueue(op){return new Promise((res,rej)=>{STORE.queue.push({op,res,rej});clearTimeout(STORE.flushT);STORE.flushT=setTimeout(flush,60)})}
async function flush(){
  const q=STORE.queue.splice(0,200);if(!q.length)return;
  try{await API.call('writeDocs',{ops:q.map(x=>x.op)});q.forEach(x=>x.res())}
  catch(e){const er=Object.assign(new Error(e.message),{code:e.code==='forbidden'?'not_granted':e.code});q.forEach(x=>x.rej(er));pull(false)}
  if(STORE.queue.length)flush();
}
const DB={
  collection:col=>({onSnapshot(cb){(STORE.subs[col]=STORE.subs[col]||[]).push(cb);startStore();if(STORE.docs[col])notify(col);return()=>{}}}),
  doc(path){const i=path.indexOf('/'),col=path.slice(0,i),id=path.slice(i+1);return{
    set:data=>{(STORE.docs[col]=STORE.docs[col]||{})[id]=data;return enqueue({op:'set',col,id,data})},
    delete:()=>{if(STORE.docs[col])delete STORE.docs[col][id];return enqueue({op:'del',col,id})}}},
  batch:ops=>Promise.all(ops.map(o=>{if(o.op==='set')(STORE.docs[o.col]=STORE.docs[o.col]||{})[o.id]=o.data;return enqueue(o)})),
};
const USER={id:async()=>ME.user.email,me:async()=>({name:ME.user.name||ME.user.email}),isOwner:async()=>ME.user.role==='owner',canEdit:async()=>can('editor'),can:async()=>can('contributor'),profiles:ids=>API.call('profiles',{ids})};
const COMMENTS={openComposer({element}){const h=element&&element.querySelector('h3');openComments(S.view+'|'+(h?h.textContent:'Trang'));return Promise.resolve()}};
const MCP={callTool:async(server,tool,input)=>({payload:await API.call('sheets',{tool,input})})};

async function openComments(target){
  openDrawer(`<div class="dh"><div><h2 style="font-size:20px">Bình luận</h2><div class="small muted">${esc(target.split('|')[1]||target)}</div></div><button class="btn sm" data-act="close">Đóng</button></div><div class="panel" id="cmList"><span class="spin"></span></div>
   ${can('commenter')?`<div class="panel"><div class="form"><label class="full">Bình luận mới<textarea id="cm_text" rows="3" maxlength="2000" placeholder="Không nhập thông tin cá nhân nhạy cảm"></textarea></label></div><button class="btn pri" data-act="cmAdd" data-t="${esc(target)}" style="margin-top:8px">Gửi</button></div>`:''}`);
  try{const l=await API.call('listComments',{target});const box=document.getElementById('cmList');if(box)box.innerHTML=l.length?l.map(c=>`<div class="cm${c.resolved==='true'?' done':''}"><b>${esc(c.email)}</b> <span class="small muted">${new Date(c.at).toLocaleString('vi-VN')}</span><p>${esc(c.text)}</p>${c.resolved!=='true'&&(c.email===ME.user.email||can('editor'))?`<button class="btn sm ghost" data-act="cmResolve" data-id="${c.comment_id}" data-t="${esc(target)}">Đánh dấu đã xử lý</button>`:''}</div>`).join(''):'<p class="small muted">Chưa có bình luận.</p>'}catch(e){toast(e.message)}
}

/* ---------- màn hình đăng nhập & pháp lý ---------- */
function loginView(msg){
  document.getElementById('gate').innerHTML=`<div class="gate"><div class="gcard"><div class="brand"><div class="mark">AMG</div><div><b>HR Analytics</b><small>Nhân sự &amp; Tuyển dụng · dữ liệu mô phỏng</small></div></div>
   <h1>Đăng nhập không cần mật khẩu</h1><p class="muted">Nhập email đã được mời. Hệ thống gửi link đăng nhập dùng một lần (hiệu lực 15 phút).</p>
   ${msg?`<div class="banner warn">${esc(msg)}</div>`:''}
   <form id="loginForm"><input type="email" id="lg_email" required autocomplete="email" placeholder="ten@congty.com" value="${esc(LS.get('hts.email',''))}">
   <label class="chk"><input type="checkbox" id="lg_ok" required><span>Tôi đồng ý <a href="#/legal/terms">Điều khoản sử dụng</a> và <a href="#/legal/privacy">Chính sách bảo mật</a></span></label>
   <button class="btn pri" type="submit">Gửi link đăng nhập</button></form>
   <div class="or">hoặc</div><button class="btn" id="lg_demo">Xem bản demo (không lưu dữ liệu)</button>
   <p class="small muted" style="margin-top:16px">Ứng dụng chỉ dùng dịch vụ miễn phí (GitHub Pages, Google Apps Script, Google Sheets). Mọi nhân viên, ứng viên là dữ liệu mô phỏng.<br><a href="#/legal/privacy">Bảo mật</a> · <a href="#/legal/terms">Điều khoản</a> · <a href="#/legal/disclaimer">Miễn trừ</a> · <a href="#/legal/complaints">Khiếu nại</a></p></div></div>`;
  document.getElementById('gate').hidden=false;
  document.getElementById('loginForm').onsubmit=async ev=>{ev.preventDefault();const email=document.getElementById('lg_email').value.trim();LS.set('hts.email',email);const b=ev.target.querySelector('button');b.disabled=true;
    try{const r=await API.call('requestLogin',{email,accept:document.getElementById('lg_ok').checked});
      const M2={sent:'Đã gửi link đăng nhập tới '+email+'. Kiểm tra hộp thư (cả mục Spam).',invite_only:'Email này chưa được mời. Liên hệ người quản trị để được cấp quyền.',revoked:'Quyền truy cập của email này đã bị thu hồi.',pending:'Yêu cầu truy cập đang chờ duyệt.',requested:'Đã gửi yêu cầu truy cập tới người quản trị.'};
      loginView(M2[r.status]||r.status)}catch(e){loginView(e.message)}};
  document.getElementById('lg_demo').onclick=()=>{DEMO=true;LS.set('hts.demo',true);startApp()};
}
function legalView(key){const g=document.getElementById('legal');g.innerHTML=`<div class="gate"><div class="gcard wide">${window.HTSLegal.html(key)}<p><button class="btn" id="lgBack">Quay lại</button></p></div></div>`;g.hidden=false;document.getElementById('lgBack').onclick=()=>{g.hidden=true;history.replaceState(null,'',location.pathname+'#'+(S.view||''))}}
window.addEventListener('hashchange',()=>{const h=location.hash;if(h.startsWith('#/legal/'))legalView(h.slice(8));else document.getElementById('legal').hidden=true});

/* ---------- ghi đè các phần phụ thuộc runtime cũ ---------- */
banner=function(){const b=$('#banner');if(DEMO)b.innerHTML=`<div class="banner warn">Bản demo: dữ liệu mô phỏng, thay đổi chỉ tồn tại trong phiên này. <a href="#" data-act="logout">Đăng nhập</a> để lưu và cộng tác.</div>`;else if(!S.canWrite)b.innerHTML=`<div class="banner">Bạn đang ở chế độ ${can('commenter')?'xem và bình luận':'chỉ xem'}. Liên hệ Editor/Owner để được cấp thêm quyền.</div>`;else b.innerHTML=''};
/* ---------- điều hướng: 2 không gian làm việc, nhóm theo quy trình ---------- */
const WS=[
 {id:'hr',label:'Nhân sự',home:'overview',groups:[['',['overview']],['Con người',['people','lifecycle','recruit','time','training','kpi','relations']],['Lương & chi phí',['payroll','cost']],['Tuân thủ',['compliance','policy','docs','library']],['Vận hành',['automation']]],
  tabs:[['overview','Tổng quan','home'],['people','Nhân sự','users'],['payroll','Lương','wallet'],['compliance','Tuân thủ','shield']]},
 {id:'ta',label:'Tuyển dụng',home:'ta_dash',groups:[['',['ta_dash']],['Hoạch định',['ta_plan','ta_jd','ta_comp']],['Thu hút',['ta_brand','ta_social']],['Tuyển chọn',['ta_ats','ta_screen','ta_test','ta_interview','ta_decide']],['Tiếp nhận',['ta_offer','ta_onboard']],['Vận hành',['ta_legal','ta_auto','ta_kit']]],
  tabs:[['ta_dash','Tổng quan','home'],['ta_ats','Pipeline','users'],['ta_interview','Phỏng vấn','chat'],['ta_offer','Offer','doc']]}];
const ICON={home:'<path d="M4 11l8-6 8 6v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 010 7M21 20c0-2.6-1.6-4.8-4-5.6"/>',wallet:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14.5h2"/>',shield:'<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',chat:'<path d="M5 5h14a1 1 0 011 1v9a1 1 0 01-1 1h-8l-4 3v-3H5a1 1 0 01-1-1V6a1 1 0 011-1z"/>',doc:'<path d="M7 3h7l5 5v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>'};
const ico=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
const wsOf=v=>v==='access'?(S.ws||'hr'):v.startsWith('ta_')?'ta':'hr';
const vLabel=id=>(VIEWS.find(x=>x[0]===id)||[,id])[1];
const _render=render;
render=function(){_render();const cur=S.view;const ws=wsOf(cur);S.ws=ws;const W=WS.find(w=>w.id===ws);const nav=$('#nav');
  const btn=new Map([...nav.querySelectorAll('button[data-v]')].map(b=>[b.dataset.v,b.outerHTML]));
  nav.innerHTML=`<div class="ws" role="tablist" aria-label="Không gian làm việc">${WS.map(w=>`<button role="tab" aria-selected="${w.id===ws}" data-act="ws" data-w="${w.id}">${w.label}</button>`).join('')}</div>`+
    W.groups.map(([l,ids])=>(l?`<div class="ngrp">${l}</div>`:'')+ids.map(id=>btn.get(id)||'').join('')).join('')+`<div class="ngrp">Hệ thống</div>`+(btn.get('access')||'');
  const c=$('#vtitle .crumb');if(c)c.textContent=(ws==='ta'?'Tuyển dụng':'Nhân sự')+(cur==='access'?' · Hệ thống':'');
  document.title=vLabel(cur)+' · HR Analytics';
  $('#tabbar').innerHTML=W.tabs.map(([id,l,i])=>`<button data-act="go" data-v="${id}"${id===cur?' aria-current="page"':''}>${ico(i)}<span>${l}</span></button>`).join('')+`<button data-act="navOpen">${ico('menu')}<span>Menu</span></button>`;
};
function tidyTables(root){(root||document).querySelectorAll('.tbl td:not(.n):not(.nw):not(.wr)').forEach(td=>{if(td.querySelector('textarea,input[type=text],select'))return;const t=td.textContent.trim();td.classList.add(t.length<=34?'nw':'wr')})}
new MutationObserver(()=>tidyTables()).observe(document.body,{childList:true,subtree:true});
function setNav(open){document.body.classList.toggle('nav-open',open);if(open){const f=$('#nav [aria-current="page"]')||$('#nav button');if(f)f.focus()}}
let cmdIdx=0;
function cmdItems(q){const n=t=>t.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'d').toLowerCase();q=n(q.trim());
  return VIEWS.map(([id,l])=>({id,l,g:id==='access'?'Hệ thống':id.startsWith('ta_')?'Tuyển dụng':'Nhân sự'})).filter(x=>!q||n(x.l+' '+x.g).includes(q))}
function cmdDraw(){const list=cmdItems($('#cmdkIn').value);cmdIdx=Math.min(cmdIdx,Math.max(0,list.length-1));
  $('#cmdkList').innerHTML=list.map((x,i)=>`<button role="option" data-act="cmdGo" data-v="${x.id}" aria-selected="${i===cmdIdx}"><span>${esc(x.l)}</span><small>${x.g}</small></button>`).join('')||'<div class="empty">Không tìm thấy mô-đun phù hợp.</div>'}
function cmdOpen(){const d=$('#cmdk');d.hidden=false;const i=$('#cmdkIn');i.value='';cmdIdx=0;cmdDraw();setTimeout(()=>i.focus(),0)}
function cmdClose(){$('#cmdk').hidden=true}
document.addEventListener('input',ev=>{if(ev.target.id==='cmdkIn'){cmdIdx=0;cmdDraw()}});
document.addEventListener('keydown',ev=>{
  if((ev.metaKey||ev.ctrlKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();$('#cmdk').hidden?cmdOpen():cmdClose();return}
  if(!$('#cmdk').hidden){const list=cmdItems($('#cmdkIn').value);
    if(ev.key==='Escape'){cmdClose()}else if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){ev.preventDefault();cmdIdx=(cmdIdx+(ev.key==='ArrowDown'?1:-1)+list.length)%Math.max(1,list.length);cmdDraw();const s=$('#cmdkList [aria-selected="true"]');if(s)s.scrollIntoView({block:'nearest'})}else if(ev.key==='Enter'&&list[cmdIdx]){ev.preventDefault();cmdClose();go(list[cmdIdx].id)}return}
  if(ev.key==='Escape'&&document.body.classList.contains('nav-open'))setNav(false);
  if(ev.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable){ev.preventDefault();cmdOpen()}});
if(LS.get('hts.focus',false))document.body.classList.add('focus');
V.access=()=>{
  const role=ME?ME.user.role:'demo';
  const mx=[['Xem dashboard, báo cáo, hồ sơ mô phỏng','yes','yes','yes','yes'],['Bình luận vào từng khối','no','yes','yes','yes'],['Sửa dữ liệu: nhân sự, ứng viên, JD, phiếu chấm, offer','no','no','yes','yes'],['Chạy tự động hoá, đồng bộ Google Sheets','no','no','yes','yes'],['Áp dụng / hoàn tác chính sách & quy định','no','no','no','yes'],['Mời người dùng, đổi quyền','no','no','no','yes*']];
  return `<div class="kpis">${kpi('Bạn đang dùng với vai trò',DEMO?'Demo (không lưu)':esc((ROLE_VI[role]||role).split(' – ')[0]),ME?esc(ME.user.email):'')}${kpi('Lưu trữ',DEMO?'Chỉ phiên này':'Google Sheets của Owner','Đồng bộ mỗi 20 giây')}</div>
  ${!DEMO&&can('editor')?panel('Mời người dùng theo email',`<div class="form"><label class="full">Email (cách nhau bằng dấu phẩy hoặc xuống dòng)<textarea id="iv_emails" rows="3" placeholder="a@congty.com, b@congty.com"></textarea></label><label>Quyền<select id="iv_role">${['viewer','commenter','contributor',...(ME.user.role==='owner'?['editor']:[])].map(r=>`<option value="${r}">${ROLE_VI[r]}</option>`).join('')}</select></label><label>Lời nhắn (tuỳ chọn)<input id="iv_msg" maxlength="300"></label><label class="full chk"><input type="checkbox" id="iv_mail" checked> Gửi email mời kèm link đăng nhập</label></div><button class="btn pri" data-act="ivSend" style="margin-top:10px">Mời</button><div id="ivOut" class="small" style="margin-top:8px"></div>`,{sub:'Giống chia sẻ Google Docs: người được mời đăng nhập bằng đúng email đó'})+panel('Người dùng & yêu cầu truy cập','<div id="usrBox"><span class="spin"></span></div>',{cls:'mt',act:'<button class="btn sm" data-act="usrLoad">Tải lại</button>'}):''}
  ${panel('Ma trận phân quyền',`<div class="tw"><table class="tbl matrix"><thead><tr><th>Thao tác</th><th>Viewer</th><th>Commenter</th><th>Contributor</th><th>Editor/Owner</th></tr></thead><tbody>${mx.map(r=>`<tr><td>${esc(r[0])}</td>${r.slice(1).map(c=>`<td class="${c.startsWith('yes')?'yes':'no'}">${c.startsWith('yes')?'Có'+(c.endsWith('*')?'*':''):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">* Editor mời được Viewer, Commenter, Contributor; chỉ Owner cấp/thu hồi Editor. Mọi quyền được kiểm tra lại ở máy chủ.</p>`,{cls:'mt'})}
  ${!DEMO&&ME&&ME.user.role==='owner'?panel('Cấu hình hệ thống (Owner)',`<div class="form"><label class="chk full"><input type="checkbox" id="cf_inv"${ME.config.invite_only==='true'?' checked':''}> Chỉ người được mời mới đăng nhập (khuyến nghị)</label><label class="chk full"><input type="checkbox" id="cf_mt"${ME.config.maintenance==='true'?' checked':''}> Chế độ bảo trì (chỉ Owner truy cập)</label><label class="chk full"><input type="checkbox" id="cf_demo"${ME.config.demo_mode!=='off'?' checked':''}> Cho phép xem bản demo không đăng nhập</label></div><button class="btn" data-act="cfSave" style="margin-top:8px">Lưu cấu hình</button>`,{cls:'mt'}):''}
  ${!DEMO?panel('Quyền dữ liệu của bạn',`<p class="small">Theo Luật Bảo vệ dữ liệu cá nhân 2025 và GDPR, bạn có quyền xem, tải về, sửa, xoá dữ liệu cá nhân và rút lại đồng ý.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="myData">Tải dữ liệu của tôi (JSON)</button><select id="pr_kind"><option value="access">Yêu cầu truy cập</option><option value="correct">Yêu cầu chỉnh sửa</option><option value="delete">Yêu cầu xoá tài khoản & dữ liệu</option><option value="withdraw">Rút lại đồng ý</option><option value="object">Phản đối xử lý</option></select><input id="pr_note" placeholder="Ghi chú" maxlength="500"><button class="btn" data-act="prSend">Gửi yêu cầu</button></div>`,{cls:'mt'})+(can('editor')?panel('Nhật ký bảo mật máy chủ','<div id="audBox"><button class="btn sm" data-act="audLoad">Xem 200 sự kiện gần nhất</button></div>',{cls:'mt'}):''):''}
  <p class="small muted mt">Phiên đăng nhập hết hạn sau 30 ngày. <a href="#" data-act="logout">${DEMO?'Đăng nhập':'Đăng xuất'}</a> · <a href="#/legal/privacy">Chính sách bảo mật</a> · <a href="#/legal/terms">Điều khoản</a></p>`;
};
async function loadUsers(){const box=document.getElementById('usrBox');if(!box)return;try{const r=await API.call('listUsers');const opt=(u)=>['viewer','commenter','contributor','editor'].map(x=>`<option value="${x}"${u.role===x?' selected':''}>${ROLE_VI[x].split(' – ')[0]}</option>`).join('');
  box.innerHTML=(r.requests.length?`<h4>Chờ duyệt</h4>${tbl(['Email','Lời nhắn',''],r.requests.map(q=>`<tr><td>${esc(q.requester)}</td><td class="small">${esc(q.note)}</td><td><button class="btn sm" data-act="arOk" data-id="${q.id}" data-r="viewer">Cấp Viewer</button> <button class="btn sm" data-act="arOk" data-id="${q.id}" data-r="contributor">Contributor</button> <button class="btn sm ghost" data-act="arOk" data-id="${q.id}" data-r="deny">Từ chối</button></td></tr>`))}`:'')+
  tbl(['Email','Quyền','Trạng thái','Người duyệt',''],r.users.map(u=>`<tr><td>${esc(u.email)}</td><td>${u.role==='owner'?'Owner':`<select data-email="${esc(u.email)}" class="roleSel">${opt(u)}</select>`}</td><td>${u.status==='active'?pill('Hoạt động','ok'):pill('Đã thu hồi','mute')}</td><td class="small">${esc(u.approved_by||'')}</td><td>${u.role!=='owner'&&u.status==='active'?`<button class="btn sm ghost" data-act="usrRevoke" data-email="${esc(u.email)}">Thu hồi</button>`:''}</td></tr>`))}catch(e){box.textContent=e.message}}
document.addEventListener('change',async ev=>{const el=ev.target;if(!el.classList||!el.classList.contains('roleSel'))return;try{await API.call('setRole',{email:el.dataset.email,role:el.value});toast('Đã đổi quyền')}catch(e){toast(e.message)}loadUsers()});
Object.assign(ACT,{
 ws:b=>{const w=WS.find(x=>x.id===b.dataset.w);if(!w||w.id===S.ws)return;const open=document.body.classList.contains('nav-open');go(w.home);if(open)setNav(true)},
 navOpen:()=>setNav(true),navClose:()=>setNav(false),
 focusMode:()=>{const on=!document.body.classList.contains('focus');document.body.classList.toggle('focus',on);LS.set('hts.focus',on)},
 cmdk:cmdOpen,cmdkClose:cmdClose,cmdGo:b=>{cmdClose();go(b.dataset.v)},
 logout:()=>{API.logout();location.hash='';location.reload()},
 cmAdd:async b=>{const t=val('cm_text').trim();if(!t)return;try{await API.call('addComment',{target:b.dataset.t,text:t});openComments(b.dataset.t)}catch(e){toast(e.message)}},
 cmResolve:async b=>{try{await API.call('resolveComment',{comment_id:b.dataset.id});openComments(b.dataset.t)}catch(e){toast(e.message)}},
 ivSend:async()=>{try{const r=await API.call('inviteUsers',{emails:val('iv_emails'),role:val('iv_role'),message:val('iv_msg'),send_mail:document.getElementById('iv_mail').checked});const L={invited:'đã mời',granted:'đã cấp quyền',granted_no_mail:'đã cấp quyền (chưa gửi được email)',exists:'đã có quyền này',invalid:'email không hợp lệ',forbidden:'không đủ quyền'};document.getElementById('ivOut').innerHTML=r.results.map(x=>`${esc(x.email)}: ${L[x.status]||x.status}`).join('<br>');loadUsers()}catch(e){toast(e.message)}},
 usrLoad:loadUsers,
 usrRevoke:async b=>{if(!confirm('Thu hồi quyền của '+b.dataset.email+'?'))return;try{await API.call('setRole',{email:b.dataset.email,role:'revoked'});toast('Đã thu hồi')}catch(e){toast(e.message)}loadUsers()},
 arOk:async b=>{try{await API.call('decideRequest',{id:b.dataset.id,role:b.dataset.r});toast('Đã xử lý')}catch(e){toast(e.message)}loadUsers()},
 cfSave:async()=>{try{ME.config=await API.call('updateConfig',{values:{invite_only:document.getElementById('cf_inv').checked,maintenance:document.getElementById('cf_mt').checked,demo_mode:document.getElementById('cf_demo').checked?'on':'off'}});toast('Đã lưu cấu hình')}catch(e){toast(e.message)}},
 myData:async()=>{try{const d=await API.call('myData');DL.save({filename:'du-lieu-cua-toi.json',data:JSON.stringify(d,null,1),mimeType:'application/json'})}catch(e){toast(e.message)}},
 prSend:async()=>{try{await API.call('privacyRequest',{kind:val('pr_kind'),note:val('pr_note')});toast('Đã gửi yêu cầu tới Owner. Phản hồi trong tối đa 30 ngày.')}catch(e){toast(e.message)}},
 audLoad:async()=>{try{const l=await API.call('auditLog',{limit:200});document.getElementById('audBox').innerHTML=tbl(['Thời điểm','Người','Hành động','Đối tượng'],l.map(a=>`<tr><td>${new Date(a.at).toLocaleString('vi-VN')}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td class="small">${esc(a.target)}</td></tr>`))}catch(e){toast(e.message)}},
});
const _go=go;go=function(v){setNav(false);_go(v);const m=document.getElementById('view');if(m&&matchMedia('(max-width:960px)').matches)m.focus({preventScroll:true});if(v==='access'&&!DEMO&&can('editor'))setTimeout(loadUsers,0)};

/* ---------- khởi động ---------- */
function startApp(){
  document.getElementById('gate').hidden=true;
  if(!DEMO)window.claude={use:async n=>({db:DB,user:USER,comments:can('commenter')?COMMENTS:null,downloads:DL,sample:SAMPLE,mcp:ME.config.report_sheet_id?MCP:null})[n]||null};
  const h0=location.hash.slice(1);if(V[h0])S.view=h0;
  render();tick();setInterval(tick,30000);
  connect().then(()=>{if(!S.downloads)S.downloads=DL;if(!S.sample)S.sample=SAMPLE;
    const w=$('#who');if(w){const nm=DEMO?'Demo':ME.user.email;w.innerHTML=`<button class="av" data-act="go" data-v="access" title="Tài khoản & phân quyền" aria-label="Tài khoản">${esc((nm[0]||'?').toUpperCase())}</button><span class="who-txt">${DEMO?'Bản demo':esc(ME.user.email)+' · '+esc(ME.user.role_label)}</span><button class="btn sm ghost" data-act="logout">${DEMO?'Đăng nhập':'Đăng xuất'}</button>`}render()});
}
(async function boot(){
  const h=location.hash;
  if(h.startsWith('#/legal/'))legalView(h.slice(8));
  if(h.startsWith('#/login/')){history.replaceState(null,'',location.pathname);try{const r=await API.call('verifyLogin',{token:h.slice(8)});API.setSession(r.session)}catch(e){API.logout();return loginView(e.message)}}
  if(!API.session){if(LS.get('hts.demo',false)){DEMO=true;return startApp()}return loginView()}
  try{ME=await API.call('me')}catch(e){if(e.code==='auth')return loginView(e.message);return loginView(e.message)}
  startApp();
})();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
