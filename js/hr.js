/* HR Analytics (dữ liệu mô phỏng) – tách từ HR-Analytics.html */
"use strict";
/* ============ helpers ============ */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(n||0).toLocaleString('vi-VN');
const fmtM=n=>((n||0)/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})+' tr';
const fmtB=n=>((n||0)/1e9).toLocaleString('vi-VN',{maximumFractionDigits:2})+' tỷ';
const pct=(x,d=1)=>((x||0)*100).toLocaleString('vi-VN',{maximumFractionDigits:d})+'%';
const z2=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+z2(d.getMonth()+1)+'-'+z2(d.getDate());
const parse=s=>{if(!s)return null;const[y,m,d]=String(s).split('-').map(Number);return new Date(y,m-1,d||1)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const addMonths=(d,n)=>{const x=new Date(d);x.setMonth(x.getMonth()+n);return x};
const days=(a,b)=>Math.round((b-a)/86400000);
const vn=s=>{const d=typeof s==='string'?parse(s):s;return d?d.toLocaleDateString('vi-VN'):'—'};
const today=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())};
const sum=(a,f=x=>x)=>a.reduce((s,x)=>s+(f(x)||0),0);
const avg=(a,f)=>a.length?sum(a,f)/a.length:0;
const groupBy=(a,f)=>a.reduce((m,x)=>{const k=f(x);(m[k]||(m[k]=[])).push(x);return m},{});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const slug=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'');
const safeId=s=>String(s).replace(/[^A-Za-z0-9_-]/g,'_').slice(0,140);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=mulberry32(20261114);
const pick=a=>a[Math.floor(R()*a.length)];
const between=(a,b)=>a+R()*(b-a);
const ri=(a,b)=>Math.floor(between(a,b+1));
const gauss=()=>{const u=R()||1e-9,v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
const MONTHS=['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

/* ============ master data (simulated MNC) ============ */
const ANCHOR=new Date(2026,10,14); // ngày dựng bộ dữ liệu mô phỏng
const SITES={HCM:{name:'Trụ sở TP.HCM',region:1},HN:{name:'Văn phòng Hà Nội',region:1},DNA:{name:'Nhà máy Đồng Nai',region:2},DNG:{name:'Văn phòng Đà Nẵng',region:2}};
const DEPTS=[
 {id:'BOD',name:'Ban Tổng Giám đốc',n:5,lo:12,hi:13,sites:{HCM:1},fem:.4},
 {id:'FIN',name:'Tài chính – Kế toán',n:24,lo:4,hi:11,sites:{HCM:.7,HN:.3},fem:.65},
 {id:'HR',name:'Nhân sự',n:16,lo:4,hi:11,sites:{HCM:.6,HN:.25,DNA:.15},fem:.7},
 {id:'SAL',name:'Kinh doanh',n:66,lo:4,hi:11,sites:{HCM:.45,HN:.35,DNG:.2},fem:.45},
 {id:'MKT',name:'Marketing',n:20,lo:4,hi:11,sites:{HCM:.8,HN:.2},fem:.6},
 {id:'IT',name:'Công nghệ & Dữ liệu',n:30,lo:4,hi:11,sites:{HCM:.7,HN:.3},fem:.25},
 {id:'RND',name:'Nghiên cứu & Phát triển',n:22,lo:5,hi:11,sites:{HCM:.5,DNA:.5},fem:.3},
 {id:'PRD',name:'Sản xuất',n:130,lo:1,hi:10,sites:{DNA:1},fem:.55},
 {id:'SCM',name:'Chuỗi cung ứng & Kho vận',n:40,lo:2,hi:10,sites:{DNA:.6,HCM:.2,HN:.2},fem:.35},
 {id:'QA',name:'Chất lượng & EHS',n:18,lo:3,hi:10,sites:{DNA:.85,HCM:.15},fem:.5},
 {id:'ENG',name:'Kỹ thuật & Bảo trì',n:22,lo:2,hi:10,sites:{DNA:1},fem:.1},
 {id:'LEG',name:'Pháp chế & Tuân thủ',n:7,lo:5,hi:11,sites:{HCM:1},fem:.55},
];
const DEPT=Object.fromEntries(DEPTS.map(d=>[d.id,d]));
const GROUP=g=>g<=3?'Công nhân, kỹ thuật viên, thư ký':g<=5?'Nhân viên':g<=8?'Chuyên viên, trưởng nhóm':g<=10?'Quản lý cấp trung':g===11?'Giám đốc khối':'Ban điều hành';
const SCALE_DEF={1:7.0e6,2:8.6e6,3:10.5e6,4:14e6,5:18e6,6:24e6,7:31e6,8:40e6,9:52e6,10:66e6,11:85e6,12:115e6,13:160e6};
const SURN=['Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Phan','Vũ','Võ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý','Trương','Đinh'];
const MIDM=['Văn','Đức','Minh','Quốc','Hữu','Thành','Gia','Anh','Công','Trọng'],MIDF=['Thị','Ngọc','Thu','Thanh','Mai','Bảo','Kim','Phương','Khánh','Hoài'];
const GIVM=['Hùng','Dũng','Tuấn','Nam','Khoa','Long','Phúc','Huy','Bảo','Khang','Quân','Sơn','Tài','Trung','Hiếu','Đạt','Thắng','Vinh','Lộc','Tín'];
const GIVF=['Lan','Hương','Trang','Linh','Hà','Thảo','Ngân','Vy','Nhi','Yến','Hạnh','Tâm','Châu','Uyên','Quỳnh','My','Giang','Oanh','Phượng','Diệp'];
const EXPATS=[['Kenji Watanabe','Nhật Bản','M'],['Daniel Becker','Đức','M'],['Park Ji-hoon','Hàn Quốc','M'],['Sophie Laurent','Pháp','F'],['Michael Tan','Singapore','M'],['Arjun Mehta','Ấn Độ','M'],['Emily Carter','Hoa Kỳ','F'],['Lukas Novak','Séc','M'],['Hiroshi Sato','Nhật Bản','M'],['Olivia Brown','Úc','F'],['Lee Min-seo','Hàn Quốc','F'],['Rahul Nair','Ấn Độ','M'],['Thomas Weber','Đức','M'],['Chen Yu-ting','Đài Loan','F']];
const EXIT_REASONS=['Lương thưởng chưa cạnh tranh','Cơ hội thăng tiến','Môi trường / quản lý trực tiếp','Lý do cá nhân, gia đình','Chuyển nơi sinh sống','Hết hạn hợp đồng','Kỷ luật sa thải','Học tập nâng cao'];
const C_INDEF='Không xác định thời hạn',C_DEF='Xác định thời hạn',C_PROB='Thử việc';
function titleOf(d,g){
  if(d.id==='BOD')return g===13?'Tổng Giám đốc':pick(['Giám đốc Tài chính (CFO)','Giám đốc Vận hành (COO)','Giám đốc Nhân sự (CHRO)','Giám đốc Công nghệ (CTO)']);
  if(g===11)return 'Giám đốc khối '+d.name;
  if(g>=9)return 'Trưởng phòng '+d.name;
  if(g>=7)return pick(['Trưởng nhóm','Chuyên viên cao cấp'])+' '+d.name.split(' ')[0].toLowerCase();
  if(g>=5)return 'Chuyên viên '+d.name.split(' –')[0].toLowerCase();
  if(g===4)return 'Nhân viên '+d.name.split(' –')[0].toLowerCase();
  const low={PRD:g===3?'Tổ trưởng sản xuất':'Công nhân vận hành',SCM:'Nhân viên kho',ENG:'Kỹ thuật viên bảo trì',QA:'Kỹ thuật viên kiểm tra chất lượng'};
  return low[d.id]||'Trợ lý hành chính';
}
function genEmployees(){
  const list=[];let no=0,ex=0,bodTitles=['Giám đốc Tài chính (CFO)','Giám đốc Vận hành (COO)','Giám đốc Nhân sự (CHRO)','Giám đốc Công nghệ (CTO)'];
  for(const d of DEPTS){
    const siteKeys=Object.keys(d.sites);
    for(let i=0;i<d.n;i++){
      no++;
      let g=i===0?d.hi:d.lo+Math.floor((d.hi-d.lo)*Math.pow(R(),1.7));
      if(d.id==='BOD')g=i===0?13:12;
      const expat=(d.id==='BOD'&&i===0)||(g>=8&&ex<EXPATS.length&&['BOD','IT','RND','FIN','PRD','SAL','QA'].includes(d.id)&&R()<.2);
      let name,gender,nat='Việt Nam';
      if(expat){const x=EXPATS[ex++];name=x[0];nat=x[1];gender=x[2]==='F'?'Nữ':'Nam'}
      else{gender=R()<d.fem?'Nữ':'Nam';name=pick(SURN)+' '+(gender==='Nữ'?pick(MIDF):pick(MIDM))+' '+(gender==='Nữ'?pick(GIVF):pick(GIVM))}
      let r=R(),site=siteKeys[0],acc=0;for(const k of siteKeys){acc+=d.sites[k];if(r<=acc){site=k;break}}
      const scale=['PRD','SCM'].includes(d.id)?1300:1900;
      let ten=i===0?ri(1500,5600):Math.min(7400,Math.floor(-Math.log(1-R()*.995)*scale)+5);
      if(expat)ten=Math.min(ten,ri(200,2400));
      const hire=addDays(ANCHOR,-ten);
      let age=Math.max(18+ten/365+(g>=4?3:0),21+g*1.6+between(0,14));
      if(['PRD','SCM','ENG'].includes(d.id)&&g<=4&&R()<.035)age=gender==='Nam'?between(60.7,61.9):between(56.3,57.3);
      if(age>63)age=between(45,58);
      const dob=addDays(ANCHOR,-Math.round(age*365.25));
      const edu=g<=2?pick(['THPT','THPT','Trung cấp']):g===3?pick(['Trung cấp','Cao đẳng']):g<=7?pick(['Đại học','Đại học','Đại học','Cao đẳng']):(d.id==='RND'&&R()<.25?'Tiến sĩ':pick(['Đại học','Thạc sĩ']));
      const probDays=g>=9?180:g>=4?60:g===3?30:8;
      let contract,cEnd=null,cSeq=0,probEnd=null;
      if(ten<probDays){contract=C_PROB;probEnd=iso(addDays(hire,probDays))}
      else if(ten>3*365+probDays||R()<.25){contract=C_INDEF}
      else{contract=C_DEF;cSeq=ten>430+probDays?2:1;cEnd=iso(addDays(ANCHOR,R()<.13?ri(-8,45):ri(46,420)))}
      const p1=Math.round(SCALE_DEF[g]*between(.86,1.14)/10000)*10000;
      const comp=Math.max(0,Math.min(3,Math.round(between(0,1.3)+ten/365/4+(g>=6?.5:0))));
      const kpi=Math.round(Math.max(1.6,Math.min(5,3.55+gauss()*.55))*10)/10;
      const heavy=['PRD','SCM','ENG','QA'].includes(d.id)&&g<=6;
      const otM=heavy?Math.round(between(4,R()<.08?48:32)):Math.round(between(0,12));
      const monthsY=Math.min(10.5,ten/30.4);
      const otY=Math.round(otM*monthsY*between(.55,.8)*(heavy&&R()<.08?1.6:1));
      let status='Đang làm việc',exit=null,exitReason=null,matEnd=null;
      if(i>0&&d.id!=='BOD'&&R()<.105&&ten>40){
        const from=Math.max(+addDays(hire,30),+new Date(2026,0,2));
        if(from<+addDays(ANCHOR,-1)){status='Nghỉ việc';exit=iso(new Date(from+R()*(+addDays(ANCHOR,-1)-from)));exitReason=pick(EXIT_REASONS)}
      }
      if(status!=='Nghỉ việc'&&gender==='Nữ'&&age>23&&age<38&&R()<.018&&contract!==C_PROB){status='Nghỉ thai sản';matEnd=iso(addDays(ANCHOR,ri(8,170)))}
      const id='AMG-'+String(no).padStart(4,'0');
      list.push({id,name,gender,dob:iso(dob),edu,dept:d.id,site,grade:g,title:d.id==='BOD'&&i>0?bodTitles[i-1]:titleOf(d,g),hire:iso(hire),contract,cEnd,cSeq,probEnd,p1,comp,kpi,otM,otY,dep:age>28?ri(0,3):0,union:R()<.8,status,exit,exitReason,matEnd,expat,nat,
        wp:expat?iso(addDays(ANCHOR,ri(15,720))):null,leaveFrac:between(.3,.95),email:slug(name)+'@amg-vn.example'});
    }
  }
  return list;
}
const REQ_OPEN=[
 ['SAL','Sales Executive',5,4,'Cao','TopCV / VietnamWorks',45e6],['MKT','Content Executive',2,4,'Trung bình','TopCV',12e6],
 ['SAL','Chuyên viên CSKH',3,4,'Thấp','Giới thiệu nội bộ',9e6],['IT','Backend Developer',2,6,'Trung bình','LinkedIn / ITviec',40e6],
 ['PRD','Công nhân vận hành dây chuyền SMT',20,1,'Cao','Ngày hội việc làm / Giới thiệu',60e6],['ENG','Kỹ sư tự động hóa',2,6,'Cao','LinkedIn',30e6],
 ['QA','Chuyên viên EHS',1,6,'Cao','VietnamWorks',15e6],['FIN','Kế toán thuế',1,5,'Trung bình','TopCV',8e6],
 ['HR','HR Business Partner',1,7,'Trung bình','LinkedIn',20e6],['IT','Data Analyst',2,6,'Trung bình','LinkedIn',18e6],
 ['SCM','Trưởng phòng Mua hàng',1,9,'Cao','Headhunt',120e6],['RND','Kỹ sư thiết kế phần cứng',2,7,'Cao','Headhunt / LinkedIn',90e6]];
const REQ_DONE=[['SAL','Key Account Manager',1,8,'Headhunt',80e6],['PRD','Tổ trưởng sản xuất',3,3,'Giới thiệu nội bộ',6e6],['FIN','Chuyên viên FP&A',1,6,'LinkedIn',15e6],
 ['IT','IT Helpdesk',1,4,'TopCV',5e6],['HR','Chuyên viên C&B',1,6,'VietnamWorks',10e6],['SCM','Nhân viên kho',6,2,'Ngày hội việc làm',9e6]];
function genReqs(){
  const out=[];let k=0;
  for(const[dept,title,qty,grade,prio,channel,budget]of REQ_OPEN){
    k++;const opened=addDays(ANCHOR,-ri(6,85));const applied=qty*ri(10,38);const screened=Math.round(applied*between(.3,.5));
    const interviewed=Math.round(screened*between(.35,.6));const offered=Math.min(interviewed,Math.round(qty*between(.3,1.1)));const hired=Math.min(qty-1,Math.round(offered*between(.3,.8)));
    out.push({id:'REQ-26-'+z2(k),dept,title,qty,grade,prio,channel,budget,spent:Math.round(budget*between(.15,.85)/1e5)*1e5,opened:iso(opened),target:iso(addDays(opened,ri(40,65))),
      applied,screened,interviewed,offered,hired,status:offered>hired?'Offer':interviewed>0?'Phỏng vấn':'Đang tuyển',closed:null});
  }
  for(const[dept,title,qty,grade,channel,budget]of REQ_DONE){
    k++;const opened=new Date(2026,ri(0,7),ri(2,25));const ttf=ri(21,68);const applied=qty*ri(12,30);
    out.push({id:'REQ-26-'+z2(k),dept,title,qty,grade,prio:'Trung bình',channel,budget,spent:Math.round(budget*between(.7,1.05)/1e5)*1e5,opened:iso(opened),target:iso(addDays(opened,45)),
      applied,screened:Math.round(applied*.4),interviewed:Math.round(applied*.18),offered:qty+(R()<.4?1:0),hired:qty,status:'Hoàn tất',closed:iso(addDays(opened,ttf))});
  }
  return out;
}

/* ============ policy parameters (VN law + internal rules) ============ */
const PARAMS=[
 ['lttv1','Lương tối thiểu','Lương tối thiểu tháng – Vùng I',5310000,'đ','NĐ 293/2025/NĐ-CP','01/01/2026'],
 ['lttv2','Lương tối thiểu','Lương tối thiểu tháng – Vùng II',4730000,'đ','NĐ 293/2025/NĐ-CP','01/01/2026'],
 ['lttv3','Lương tối thiểu','Lương tối thiểu tháng – Vùng III',4140000,'đ','NĐ 293/2025/NĐ-CP','01/01/2026'],
 ['lttv4','Lương tối thiểu','Lương tối thiểu tháng – Vùng IV',3700000,'đ','NĐ 293/2025/NĐ-CP','01/01/2026'],
 ['lcs','Lương tối thiểu','Mức lương cơ sở (căn cứ trần BHXH, BHYT)',2340000,'đ','NĐ 73/2024/NĐ-CP','01/07/2024'],
 ['e_bhxh','Bảo hiểm bắt buộc','NLĐ đóng BHXH',8,'%','Luật BHXH 2024 (Luật 41/2024/QH15)','01/07/2025'],
 ['e_bhyt','Bảo hiểm bắt buộc','NLĐ đóng BHYT',1.5,'%','Luật BHYT & NĐ 146/2018/NĐ-CP','—'],
 ['e_bhtn','Bảo hiểm bắt buộc','NLĐ đóng BHTN (không áp dụng LĐ nước ngoài)',1,'%','Luật Việc làm 2025','01/01/2026'],
 ['c_bhxh','Bảo hiểm bắt buộc','NSDLĐ đóng BHXH (14% hưu trí-tử tuất, 3% ốm đau-thai sản, 0,5% TNLĐ-BNN)',17.5,'%','Luật BHXH 2024; NĐ 58/2020/NĐ-CP','01/07/2025'],
 ['c_bhyt','Bảo hiểm bắt buộc','NSDLĐ đóng BHYT',3,'%','Luật BHYT','—'],
 ['c_bhtn','Bảo hiểm bắt buộc','NSDLĐ đóng BHTN',1,'%','Luật Việc làm 2025','01/01/2026'],
 ['kpcd','Bảo hiểm bắt buộc','Kinh phí công đoàn (NSDLĐ, trên quỹ lương đóng BHXH)',2,'%','Luật Công đoàn 2024','01/07/2025'],
 ['capBHXH','Bảo hiểm bắt buộc','Trần lương đóng BHXH, BHYT (số lần lương cơ sở)',20,'lần','Luật BHXH 2024','01/07/2025'],
 ['capBHTN','Bảo hiểm bắt buộc','Trần lương đóng BHTN (số lần lương tối thiểu vùng)',20,'lần','Luật Việc làm','—'],
 ['gt_self','Thuế TNCN','Giảm trừ gia cảnh bản thân / tháng',15500000,'đ','NQ 110/2025/UBTVQH15','01/01/2026'],
 ['gt_dep','Thuế TNCN','Giảm trừ mỗi người phụ thuộc / tháng',6200000,'đ','NQ 110/2025/UBTVQH15','01/01/2026'],
 ['t1','Thuế TNCN','Biểu lũy tiến – ngưỡng bậc 1',10000000,'đ','Luật Thuế TNCN (sửa đổi) 2025','2026'],
 ['t2','Thuế TNCN','Biểu lũy tiến – ngưỡng bậc 2',30000000,'đ','Luật Thuế TNCN (sửa đổi) 2025','2026'],
 ['t3','Thuế TNCN','Biểu lũy tiến – ngưỡng bậc 3',60000000,'đ','Luật Thuế TNCN (sửa đổi) 2025','2026'],
 ['t4','Thuế TNCN','Biểu lũy tiến – ngưỡng bậc 4',100000000,'đ','Luật Thuế TNCN (sửa đổi) 2025','2026'],
 ['r1','Thuế TNCN','Thuế suất bậc 1',5,'%','Luật Thuế TNCN (sửa đổi) 2025','2026'],
 ['r2','Thuế TNCN','Thuế suất bậc 2',10,'%','Luật Thuế TNCN (sửa đổi) 2025','2026'],
 ['r3','Thuế TNCN','Thuế suất bậc 3',20,'%','Luật Thuế TNCN (sửa đổi) 2025','2026'],
 ['r4','Thuế TNCN','Thuế suất bậc 4',30,'%','Luật Thuế TNCN (sửa đổi) 2025','2026'],
 ['r5','Thuế TNCN','Thuế suất bậc 5',35,'%','Luật Thuế TNCN (sửa đổi) 2025','2026'],
 ['lunch','Thuế TNCN','Phụ cấp ăn ca bằng tiền (không tính thuế)',730000,'đ','TT 111/2013/TT-BTC & hướng dẫn hiện hành','—'],
 ['otMonth','Thời giờ làm việc','Giới hạn làm thêm / tháng',40,'giờ','Điều 107 BLLĐ 2019; NĐ 145/2020/NĐ-CP','01/01/2021'],
 ['otYear','Thời giờ làm việc','Giới hạn làm thêm / năm (thông thường)',200,'giờ','Điều 107 BLLĐ 2019','01/01/2021'],
 ['otYearSp','Thời giờ làm việc','Giới hạn làm thêm / năm (ngành SX điện tử, đã thông báo Sở Nội vụ)',300,'giờ','Điều 107 BLLĐ 2019; Điều 61 NĐ 145/2020','01/01/2021'],
 ['otWeekday','Thời giờ làm việc','Đơn giá làm thêm ngày thường',150,'%','Điều 98 BLLĐ 2019','01/01/2021'],
 ['otWeekend','Thời giờ làm việc','Đơn giá làm thêm ngày nghỉ hằng tuần',200,'%','Điều 98 BLLĐ 2019','01/01/2021'],
 ['otHoliday','Thời giờ làm việc','Đơn giá làm thêm ngày lễ, Tết',300,'%','Điều 98 BLLĐ 2019','01/01/2021'],
 ['stdDays','Thời giờ làm việc','Ngày công chuẩn / tháng (nội bộ, T2–T6)',22,'ngày','Nội quy lao động AMG','01/01/2026'],
 ['leaveBase','Nghỉ phép & nghỉ hưu','Nghỉ hằng năm cơ bản',12,'ngày','Điều 113 BLLĐ 2019','01/01/2021'],
 ['leaveStep','Nghỉ phép & nghỉ hưu','Cứ đủ số năm này được cộng thêm 1 ngày phép',5,'năm','Điều 114 BLLĐ 2019','01/01/2021'],
 ['retireM','Nghỉ phép & nghỉ hưu','Tuổi nghỉ hưu nam (lộ trình 2026: 61 tuổi 6 tháng)',61.5,'tuổi','Điều 169 BLLĐ 2019; NĐ 135/2020/NĐ-CP','2026'],
 ['retireF','Nghỉ phép & nghỉ hưu','Tuổi nghỉ hưu nữ (lộ trình 2026: 57 tuổi)',57,'tuổi','Điều 169 BLLĐ 2019; NĐ 135/2020/NĐ-CP','2026'],
 ['p2Rate','Quy chế 3P & phúc lợi','P2 – phụ cấp năng lực mỗi cấp (% P1)',6,'%','Quy chế lương 3P AMG (phương pháp Mercer)','01/01/2026'],
 ['p3Target','Quy chế 3P & phúc lợi','P3 – lương hiệu suất mục tiêu (% P1)',10,'%','Quy chế lương 3P AMG','01/01/2026'],
 ['probPay','Quy chế 3P & phúc lợi','Lương thử việc (% lương chính thức, tối thiểu 85%)',85,'%','Điều 26 BLLĐ 2019','01/01/2021'],
 ['phone','Quy chế 3P & phúc lợi','Phụ cấp điện thoại',500000,'đ','Quy chế phúc lợi AMG','01/01/2026'],
 ['travel','Quy chế 3P & phúc lợi','Phụ cấp đi lại',500000,'đ','Quy chế phúc lợi AMG','01/01/2026'],
 ['housing','Quy chế 3P & phúc lợi','Phụ cấp nhà ở chuyên gia nước ngoài',15000000,'đ','Chính sách điều chuyển quốc tế AMG','01/01/2026'],
 ['healthIns','Quy chế 3P & phúc lợi','Bảo hiểm sức khỏe tư nhân / người / tháng',450000,'đ','Chính sách phúc lợi AMG','01/01/2026'],
 ['wedding','Quy chế 3P & phúc lợi','Mừng cưới nhân viên',3000000,'đ','Chính sách phúc lợi AMG','01/01/2026'],
 ['birth','Quy chế 3P & phúc lợi','Hỗ trợ sinh con (tối đa 2 bé)',2000000,'đ','Chính sách phúc lợi AMG','01/01/2026'],
 ['bday','Quy chế 3P & phúc lợi','Quà sinh nhật',500000,'đ','Chính sách phúc lợi AMG','01/01/2026'],
 ['training','Quy chế 3P & phúc lợi','Ngân sách đào tạo năm',1800000000,'đ','Kế hoạch đào tạo 2026','01/01/2026'],
 ['revenue','Quy chế 3P & phúc lợi','Doanh thu kế hoạch / tháng (để tính tỷ lệ chi phí)',105000000000,'đ','Kế hoạch kinh doanh 2026','01/01/2026'],
].map(([k,g,label,v,unit,basis,eff])=>({k,g,label,v,unit,basis,eff}));
const DEF=Object.fromEntries(PARAMS.map(p=>[p.k,p.v]));
const LEGAL_GROUPS=['Lương tối thiểu','Bảo hiểm bắt buộc','Thuế TNCN','Thời giờ làm việc','Nghỉ phép & nghỉ hưu'];
function P(k){const o=S.col.settings.policy&&S.col.settings.policy.values;return o&&o[k]!=null&&o[k]!==''?Number(o[k]):DEF[k]}
function scaleMid(g){const o=S.col.settings.policy&&S.col.settings.policy.scale;return o&&o[g]?Number(o[g]):SCALE_DEF[g]}
const RATE_F={A:1.5,B:1.2,C:1,D:.5,E:0},BONUS_M={A:2.5,B:1.8,C:1.2,D:.5,E:0};
const rating=k=>k>=4.5?'A':k>=3.9?'B':k>=3?'C':k>=2.3?'D':'E';

/* ============ legal reporting calendar (from "Timeline nộp các báo cáo nhân sự bắt buộc") ============ */
const REPORTS=[
 {id:'R1',name:'Báo cáo tình hình biến động lao động (tăng/giảm) hằng tháng',freq:'Hằng tháng, nếu có biến động',dates:'m3',basis:'Khoản 2 Điều 16 TT 28/2015/TT-BLĐTBXH',to:'Trung tâm Dịch vụ việc làm',note:'Luật Việc làm 2025 có hiệu lực 01/01/2026: đối chiếu văn bản hướng dẫn mới.',file:'9. Mẫu thông báo về tình hình biến động lao động'},
 {id:'R2',name:'Báo cáo tình hình thay đổi lao động',freq:'2 lần/năm',dates:[[6,5],[12,5]],basis:'Khoản 2 Điều 4 NĐ 145/2020/NĐ-CP (sửa đổi bởi NĐ 35/2022/NĐ-CP)',to:'Sở Nội vụ (nhận chức năng LĐTBXH từ 03/2025) qua Cổng DVC',file:'1. Mẫu báo cáo tình hình sử dụng lao động'},
 {id:'R3',name:'Báo cáo tổng hợp tình hình tai nạn lao động',freq:'2 lần/năm',dates:[[1,10],[7,5]],basis:'Khoản 1 Điều 24 NĐ 39/2016/NĐ-CP',to:'Sở Nội vụ',file:'2. Mẫu báo cáo tình hình tai nạn lao động'},
 {id:'R4',name:'Báo cáo y tế lao động',freq:'2 lần/năm',dates:[[1,10],[7,5]],basis:'Điều 10 TT 19/2016/TT-BYT',to:'Sở Y tế',file:'4. Mẫu báo cáo y tế lao động'},
 {id:'R5',name:'Báo cáo công tác an toàn vệ sinh lao động',freq:'1 lần/năm',dates:[[1,10]],basis:'Khoản 2 Điều 10 TT 07/2016/TT-BLĐTBXH',to:'Sở Nội vụ',file:'3. Mẫu báo cáo công tác an toàn vệ sinh lao động'},
 {id:'R6',name:'Báo cáo tình hình tham gia bảo hiểm thất nghiệp',freq:'1 lần/năm',dates:[[1,15]],basis:'Khoản 7 Điều 32 NĐ 28/2015/NĐ-CP',to:'Trung tâm Dịch vụ việc làm',note:'Đối chiếu Luật Việc làm 2025.',file:'6. Mẫu báo cáo tình hình thất nghiệp'},
 {id:'R7',name:'Báo cáo tình hình sử dụng người lao động nước ngoài',freq:'2 lần/năm',dates:[[1,5],[7,5]],basis:'Khoản 1 Điều 6 NĐ 152/2020/NĐ-CP',to:'Sở Nội vụ',note:'NĐ 219/2025/NĐ-CP thay thế NĐ 152/2020 từ 08/2025: kiểm tra lại kỳ hạn và mẫu biểu.',file:'5. Mẫu báo cáo sử dụng lao động nước ngoài'},
 {id:'R8',name:'Báo cáo tình hình cho thuê lại lao động',freq:'2 lần/năm',dates:[[6,20],[12,20]],basis:'Khoản 2 Điều 31 NĐ 145/2020/NĐ-CP (sửa đổi bởi NĐ 35/2022)',to:'Sở Nội vụ',na:'AMG không hoạt động cho thuê lại lao động',file:'8. Mẫu báo cáo cho thuê lại lao động'},
 {id:'R9',name:'Báo cáo định kỳ tình hình hoạt động kiểm định',freq:'Theo kỳ',dates:[[1,10],[7,10]],basis:'Dành cho tổ chức kiểm định kỹ thuật an toàn',to:'Bộ quản lý ngành',na:'Chỉ áp dụng với tổ chức kiểm định',file:'7. Mẫu báo cáo định kỳ tình hình hoạt động kiểm định'},
];
function dueDates(r,T){
  const ys=[T.getFullYear()-1,T.getFullYear(),T.getFullYear()+1];let all=[];
  if(r.dates==='m3'){for(const y of ys)for(let m=0;m<12;m++)all.push(new Date(y,m,3))}
  else for(const y of ys)for(const[m,d]of r.dates)all.push(new Date(y,m-1,d));
  all.sort((a,b)=>a-b);
  return{next:all.find(d=>d>=T),prev:[...all].reverse().find(d=>d<T)};
}
const HOLIDAYS=[['2026-01-01','Tết Dương lịch',1],['2026-02-14','Tết Nguyên đán Bính Ngọ (14/02–22/02)',5],['2026-04-27','Giỗ Tổ Hùng Vương (bù, 10/3 âm lịch rơi CN 26/04)',1],['2026-04-30','Ngày Chiến thắng',1],['2026-05-01','Quốc tế Lao động',1],['2026-09-01','Quốc khánh (01–02/09)',2],['2027-01-01','Tết Dương lịch 2027',1],['2027-02-05','Tết Nguyên đán Đinh Mùi 2027 (dự kiến)',5]];

/* ============ BSC KPI library (from "Ebook 121 Template KPI phòng ban") ============ */
const BSC={
 BOD:[['Tài chính','Biên EBITDA','≥ 14%',14,'%'],['Khách hàng','Tăng trưởng doanh thu','≥ 12%',12,'%'],['Quy trình','Tuân thủ pháp luật (vi phạm)','0',0,'vụ'],['Học hỏi','eNPS','≥ 30',30,'']],
 FIN:[['Tài chính','Chi phí tài chính / doanh thu','≤ 1,2%',1.2,'%'],['Khách hàng','Báo cáo quản trị đúng hạn','100%',100,'%'],['Quy trình','Đóng sổ tháng','≤ 5 ngày',5,'ngày'],['Học hỏi','Giờ đào tạo/người','≥ 24',24,'giờ']],
 HR:[['Tài chính','Chi phí NS / doanh thu','≤ 22%',22,'%'],['Khách hàng','Tỷ lệ nghỉ việc năm','≤ 12%',12,'%'],['Quy trình','Thời gian tuyển trung bình','≤ 45 ngày',45,'ngày'],['Học hỏi','Tỷ lệ NV được đào tạo ban đầu','≥ 90%',90,'%'],['Quy trình','Hồ sơ cập nhật chính xác','≥ 99%',99,'%'],['Quy trình','Tổ chức đánh giá đúng kỳ hạn','100%',100,'%']],
 SAL:[['Tài chính','Doanh số / kế hoạch','≥ 100%',100,'%'],['Khách hàng','Tỷ lệ khách hàng mới','≥ 18%',18,'%'],['Quy trình','Thu hồi công nợ đúng hạn','≥ 92%',92,'%'],['Học hỏi','Giờ đào tạo bán hàng/người','≥ 16',16,'giờ']],
 MKT:[['Tài chính','ROI chiến dịch','≥ 3,0x',3,'x'],['Khách hàng','Lead đạt chuẩn / tháng','≥ 450',450,''],['Quy trình','Nội dung đúng lịch','≥ 95%',95,'%'],['Học hỏi','Chứng chỉ số / người','≥ 1',1,'']],
 IT:[['Tài chính','Chi phí IT / kế hoạch','≤ 100%',100,'%'],['Khách hàng','Ticket đúng SLA','≥ 95%',95,'%'],['Quy trình','Uptime hệ thống lõi','≥ 99,9%',99.9,'%'],['Học hỏi','Sự cố bảo mật nghiêm trọng','0',0,'vụ']],
 RND:[['Tài chính','Doanh thu sản phẩm mới','≥ 15%',15,'%'],['Khách hàng','Sản phẩm ra mắt / năm','≥ 4',4,''],['Quy trình','Dự án đúng mốc','≥ 85%',85,'%'],['Học hỏi','Đơn đăng ký sáng chế','≥ 3',3,'']],
 PRD:[['Tài chính','Giá thành / kế hoạch','≤ 100%',100,'%'],['Khách hàng','OEE','≥ 80%',80,'%'],['Quy trình','Tỷ lệ phế phẩm','≤ 1,5%',1.5,'%'],['Học hỏi','Tai nạn lao động','0',0,'vụ']],
 SCM:[['Tài chính','Tiết kiệm mua hàng','≥ 3%',3,'%'],['Khách hàng','Giao hàng đúng hạn','≥ 97%',97,'%'],['Quy trình','Độ chính xác tồn kho','≥ 99,5%',99.5,'%'],['Học hỏi','Vòng quay tồn kho','≥ 8',8,'vòng']],
 QA:[['Tài chính','Chi phí chất lượng kém','≤ 0,8%',.8,'%'],['Khách hàng','Khiếu nại / triệu SP','≤ 25',25,''],['Quy trình','Đạt kiểm tra đầu vào','≥ 98%',98,'%'],['Học hỏi','Huấn luyện ATVSLĐ','100%',100,'%']],
 ENG:[['Tài chính','Chi phí bảo trì / kế hoạch','≤ 100%',100,'%'],['Khách hàng','Thời gian dừng máy','≤ 2%',2,'%'],['Quy trình','Bảo trì đúng kế hoạch','≥ 95%',95,'%'],['Học hỏi','MTBF (giờ)','≥ 650',650,'giờ']],
 LEG:[['Tài chính','Chi phí tranh chấp','≤ 300 tr',300,'tr'],['Khách hàng','Hợp đồng rà soát ≤ 3 ngày','≥ 95%',95,'%'],['Quy trình','Tranh chấp lao động','0',0,'vụ'],['Học hỏi','Đào tạo tuân thủ','100%',100,'%']],
};
const LOWER_BETTER=/≤|^0$/;

/* ============ document library (files in folder HR SYSTEM) ============ */
const LIB=[
 {g:'Lương 3P theo phương pháp Mercer',mod:'payroll',items:['Mẫu thu thập thông tin','Đánh giá công việc: so sánh thị trường & tính điểm','Thiết lập hệ thống cấp bậc theo PC','Xây dựng thang bảng lương (P1 – pay for position)','Từ điển năng lực & khung năng lực (P2)','Đánh giá năng lực, khung chi trả theo NLCN','Chương trình thưởng hiệu quả công việc (P3)','Mẫu bảng lương 3P']},
 {g:'Bộ KPI phòng ban (121 template)',mod:'kpi',items:['KPI Giám đốc Tài chính, Kế toán tổng hợp','KPI Quản lý & Nhân viên, KPI Sales','Bộ KPI phòng Nhân sự','BSC Kho vận, Kế toán, Kinh doanh, Kỹ thuật, R&D, Sản xuất, Mua hàng','Phân chia BSC – RASCI KPI']},
 {g:'Dashboard báo cáo nhân sự',mod:'overview',items:['Dashboard quản lý chấm công','Dashboard hiệu quả tuyển dụng','Dashboard quản lý tiền lương','Dashboard biến động nhân sự','Báo cáo tuyển mới, nghỉ việc theo thời gian','Tổng quan chi trả lương năm']},
 {g:'Báo cáo chi phí nhân sự',mod:'cost',items:['Bảng tổng hợp chi phí nhân sự','Chi phí lương, bảo hiểm NLĐ','Chi phí ăn ca, y tế, bảo hộ lao động','CCDC, VPP, điện nước, viễn thông, tiếp khách','Hướng dẫn thống kê các loại chi phí nhân sự']},
 {g:'Báo cáo HR bắt buộc phải nộp',mod:'compliance',items:['9 mẫu báo cáo: sử dụng LĐ, TNLĐ, ATVSLĐ, y tế, LĐ nước ngoài, thất nghiệp, kiểm định, cho thuê lại, biến động LĐ','Timeline nộp báo cáo trong năm']},
 {g:'Tuyển dụng 2026',mod:'recruit',items:['Masterfile tuyển dụng 2026 (kế hoạch, ngân sách, checklist, tiến độ)','Tuyển dụng nhân sự cấp cao','Quy chế tuyển dụng; phiếu đề xuất tuyển dụng','22 biểu mẫu NS-02 (yêu cầu, JD, tiêu chuẩn chức danh, kế hoạch tháng/quý/năm, câu hỏi phỏng vấn, thư mời)','9 biểu mẫu QT-NS-01 (hồ sơ, đánh giá phỏng vấn, chương trình thử việc, đánh giá sau thử việc, thủ tục nhận việc)','Ma trận đánh giá vị trí, 4 bảng đánh giá năng lực','25+ mẫu email tuyển dụng; Ebook Onboarding; HR Map']},
 {g:'HR Toolkit 360',mod:'people',items:['5 mẫu thư mời nhận việc','Biểu mẫu kiểm tra thông tin NV mới / quản lý / nhân sự','Thống kê & quản lý nhân sự','Giấy đề nghị tăng ca; ủy quyền lĩnh thay lương; mẫu 01B-HSB, 22B-HSB','Đánh giá thử việc, gia hạn hợp đồng, làm việc nhóm; 10 mẫu đánh giá hiệu suất','Chính sách ngày nghỉ; mẫu chính sách phúc lợi','Kế hoạch nâng cao chất lượng hệ thống QTNS']},
 {g:'Quy trình hành chính – nhân sự (bộ quy trình 2024)',mod:'compliance',items:['Tuyển dụng; triển khai tuyển dụng','Hoàn tất hồ sơ nhân sự; nội quy, quy chế lao động','Thử việc, học việc; theo dõi HĐ chính thức','Đào tạo; đào tạo nội bộ; đào tạo thuê ngoài','Thuyên chuyển công tác','Thanh tra, kiểm tra nội bộ; xác minh & xử lý vi phạm','Nghỉ phép; xử lý xin thôi việc; nghỉ việc; sa thải','Quản lý tài sản']},
 {g:'Quy trình liên phòng ban',mod:'cost',items:['Tính lương; kế toán lương','Thanh toán, tạm ứng, công tác phí; chi tiêu nội bộ','Kiểm soát nội bộ; đánh giá nội bộ; xem xét của lãnh đạo','An toàn và vệ sinh lao động']},
];
const STANDARDS=[
 ['ILO – 8 công ước cơ bản','Việt Nam đã phê chuẩn C29, C100, C105, C111, C138, C182, C98; C87 (tự do hiệp hội) chưa phê chuẩn. Áp dụng: không lao động cưỡng bức, trẻ em, phân biệt đối xử; trả lương bình đẳng.'],
 ['ILO C155 / ISO 45001','An toàn sức khỏe nghề nghiệp: chương trình ATVSLĐ, huấn luyện 100% lao động nhà máy, điều tra tai nạn.'],
 ['ISO 30414:2025','Báo cáo vốn con người: chi phí nhân sự, tỷ lệ nghỉ việc, thời gian tuyển, đào tạo, đa dạng. Các chỉ số trong trang này theo khung này.'],
 ['GDPR (EU) & Luật Bảo vệ dữ liệu cá nhân 2025','Hồ sơ nhân sự là dữ liệu cá nhân: cần đồng ý, mục đích rõ ràng, phân quyền truy cập, đánh giá tác động khi chuyển dữ liệu ra nước ngoài (Luật 91/2025/QH15 hiệu lực 01/01/2026).'],
 ['Chương lao động EVFTA / CPTPP','Cam kết tôn trọng nguyên tắc cơ bản của ILO, đối thoại xã hội, tổ chức đại diện NLĐ tại doanh nghiệp.'],
 ['UNGP & OECD Guidelines for MNEs','Thẩm định nhân quyền trong chuỗi cung ứng; cơ chế khiếu nại cho NLĐ và nhà thầu.'],
 ['SOX / FCPA (công ty mẹ niêm yết Hoa Kỳ)','Kiểm soát nội bộ quy trình tính lương, phân tách nhiệm vụ, phê duyệt hai cấp; chống hối lộ trong chi phí tiếp khách.'],
];
const OFFICIAL=[['Cổng Thông tin điện tử Chính phủ','https://chinhphu.vn'],['Cơ sở dữ liệu quốc gia về văn bản pháp luật','https://vbpl.vn'],['Bảo hiểm xã hội Việt Nam','https://baohiemxahoi.gov.vn'],['Tổng cục / Cục Thuế','https://gdt.gov.vn'],['Cổng Dịch vụ công quốc gia','https://dichvucong.gov.vn'],['ILO NORMLEX (Việt Nam)','https://normlex.ilo.org']];

/* ============ state ============ */
const COLS=['employees','reqs','tasks','runs','audit','payrolls','filings','settings','training','onboard','offboard','relations','policyHistory','merit'];
const S={view:'overview',base:genEmployees(),reqBase:genReqs(),col:Object.fromEntries(COLS.map(c=>[c,{}])),
  db:null,user:null,comments:null,downloads:null,sample:null,meId:null,me:null,isOwner:false,canAdmin:false,canWrite:true,mode:'connecting',
  f:{q:'',dept:'',site:'',status:'active',contract:'',page:0,pq:'',pp:0,bsc:'SAL'},profiles:{},ai:{policy:null,report:null,busy:''},mcp:null,sheet:{busy:'',msg:''}};

/* ============ model ============ */
function calcPay(e){
  if(e.status!=='Đang làm việc')return null;
  const prob=e.contract===C_PROB,site=SITES[e.site]||SITES.HCM,rt=rating(e.kpi);
  const p1=prob?e.p1*P('probPay')/100:e.p1,p2=prob?0:e.p1*P('p2Rate')/100*e.comp,p3=prob?0:e.p1*P('p3Target')/100*RATE_F[rt];
  const lunch=P('lunch'),phone=P('phone'),travel=P('travel'),housing=e.expat?P('housing'):0;
  const hourly=e.p1/P('stdDays')/8,ot=hourly*e.otM*P('otWeekday')/100,otEx=hourly*e.otM*(P('otWeekday')-100)/100;
  const dUnpaid=e.att?e.p1/P('stdDays')*e.att.unpaid:0,dSick=e.att?e.p1/P('stdDays')*e.att.sick:0;
  const gross=Math.max(0,p1+p2+p3+lunch+phone+travel+housing+ot-dUnpaid-dSick);
  const insSal=prob?0:Math.min(p1+p2,P('capBHXH')*P('lcs'));
  const insTN=prob||e.expat?0:Math.min(p1+p2,P('capBHTN')*P('lttv'+site.region));
  const eBHXH=insSal*P('e_bhxh')/100,eBHYT=insSal*P('e_bhyt')/100,eBHTN=insTN*P('e_bhtn')/100,insE=eBHXH+eBHYT+eBHTN;
  const taxable=Math.max(0,gross-lunch-otEx),assess=Math.max(0,taxable-insE-P('gt_self')-e.dep*P('gt_dep')),tax=pitOf(assess);
  const cBHXH=insSal*P('c_bhxh')/100,cBHYT=insSal*P('c_bhyt')/100,cBHTN=insTN*P('c_bhtn')/100,insC=cBHXH+cBHYT+cBHTN,kpcd=insSal*P('kpcd')/100,health=P('healthIns');
  return{dUnpaid,dSick,prob,p1,p2,p3,lunch,phone,travel,housing,ot,gross,insSal,insTN,eBHXH,eBHYT,eBHTN,insE,taxable,assess,tax,net:gross-insE-tax,cBHXH,cBHYT,cBHTN,insC,kpcd,health,cost:gross+insC+kpcd+health,minWage:P('lttv'+site.region)};
}
function pitOf(x){if(x<=0)return 0;const th=[P('t1'),P('t2'),P('t3'),P('t4'),Infinity],rt=[P('r1'),P('r2'),P('r3'),P('r4'),P('r5')];let t=0,prev=0;for(let i=0;i<5;i++){if(x>prev)t+=(Math.min(x,th[i])-prev)*rt[i]/100;prev=th[i]}return t}
function leaveOf(e,T){
  const yrs=Math.floor(e.tenureY),h=parse(e.hire),Y=T.getFullYear();
  const full=P('leaveBase')+Math.floor(yrs/P('leaveStep'));
  const months=h.getFullYear()===Y?12-h.getMonth():12;
  const ent=Math.round(full*months/12*2)/2;
  const used=e.leaveUsed!=null?Number(e.leaveUsed):Math.round(ent*e.leaveFrac*((T.getMonth()+1)/12)*2)/2;
  return{full,ent,used:Math.min(used,ent),rem:Math.max(0,ent-used)};
}
function mergedEmployees(){
  const ov=S.col.employees;
  const out=S.base.map(b=>ov[b.id]&&!ov[b.id]._new?{...b,...ov[b.id]}:{...b});
  for(const[id,d]of Object.entries(ov))if(d._new)out.push({...d,id});
  for(const e of out)e._p1Base=Number(e.p1);
  const layers=[...Object.values(S.col.merit).sort((a,b)=>a.at-b.at).map(x=>x.factors||{}),...(S.sim?[S.sim]:[])];
  for(const f of layers)for(const e of out)if(f[e.id])e.p1=Math.round(Number(e.p1)*(1+f[e.id]/100)/10000)*10000;
  return out;
}
function mergedReqs(){
  const ov=S.col.reqs;const out=S.reqBase.map(b=>ov[b.id]&&!ov[b.id]._new?{...b,...ov[b.id]}:{...b});
  for(const[id,d]of Object.entries(ov))if(d._new)out.push({...d,id});
  return out;
}
let M=null;
function build(){
  const T=today(),Y=T.getFullYear(),mNow=T.getMonth();
  const emps=mergedEmployees();
  for(const e of emps){
    e.kpi=Number(e.kpi);e.p1=Number(e.p1);e.grade=Number(e.grade);e.comp=Number(e.comp);e.otM=Number(e.otM);e.otY=Number(e.otY);e.dep=Number(e.dep);
    const end=e.status==='Nghỉ việc'&&e.exit?parse(e.exit):T;
    e.tenureY=Math.max(0,days(parse(e.hire),end)/365.25);e.age=days(parse(e.dob),T)/365.25;e.rating=rating(e.kpi);
    e.att=attendance(e,T);e.pay=calcPay(e);e.leave=leaveOf(e,T);e.deptName=(DEPT[e.dept]||{name:e.dept}).name;
  }
  const active=emps.filter(e=>e.status!=='Nghỉ việc'&&parse(e.hire)<=T);
  const working=active.filter(e=>e.status==='Đang làm việc');
  const hiresY=emps.filter(e=>{const h=parse(e.hire);return h.getFullYear()===Y&&h<=T});
  const exitsY=emps.filter(e=>e.status==='Nghỉ việc'&&e.exit&&parse(e.exit).getFullYear()===Y);
  const monthly=MONTHS.map((_,m)=>{
    const end=m===mNow?T:new Date(Y,m+1,0);
    return{h:hiresY.filter(e=>parse(e.hire).getMonth()===m).length,x:exitsY.filter(e=>parse(e.exit).getMonth()===m).length,
      hc:m>mNow?null:emps.filter(e=>parse(e.hire)<=end&&!(e.status==='Nghỉ việc'&&e.exit&&parse(e.exit)<=end)).length};
  });
  const hcs=monthly.filter(x=>x.hc!=null).map(x=>x.hc);const avgHC=avg(hcs,x=>x)||active.length;
  const turnover=exitsY.length/avgHC,turnAnn=turnover*12/(mNow+1);
  const payroll=working.filter(e=>e.pay);
  const tot={};for(const k of['p1','p2','p3','lunch','phone','travel','housing','ot','gross','insE','tax','net','insC','kpcd','health','cost','eBHXH','eBHYT','eBHTN','cBHXH','cBHYT','cBHTN','dUnpaid','dSick'])tot[k]=sum(payroll,e=>e.pay[k]);
  const reqs=mergedReqs();
  const openReqs=reqs.filter(r=>r.status!=='Hoàn tất'&&r.status!=='Hủy');
  const closed=reqs.filter(r=>r.status==='Hoàn tất'&&r.closed);
  const ttf=avg(closed,r=>days(parse(r.opened),parse(r.closed)));
  M={T,Y,emps,active,working,hiresY,exitsY,monthly,avgHC,turnover,turnAnn,payroll,tot,reqs,openReqs,closed,ttf};
  M.relations=mergedRelations();M.train=trainState(M);M.life=lifecycle(M);
  M.checks=runChecks(M);
  M.reports=REPORTS.map(r=>{const d=dueDates(r,T);const key=r.id+'_'+iso(d.next);const prevKey=d.prev?r.id+'_'+iso(d.prev):null;
    return{...r,next:d.next,prev:d.prev,left:days(T,d.next),filed:!!S.col.filings[key],key,prevFiled:prevKey?!!S.col.filings[prevKey]:true,prevKey}});
  M.tasks=Object.entries(S.col.tasks).map(([id,t])=>({id,...t})).sort((a,b)=>(a.status==='done')-(b.status==='done')||String(a.due||'').localeCompare(String(b.due||'')));
  return M;
}
function runChecks(M){
  const T=M.T,out=[],add=(type,sev,e,msg,due,law)=>out.push({key:type+'_'+(e?e.id:'org')+'_'+(due||''),type,sev,e,msg,due,law});
  for(const e of M.active){
    if(e.pay&&e.pay.p1<e.pay.minWage)add('minwage','crit',e,`Lương ${fmt(e.pay.p1)}đ thấp hơn lương tối thiểu vùng ${fmt(e.pay.minWage)}đ`,iso(T),'NĐ 293/2025/NĐ-CP');
    const capY=e.dept==='PRD'?P('otYearSp'):P('otYear');
    if(e.status==='Đang làm việc'&&e.otM>P('otMonth'))add('otm','crit',e,`Làm thêm ${e.otM} giờ trong tháng, vượt giới hạn ${P('otMonth')} giờ`,iso(T),'Điều 107 BLLĐ 2019');
    if(e.status==='Đang làm việc'&&e.otY>capY)add('oty','crit',e,`Làm thêm lũy kế ${e.otY} giờ/năm, vượt ${capY} giờ`,iso(T),'Điều 107 BLLĐ 2019');
    else if(e.status==='Đang làm việc'&&e.otY>capY*.9)add('oty90','warn',e,`Làm thêm lũy kế ${e.otY}/${capY} giờ, sắp chạm giới hạn năm`,iso(T),'Điều 107 BLLĐ 2019');
    if(e.contract===C_DEF&&e.cEnd){const l=days(T,parse(e.cEnd));
      if(l<0)add('cexp','crit',e,`HĐ xác định thời hạn đã hết ${-l} ngày nhưng NLĐ vẫn làm việc. Quá 30 ngày không ký mới sẽ thành HĐ không xác định thời hạn`,e.cEnd,'Khoản 2 Điều 20 BLLĐ 2019');
      else if(l<=45)add('cend',l<=15?'crit':'warn',e,`HĐ hết hạn ${vn(e.cEnd)} (còn ${l} ngày). Thông báo bằng văn bản trước 15 ngày${e.cSeq>=2?'; đã ký 2 lần nên nếu tiếp tục phải ký HĐ không xác định thời hạn':''}`,e.cEnd,'Điều 20, 45 BLLĐ 2019');}
    if(e.contract===C_PROB&&e.probEnd){const l=days(T,parse(e.probEnd));if(l<=7)add('prob',l<0?'crit':'warn',e,l<0?`Đã quá hạn thử việc ${-l} ngày: phải thông báo kết quả và ký HĐ chính thức`:`Kết thúc thử việc ${vn(e.probEnd)}: đánh giá theo "Biểu mẫu đánh giá thời gian thử việc"`,e.probEnd,'Điều 27 BLLĐ 2019')}
    if(e.expat&&e.wp){const l=days(T,parse(e.wp));if(l<=90)add('wp',l<=45?'crit':'warn',e,`Giấy phép lao động hết hạn ${vn(e.wp)} (còn ${l} ngày): nộp hồ sơ gia hạn trong khoảng 5–45 ngày trước hạn`,e.wp,'NĐ 219/2025/NĐ-CP')}
    const ra=e.gender==='Nam'?P('retireM'):P('retireF');const toR=ra-e.age;
    if(!e.expat&&toR<=1){add('retire',toR<=0?'crit':'info',e,toR<=0?`Đã đủ tuổi nghỉ hưu (${ra} tuổi)`:`Đủ tuổi nghỉ hưu sau khoảng ${Math.max(1,Math.round(toR*12))} tháng: chuẩn bị hồ sơ hưu và kế hoạch kế nhiệm`,iso(addDays(parse(e.dob),Math.round(ra*365.25))),'Điều 169 BLLĐ 2019')}
    if(e.status==='Nghỉ thai sản'&&e.matEnd&&days(T,parse(e.matEnd))<=30)add('mat','info',e,`Trở lại làm việc sau thai sản ngày ${vn(e.matEnd)}: sắp xếp vị trí cũ`,e.matEnd,'Điều 157, 158 BLLĐ 2019');
    if(parse(e.dob).getMonth()===T.getMonth())add('bday','info',e,`Sinh nhật ngày ${parse(e.dob).getDate()}/${T.getMonth()+1}: quà ${fmt(P('bday'))}đ theo chính sách phúc lợi`,iso(new Date(T.getFullYear(),T.getMonth(),parse(e.dob).getDate())),'Chính sách phúc lợi');
    if(T.getMonth()>=9&&e.status==='Đang làm việc'&&e.leave.rem>=6)add('leave','info',e,`Còn ${e.leave.rem} ngày phép năm ${T.getFullYear()}: lên lịch nghỉ hoặc thanh toán phép chưa nghỉ`,iso(new Date(T.getFullYear(),11,31)),'Điều 113 BLLĐ 2019');
  }
  for(const e of M.exitsY){const l=days(parse(e.exit),T);if(l>=0&&l<=20)add('settle','warn',e,`Nghỉ việc ${vn(e.exit)}: thanh toán quyền lợi trong 14 ngày làm việc, chốt sổ BHXH, trả bản chính giấy tờ`,iso(addDays(parse(e.exit),20)),'Điều 48 BLLĐ 2019')}
  const yEnd=iso(new Date(T.getFullYear(),11,31));
  for(const c of (M.train||[]))if(c.safety)for(const e of c.pending)if(e.tenureY*365>30)add('train',c.id==='C02'?'crit':'warn',e,`Chưa hoàn thành ${c.name}`,yEnd,c.law);
  if(M.life){for(const x of M.life.onb)if(x.over.length)add('onb','warn',x.e,`${x.over.length} bước onboarding quá hạn: ${x.over.map(i=>i.l).join('; ')}`,x.over[0].due,'Quy trình thử việc, thủ tục nhận việc');
    for(const x of M.life.offb)if(x.over.length)add('offb',x.over.some(i=>['pay','bhxh','docs','severance'].includes(i.k))?'crit':'warn',x.e,`${x.over.length} bước offboarding quá hạn: ${x.over.map(i=>i.l).join('; ')}`,x.over[0].due,'Điều 48 BLLĐ 2019')}
  if(M.relations){const em=Object.fromEntries(M.emps.map(e=>[e.id,e]));for(const r of M.relations)if(r.kind==='discipline'&&!['Đã ra quyết định','Hết hiệu lực'].includes(r.status)){const left=183-days(parse(r.date),T);if(left<=45)add('disc',left<=15?'crit':'warn',em[r.emp],left<0?`Hồ sơ kỷ luật ${r.id} đã hết thời hiệu xử lý`:`Hồ sơ kỷ luật ${r.id} còn ${left} ngày thời hiệu`,iso(addDays(parse(r.date),183)),'Điều 123 BLLĐ 2019')}}
  const ord={crit:0,warn:1,info:2};return out.sort((a,b)=>ord[a.sev]-ord[b.sev]||String(a.due).localeCompare(String(b.due)));
}

/* ============ charts ============ */
const COLORS=['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];
function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p;return(n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p}
function hbars(items,{f=fmt,color='var(--c1)',max}={}){
  const mx=max||Math.max(1,...items.map(i=>i.v));
  return `<div class="bars">${items.map(i=>`<div class="bar"><span class="lb" title="${esc(i.l)}">${esc(i.l)}</span><span class="tr"><span class="fl" style="width:${Math.max(0,i.v/mx*100).toFixed(1)}%;background:${i.c||color}"></span></span><span class="vl">${f(i.v)}</span></div>`).join('')}</div>`;
}
function colChart(labels,series,{h=230,f=v=>fmt(v),line}={}){
  const W=640,H=h,pl=44,pr=10,pt=12,pb=26,max=niceMax(Math.max(1,...series.flatMap(s=>s.values.filter(v=>v!=null)),...(line?line.values.filter(v=>v!=null):[])));
  let g='';for(let i=0;i<=4;i++){const y=pt+(H-pt-pb)*(1-i/4);g+=`<line class="grid" x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}"/><text class="tick" x="${pl-6}" y="${y+4}" text-anchor="end">${f(max*i/4)}</text>`}
  const bw=(W-pl-pr)/labels.length,inner=bw*.66/series.length;
  labels.forEach((l,i)=>{series.forEach((s,j)=>{const v=s.values[i]||0,bh=(H-pt-pb)*v/max,x=pl+i*bw+bw*.17+j*inner;if(v>0)g+=`<rect x="${x.toFixed(1)}" y="${(H-pb-bh).toFixed(1)}" width="${Math.max(1,inner-2).toFixed(1)}" height="${bh.toFixed(1)}" rx="2" style="fill:${s.c}"><title>${esc(s.n)} ${esc(l)}: ${f(v)}</title></rect>`});
    g+=`<text class="tick" x="${(pl+i*bw+bw/2).toFixed(1)}" y="${H-8}" text-anchor="middle">${esc(l)}</text>`});
  if(line){const pts=line.values.map((v,i)=>v==null?null:[pl+i*bw+bw/2,H-pb-(H-pt-pb)*v/max]).filter(Boolean);
    g+=`<polyline fill="none" style="stroke:${line.c}" stroke-width="2" points="${pts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')}"/>`+pts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i===pts.length-1?4:2.5}" style="fill:${line.c}"/>`).join('')}
  const leg=[...series.map(s=>[s.n,s.c]),...(line?[[line.n,line.c]]:[])];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(leg.map(x=>x[0]).join(', '))}">${g}</svg><div class="legend">${leg.map(([n,c])=>`<span><i style="background:${c}"></i>${esc(n)}</span>`).join('')}</div>`;
}
function donut(items,center){
  const tot=sum(items,i=>i.v)||1,r=56,C=2*Math.PI*r;let off=0;
  const segs=items.map((it,i)=>{const len=C*it.v/tot,s=`<circle r="${r}" cx="75" cy="75" fill="none" style="stroke:${it.c||COLORS[i%6]}" stroke-width="20" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 75 75)"><title>${esc(it.l)}: ${it.v}</title></circle>`;off+=len;return s}).join('');
  return `<div class="donut"><svg viewBox="0 0 150 150" role="img">${segs}<text x="75" y="72" text-anchor="middle" class="lbl" style="font-size:20px;font-family:var(--f-mono)">${esc(center??tot)}</text><text x="75" y="90" text-anchor="middle" class="tick">tổng</text></svg><div class="legend">${items.map((it,i)=>`<span><i style="background:${it.c||COLORS[i%6]}"></i>${esc(it.l)} · <b class="num">${it.v}</b> (${pct(it.v/tot,0)})</span>`).join('')}</div></div>`;
}
const countBy=(a,f)=>Object.entries(groupBy(a,f)).map(([l,x])=>({l,v:x.length}));

/* ============ UI parts ============ */
function panel(title,body,{sub='',act='',cls=''}={}){
  return `<section class="panel ${cls}"><header><h3>${title}</h3>${sub?`<span class="sub">${sub}</span>`:''}<div class="act">${act}${S.comments?`<button class="btn sm ghost" data-act="comment" title="Bình luận vào khối này">Bình luận</button>`:''}</div></header>${body}</section>`;
}
const kpi=(l,v,s='',cls='')=>`<div class="kpi ${cls}"><span class="l">${l}</span><span class="v">${v}</span>${s?`<span class="s">${s}</span>`:''}</div>`;
const pill=(t,c='mute')=>`<span class="pill ${c}">${esc(t)}</span>`;
const sevName={crit:'Khẩn',warn:'Cần xử lý',info:'Theo dõi'};
const lock=()=>S.canWrite?'':' disabled title="Bạn chỉ có quyền xem/bình luận"';
const lockAdmin=()=>S.canAdmin?'':' disabled title="Chỉ Người chỉnh sửa (Editor) hoặc chủ sở hữu"';
function statusPill(e){return e.status==='Nghỉ việc'?pill('Đã nghỉ','mute'):e.status==='Nghỉ thai sản'?pill('Thai sản','info'):e.contract===C_PROB?pill('Thử việc','warn'):pill('Đang làm','ok')}
function tbl(head,rows,foot){return `<div class="tw"><table class="tbl"><thead><tr>${head.map(h=>typeof h==='string'?`<th>${h}</th>`:`<th class="n">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${head.length}" class="muted">Không có dữ liệu</td></tr>`}</tbody>${foot?`<tfoot>${foot}</tfoot>`:''}</table></div>`}

/* ============ views ============ */
const VIEWS=[
 ['overview','Tổng quan'],['people','Hồ sơ nhân sự'],['lifecycle','Onboarding & Offboarding'],['payroll','Lương 3P & C&B'],['time','Chấm công & nghỉ phép'],['recruit','Tuyển dụng'],['training','Đào tạo & phát triển'],
 ['kpi','KPI & năng lực'],['relations','Khen thưởng & kỷ luật'],['cost','Chi phí nhân sự'],['compliance','Tuân thủ & báo cáo'],['policy','Chính sách & pháp luật'],['automation','Trung tâm tự động'],['docs','Biểu mẫu & văn bản'],['library','Thư viện quy trình'],['access','Chia sẻ & phân quyền']];
const V={};

V.overview=()=>{
  const m=M,T=m.T,crit=m.checks.filter(c=>c.sev==='crit').length,warn=m.checks.filter(c=>c.sev==='warn').length;
  const prob=m.working.filter(e=>e.contract===C_PROB).length,official=m.working.length-prob;
  const ages=[['< 25',0,25],['25–34',25,35],['35–44',35,45],['45–54',45,55],['≥ 55',55,99]].map(([l,a,b])=>({l,v:m.active.filter(e=>e.age>=a&&e.age<b).length}));
  const ten=[['< 1 năm',0,1],['1–3 năm',1,3],['3–5 năm',3,5],['5–10 năm',5,10],['≥ 10 năm',10,99]].map(([l,a,b])=>({l,v:m.active.filter(e=>e.tenureY>=a&&e.tenureY<b).length}));
  const byDept=DEPTS.map(d=>({l:d.name,v:m.active.filter(e=>e.dept===d.id).length})).sort((a,b)=>b.v-a.v);
  const reasons=countBy(m.exitsY,e=>e.exitReason||'Khác').sort((a,b)=>b.v-a.v);
  const openPos=sum(m.openReqs,r=>r.qty-r.hired);
  const costRatio=m.tot.cost/P('revenue');
  const life=[['recruit','Tuyển dụng',openPos,'vị trí còn trống'],['people','Thử việc',prob,'đang thử việc'],['people','Chính thức',official,'đang làm việc'],['payroll','Lương 3P',fmtB(m.tot.gross),'quỹ lương tháng'],['kpi','Đánh giá KPI',pct(m.working.filter(e=>['A','B'].includes(e.rating)).length/Math.max(1,m.working.length),0),'xếp loại A–B'],['compliance','Tuân thủ',crit+warn,'việc cần xử lý'],['people','Nghỉ việc',m.exitsY.length,'người từ đầu năm']];
  return `
  <div class="kpis">
   ${kpi('Nhân sự hiện có',fmt(m.active.length),`${m.working.length} đang làm · ${m.active.length-m.working.length} thai sản`)}
   ${kpi('Tuyển mới '+m.Y,fmt(m.hiresY.length),`${m.hiresY.filter(e=>e.status!=='Nghỉ việc').length} còn làm việc`)}
   ${kpi('Nghỉ việc '+m.Y,fmt(m.exitsY.length),`Tỷ lệ ${pct(m.turnover)} · quy năm ${pct(m.turnAnn)}`)}
   ${kpi('Quỹ lương tháng '+(T.getMonth()+1),fmtB(m.tot.gross),`Thực lĩnh ${fmtB(m.tot.net)}`)}
   ${kpi('Chi phí NS / doanh thu',pct(costRatio),`${fmtB(m.tot.cost)} / ${fmtB(P('revenue'))}`,costRatio>.22?'crit':'')}
   ${kpi('Cảnh báo tuân thủ',fmt(crit),`${warn} cần xử lý · ${m.checks.length-crit-warn} theo dõi`,crit?'crit':'')}
  </div>
  ${panel('Vòng đời nhân sự','<div class="life">'+life.map(([v,t,n,s])=>`<div class="st" data-act="go" data-v="${v}" role="button" tabindex="0"><em>${t}</em><b>${n}</b><span>${s}</span></div>`).join('')+'</div>',{sub:'Mỗi bước lấy số liệu trực tiếp từ mô-đun tương ứng. Bấm để mở.'})}
  <div class="grid g12" style="margin-top:16px">
   ${panel('Biến động nhân sự '+m.Y,colChart(MONTHS,[{n:'Tuyển mới',c:'var(--c1)',values:m.monthly.map(x=>x.h)},{n:'Nghỉ việc',c:'var(--c4)',values:m.monthly.map(x=>x.x)}]),{sub:'Theo ngày vào làm và ngày nghỉ việc trong hồ sơ'})}
   ${panel('Cảnh báo ưu tiên',`<div class="list">${m.checks.filter(c=>c.sev!=='info').slice(0,7).map(c=>`<div class="sev ${c.sev}"><div><b>${esc(c.e?c.e.name:'')}</b> <span class="muted small">${esc(c.e?c.e.id:'')}</span><div class="small">${esc(c.msg)}</div></div>${pill(sevName[c.sev],c.sev)}</div>`).join('')||'<p class="muted">Không có cảnh báo.</p>'}</div>`,{act:`<button class="btn sm" data-act="go" data-v="compliance">Xem tất cả</button>`})}
  </div>
  <div class="grid g3" style="margin-top:16px">
   ${panel('Nhân sự theo khối',hbars(byDept))}
   ${panel('Cơ cấu giới tính',donut(countBy(m.active,e=>e.gender)))}
   ${panel('Trình độ học vấn',donut(countBy(m.active,e=>e.edu).sort((a,b)=>b.v-a.v)))}
   ${panel('Độ tuổi',hbars(ages,{color:'var(--c2)'}))}
   ${panel('Thâm niên',hbars(ten,{color:'var(--c3)'}))}
   ${panel('Lý do nghỉ việc '+m.Y,hbars(reasons,{color:'var(--c4)'}))}
  </div>
  <div class="grid g2" style="margin-top:16px">
   ${panel('Địa điểm làm việc',hbars(Object.entries(SITES).map(([k,s])=>({l:s.name+' · Vùng '+['','I','II','III','IV'][s.region],v:m.active.filter(e=>e.site===k).length})),{color:'var(--c5)'}))}
   ${panel('Việc cần làm',taskList(6),{act:`<button class="btn sm" data-act="go" data-v="compliance">Mở danh sách</button>`,sub:'Tạo từ Trung tâm tự động, đồng bộ cho mọi người có quyền'})}
  </div>`;
};

function taskList(limit){
  const t=M.tasks.slice(0,limit||999);
  if(!t.length)return '<p class="muted">Chưa có việc. Chạy "Rà soát tuân thủ" trong Trung tâm tự động để tạo việc từ cảnh báo.</p>';
  return `<div class="list">${t.map(x=>`<div class="sev ${x.status==='done'?'':x.sev||'info'}"><div><b style="${x.status==='done'?'text-decoration:line-through;opacity:.6':''}">${esc(x.title)}</b><div class="small muted">Hạn ${vn(x.due)} · ${esc(x.law||'')}</div></div><button class="btn sm" data-act="task" data-id="${esc(x.id)}"${lock()}>${x.status==='done'?'Mở lại':'Xong'}</button></div>`).join('')}</div>`;
}

V.people=()=>{
  const f=S.f;let rows=M.emps.filter(e=>parse(e.hire)<=M.T||e._new);
  if(f.status==='active')rows=rows.filter(e=>e.status!=='Nghỉ việc');else if(f.status)rows=rows.filter(e=>e.status===f.status||(f.status==='prob'&&e.contract===C_PROB&&e.status!=='Nghỉ việc'));
  if(f.dept)rows=rows.filter(e=>e.dept===f.dept);if(f.site)rows=rows.filter(e=>e.site===f.site);if(f.contract)rows=rows.filter(e=>e.contract===f.contract);
  if(f.q){const q=slug(f.q);rows=rows.filter(e=>slug(e.name+' '+e.id+' '+e.title).includes(q))}
  const per=40,pages=Math.max(1,Math.ceil(rows.length/per));if(f.page>=pages)f.page=pages-1;
  const shown=rows.slice(f.page*per,f.page*per+per);
  const opt=(arr,cur)=>arr.map(([v,l])=>`<option value="${esc(v)}"${v===cur?' selected':''}>${esc(l)}</option>`).join('');
  return panel('Danh bạ nhân sự',`
   <div class="filters">
    <input id="fq" data-f="q" placeholder="Tìm theo tên, mã, chức danh" value="${esc(f.q)}" aria-label="Tìm nhân viên">
    <select id="fdept" data-f="dept" aria-label="Khối">${opt([['','Tất cả khối'],...DEPTS.map(d=>[d.id,d.name])],f.dept)}</select>
    <select id="fsite" data-f="site" aria-label="Địa điểm">${opt([['','Mọi địa điểm'],...Object.entries(SITES).map(([k,s])=>[k,s.name])],f.site)}</select>
    <select id="fstatus" data-f="status" aria-label="Trạng thái">${opt([['active','Đang làm (gồm thai sản)'],['prob','Đang thử việc'],['Nghỉ thai sản','Nghỉ thai sản'],['Nghỉ việc','Đã nghỉ việc'],['','Tất cả']],f.status)}</select>
    <select id="fcontract" data-f="contract" aria-label="Loại hợp đồng">${opt([['','Mọi loại HĐ'],[C_INDEF,C_INDEF],[C_DEF,C_DEF],[C_PROB,C_PROB]],f.contract)}</select>
   </div>
   ${tbl(['Mã','Họ tên','Khối','Chức danh','Bậc','Địa điểm','Hợp đồng',['Thâm niên'],['KPI'],'Trạng thái'],shown.map(e=>`<tr class="click" data-act="emp" data-id="${e.id}" tabindex="0"><td class="mono">${e.id}</td><td><b>${esc(e.name)}</b>${e.expat?` <span class="pill info">${esc(e.nat)}</span>`:''}</td><td>${esc(e.deptName)}</td><td>${esc(e.title)}</td><td class="mono">GS${z2(e.grade)}</td><td>${esc((SITES[e.site]||{}).name)}</td><td>${esc(e.contract)}${e.cEnd&&e.contract===C_DEF?`<div class="small muted">đến ${vn(e.cEnd)}</div>`:''}</td><td class="n">${e.tenureY.toFixed(1)} năm</td><td class="n">${e.kpi.toFixed(1)} · ${e.rating}</td><td>${statusPill(e)}</td></tr>`))}
   <div class="pager"><span class="muted">${rows.length} người · trang ${f.page+1}/${pages}</span><button class="btn sm" data-act="page" data-d="-1"${f.page<=0?' disabled':''}>Trước</button><button class="btn sm" data-act="page" data-d="1"${f.page>=pages-1?' disabled':''}>Sau</button></div>`,
   {sub:'Bấm vào một dòng để xem hồ sơ, phiếu lương, phép năm và chỉnh sửa',act:`<button class="btn sm" data-act="exportEmp">Xuất CSV</button><button class="btn sm pri" data-act="newEmp"${lock()}>Thêm nhân viên</button>`});
};

V.payroll=()=>{
  const m=M,t=m.tot,T=m.T,per=`${z2(T.getMonth()+1)}/${T.getFullYear()}`;
  const byD=DEPTS.map(d=>{const a=m.payroll.filter(e=>e.dept===d.id);return{d,n:a.length,g:sum(a,e=>e.pay.gross),net:sum(a,e=>e.pay.net),tax:sum(a,e=>e.pay.tax),ins:sum(a,e=>e.pay.insE+e.pay.insC),cost:sum(a,e=>e.pay.cost)}});
  const scaleRows=Object.keys(SCALE_DEF).map(Number).map(g=>{const mid=scaleMid(g),a=m.working.filter(e=>e.grade===g),ap=avg(a,e=>e.p1);return `<tr><td class="mono">GS${z2(g)}</td><td>${GROUP(g)}</td><td class="n">${fmt(mid*.8)}</td><td class="n"><b>${fmt(mid)}</b></td><td class="n">${fmt(mid*1.2)}</td><td class="n">${a.length}</td><td class="n">${a.length?fmt(ap):'—'}</td><td class="n">${a.length?`<span class="pill ${ap/mid<.9?'warn':ap/mid>1.1?'info':'ok'}">${(ap/mid).toFixed(2)}</span>`:'—'}</td></tr>`});
  const q=slug(S.f.pq||'');let rows=m.payroll.filter(e=>!q||slug(e.name+' '+e.id).includes(q));const per2=30,pages=Math.max(1,Math.ceil(rows.length/per2));if(S.f.pp>=pages)S.f.pp=pages-1;
  const hist=Object.entries(S.col.payrolls).map(([id,x])=>({id,...x})).sort((a,b)=>a.id.localeCompare(b.id));
  const bonusPool=sum(m.working.filter(e=>e.contract!==C_PROB),e=>e.p1*(1+BONUS_M[e.rating]));
  return `
  <div class="kpis">
   ${kpi('Kỳ lương',per,`${m.payroll.length} người hưởng lương`)}
   ${kpi('Tổng thu nhập (gross)',fmtB(t.gross),`P1 ${fmtB(t.p1)} · P2 ${fmtB(t.p2)} · P3 ${fmtB(t.p3)}`)}
   ${kpi('BH NLĐ đóng',fmtB(t.insE),`BHXH ${fmtB(t.eBHXH)} · BHYT ${fmtB(t.eBHYT)} · BHTN ${fmtB(t.eBHTN)}`)}
   ${kpi('Thuế TNCN khấu trừ',fmtB(t.tax),`Giảm trừ bản thân ${fmtM(P('gt_self'))}`)}
   ${kpi('Thực lĩnh',fmtB(t.net))}
   ${kpi('Chi phí công ty',fmtB(t.cost),`BH NSDLĐ ${fmtB(t.insC)} · KPCĐ ${fmtB(t.kpcd)}`)}
  </div>
  <div class="grid g2">
   ${panel('Quỹ lương theo khối',tbl(['Khối',['Số người'],['Gross'],['BH (NLĐ+Cty)'],['Thuế TNCN'],['Thực lĩnh'],['Chi phí Cty']],byD.map(x=>`<tr><td>${esc(x.d.name)}</td><td class="n">${x.n}</td><td class="n">${fmtM(x.g)}</td><td class="n">${fmtM(x.ins)}</td><td class="n">${fmtM(x.tax)}</td><td class="n">${fmtM(x.net)}</td><td class="n">${fmtM(x.cost)}</td></tr>`),`<tr><td>Tổng</td><td class="n">${m.payroll.length}</td><td class="n">${fmtM(t.gross)}</td><td class="n">${fmtM(t.insE+t.insC)}</td><td class="n">${fmtM(t.tax)}</td><td class="n">${fmtM(t.net)}</td><td class="n">${fmtM(t.cost)}</td></tr>`),{sub:'Tính lại ngay khi hồ sơ hoặc tham số chính sách thay đổi',act:`<button class="btn sm pri" data-act="runPayroll"${lock()}>Chốt bảng lương ${per}</button>`})}
   ${panel('Thang bảng lương P1 (pay for position)',tbl(['Bậc','Nhóm',['Tối thiểu'],['Điểm giữa'],['Tối đa'],['Số NV'],['P1 bình quân'],['Compa-ratio']],scaleRows),{sub:'Biên độ ±20% quanh điểm giữa, theo "Biểu mẫu xây dựng thang bảng lương". Compa-ratio < 0,9 cần xem xét điều chỉnh.'})}
  </div>
  <div class="grid g2" style="margin-top:16px">
   ${panel('Cơ cấu thu nhập 3P',donut([{l:'P1 – Vị trí',v:Math.round(t.p1/1e6)},{l:'P2 – Năng lực',v:Math.round(t.p2/1e6)},{l:'P3 – Hiệu suất',v:Math.round(t.p3/1e6)},{l:'Phụ cấp',v:Math.round((t.lunch+t.phone+t.travel+t.housing)/1e6)},{l:'Làm thêm giờ',v:Math.round(t.ot/1e6)}],fmtB(t.gross)),{sub:'Đơn vị: triệu đồng'})}
   ${panel('Lịch sử chốt lương',hist.length?colChart(hist.map(h=>h.id.slice(5)+'/'+h.id.slice(2,4)),[{n:'Gross (tỷ)',c:'var(--c1)',values:hist.map(h=>h.gross/1e9)},{n:'Chi phí Cty (tỷ)',c:'var(--c2)',values:hist.map(h=>h.cost/1e9)}],{f:v=>v.toFixed(1)})+`<p class="small muted">Lần chốt gần nhất: ${esc(hist[hist.length-1].id)} lúc ${new Date(hist[hist.length-1].at).toLocaleString('vi-VN')}</p>`:'<p class="muted">Chưa chốt kỳ nào. Bấm "Chốt bảng lương" để lưu bản chụp kỳ này; các kỳ sau sẽ hiện thành biểu đồ so sánh.</p>',{sub:`Quỹ thưởng cuối năm dự kiến (tháng 13 + thưởng hiệu suất P3): ${fmtB(bonusPool)}`})}
  </div>
  ${panel('Bảng thanh toán tiền lương '+per,`<div class="filters"><input id="fpq" data-f="pq" placeholder="Tìm nhân viên" value="${esc(S.f.pq)}" aria-label="Tìm trong bảng lương"></div>`+tbl(['Mã','Họ tên',['P1'],['P2'],['P3'],['Phụ cấp'],['Làm thêm'],['Gross'],['BH NLĐ'],['Thuế TNCN'],['Thực lĩnh']],rows.slice(S.f.pp*per2,S.f.pp*per2+per2).map(e=>{const p=e.pay;return `<tr class="click" data-act="emp" data-id="${e.id}"><td class="mono">${e.id}</td><td>${esc(e.name)}${p.prob?' '+pill('TV','warn'):''}</td><td class="n">${fmt(p.p1)}</td><td class="n">${fmt(p.p2)}</td><td class="n">${fmt(p.p3)}</td><td class="n">${fmt(p.lunch+p.phone+p.travel+p.housing)}</td><td class="n">${fmt(p.ot)}</td><td class="n"><b>${fmt(p.gross)}</b></td><td class="n">${fmt(p.insE)}</td><td class="n">${fmt(p.tax)}</td><td class="n"><b>${fmt(p.net)}</b></td></tr>`}))+`<div class="pager"><span class="muted">${rows.length} dòng · trang ${S.f.pp+1}/${pages}</span><button class="btn sm" data-act="ppage" data-d="-1"${S.f.pp<=0?' disabled':''}>Trước</button><button class="btn sm" data-act="ppage" data-d="1"${S.f.pp>=pages-1?' disabled':''}>Sau</button></div>`,{sub:'Theo mẫu "Bảng lương theo lương 3P". Thử việc hưởng '+P('probPay')+'% P1, không P2/P3, không đóng BH bắt buộc.',act:`<button class="btn sm" data-act="exportPay">Xuất CSV</button>`,cls:'mt'})}`;
};

V.time=()=>{
  const m=M,w=m.working;
  const ot=DEPTS.map(d=>{const a=w.filter(e=>e.dept===d.id);return{l:d.name,v:Math.round(avg(a,e=>e.otM)*10)/10}}).sort((a,b)=>b.v-a.v);
  const over=w.filter(e=>e.otM>P('otMonth')||e.otY>(e.dept==='PRD'?P('otYearSp'):P('otYear')));
  const lv=DEPTS.map(d=>{const a=w.filter(e=>e.dept===d.id);return `<tr><td>${esc(d.name)}</td><td class="n">${a.length}</td><td class="n">${sum(a,e=>e.leave.ent)}</td><td class="n">${sum(a,e=>e.leave.used)}</td><td class="n">${sum(a,e=>e.leave.rem)}</td><td><div class="prog"><i style="width:${(sum(a,e=>e.leave.used)/Math.max(1,sum(a,e=>e.leave.ent))*100).toFixed(0)}%"></i></div></td></tr>`});
  const T=m.T;const hol=HOLIDAYS.map(([d,n,k])=>{const l=days(T,parse(d));return `<tr><td>${vn(d)}</td><td>${esc(n)}</td><td class="n">${k}</td><td>${l<0?pill('Đã qua','mute'):pill('Còn '+l+' ngày',l<=45?'warn':'info')}</td></tr>`});
  return `
  <div class="kpis">
   ${kpi('Giờ làm thêm tháng này',fmt(sum(w,e=>e.otM)),`Bình quân ${(avg(w,e=>e.otM)).toFixed(1)} giờ/người`)}
   ${kpi('Chi phí làm thêm',fmtB(m.tot.ot),'Ngày thường '+P('otWeekday')+'%')}
   ${kpi('Vượt giới hạn làm thêm',fmt(over.length),`Tháng ${P('otMonth')}h · năm ${P('otYear')}h (SX ${P('otYearSp')}h)`,over.length?'crit':'')}
   ${kpi('Phép năm còn lại',fmt(sum(w,e=>e.leave.rem))+' ngày',`Đã dùng ${pct(sum(w,e=>e.leave.used)/Math.max(1,sum(w,e=>e.leave.ent)),0)}`)}
  </div>
  <div class="grid g2">
   ${panel('Làm thêm bình quân theo khối (giờ/tháng)',hbars(ot,{f:v=>v.toFixed(1),color:'var(--c3)'}))}
   ${panel('Nhân viên vượt giới hạn làm thêm',tbl(['Mã','Họ tên','Khối',['Tháng'],['Lũy kế năm']],over.slice(0,40).map(e=>`<tr class="click" data-act="emp" data-id="${e.id}"><td class="mono">${e.id}</td><td>${esc(e.name)}</td><td>${esc(e.deptName)}</td><td class="n">${e.otM>P('otMonth')?`<b style="color:var(--crit)">${e.otM}</b>`:e.otM}</td><td class="n">${e.otY}</td></tr>`)),{sub:'Điều 107 BLLĐ 2019. Cần sắp xếp ca, tuyển bổ sung hoặc dừng tăng ca.'})}
  </div>
  <div class="grid g2" style="margin-top:16px">
   ${panel('Phép năm theo khối',tbl(['Khối',['NV'],['Được hưởng'],['Đã nghỉ'],['Còn lại'],'Tỷ lệ dùng'],lv),{sub:`${P('leaveBase')} ngày + 1 ngày mỗi ${P('leaveStep')} năm thâm niên, tính tỷ lệ theo tháng làm việc trong năm`})}
   ${panel('Ngày nghỉ lễ, Tết hưởng nguyên lương',tbl(['Ngày','Dịp',['Số ngày'],'Trạng thái'],hol),{sub:'Điều 112 BLLĐ 2019: 11 ngày/năm. Lịch cụ thể theo thông báo hằng năm của Bộ Nội vụ.'})}
  </div>
  ${panel('Chính sách ngày nghỉ (trích từ mẫu chính sách công ty)',`<div class="small" style="max-width:75ch"><p>Nhân viên chính thức được hưởng lương ngày nghỉ theo mức 8 giờ/ngày khi đã chấm công trọn ca trước và sau kỳ nghỉ, hoặc có chứng từ ốm đau hợp lệ. Không hưởng lương nghỉ nếu thời gian hưởng lương tại công ty dưới 90 ngày, là lao động thời vụ, hoặc từ chối điều động làm việc trong kỳ nghỉ.</p><p>Kỳ nghỉ trùng thứ Bảy được cộng thêm thứ Sáu liền trước; trùng Chủ nhật được cộng thêm thứ Hai liền sau. Ngày nghỉ không tính vào thời gian làm thêm, trừ khi được điều động do yêu cầu bắt buộc của công việc. Việc riêng có hưởng lương theo Điều 115 BLLĐ 2019: kết hôn 3 ngày, con kết hôn 1 ngày, bố/mẹ/vợ/chồng/con chết 3 ngày.</p></div>`,{cls:'mt'})}`;
};

V.recruit=()=>{
  const m=M,rs=m.reqs,open=m.openReqs;
  const fun=['applied','screened','interviewed','offered','hired'],fl=['Ứng tuyển','Sàng lọc','Phỏng vấn','Offer','Nhận việc'];
  const agg=fun.map(k=>sum(open,r=>r[k]));
  const byCh=Object.entries(groupBy(rs,r=>r.channel)).map(([l,a])=>({l,v:sum(a,r=>r.hired)?Math.round(sum(a,r=>r.spent)/sum(a,r=>r.hired)/1e5)/10:0})).sort((a,b)=>b.v-a.v);
  const bud=sum(rs,r=>r.budget),sp=sum(rs,r=>r.spent),hired=sum(rs,r=>r.hired);
  const T=m.T;
  return `
  <div class="kpis">
   ${kpi('Yêu cầu đang mở',fmt(open.length),`${sum(open,r=>r.qty-r.hired)} vị trí còn trống`)}
   ${kpi('Đã nhận việc '+m.Y,fmt(hired),`${m.closed.length} yêu cầu hoàn tất`)}
   ${kpi('Thời gian tuyển TB',Math.round(m.ttf)+' ngày','Mục tiêu ≤ 45 ngày',m.ttf>45?'crit':'')}
   ${kpi('Ngân sách tuyển dụng',fmtB(bud),`Đã dùng ${pct(sp/bud,0)} · ${fmtM(sp/Math.max(1,hired))}/người`)}
  </div>
  <div class="grid g2">
   ${panel('Phễu tuyển dụng (yêu cầu đang mở)',hbars(fl.map((l,i)=>({l,v:agg[i]})),{color:'var(--c2)'})+`<p class="small muted">Tỷ lệ chuyển đổi ứng tuyển → nhận việc: ${pct(agg[4]/Math.max(1,agg[0]))}</p>`)}
   ${panel('Chi phí mỗi lần tuyển theo kênh (triệu đồng)',hbars(byCh,{f:v=>v.toLocaleString('vi-VN'),color:'var(--c3)'}),{sub:'Theo Masterfile tuyển dụng 2026: ưu tiên giới thiệu nội bộ, chỉ dùng headhunt cho vị trí hiếm'})}
  </div>
  ${panel('Yêu cầu tuyển dụng',tbl(['Mã','Vị trí','Khối',['SL'],'Tiến độ','Ưu tiên','Kênh','Hạn','Trạng thái',''],rs.map(r=>{const l=days(T,parse(r.target));const done=r.status==='Hoàn tất';return `<tr><td class="mono">${r.id}</td><td><b>${esc(r.title)}</b><div class="small muted">GS${z2(r.grade)} · ngân sách ${fmtM(r.budget)}</div></td><td>${esc((DEPT[r.dept]||{}).name)}</td><td class="n">${r.hired}/${r.qty}</td><td><div class="prog" title="${r.hired}/${r.qty}"><i style="width:${(r.hired/r.qty*100).toFixed(0)}%"></i></div><div class="small muted">${r.applied} CV · ${r.interviewed} PV · ${r.offered} offer</div></td><td>${pill(r.prio,r.prio==='Cao'?'crit':r.prio==='Thấp'?'mute':'warn')}</td><td class="small">${esc(r.channel)}</td><td>${done?vn(r.closed):`${vn(r.target)}<div class="small ${l<0?'':'muted'}" style="${l<0?'color:var(--crit)':''}">${l<0?'trễ '+(-l)+' ngày':'còn '+l+' ngày'}</div>`}</td><td>${pill(r.status,done?'ok':r.status==='Tạm dừng'?'mute':'info')}</td><td style="white-space:nowrap">${done?'':`<button class="btn sm" data-act="reqCv" data-id="${r.id}"${lock()}>+ CV</button> <button class="btn sm pri" data-act="reqHire" data-id="${r.id}"${lock()}>Nhận việc</button> <button class="btn sm ghost" data-act="reqPause" data-id="${r.id}"${lock()}>${r.status==='Tạm dừng'?'Mở lại':'Dừng'}</button>`}</td></tr>`})),{sub:'"Nhận việc" tạo hồ sơ nhân viên thử việc, cộng vào nhân sự, bảng lương và lịch đánh giá thử việc',act:`<button class="btn sm pri" data-act="newReq"${lock()}>Tạo yêu cầu tuyển dụng</button>`,cls:'mt'})}
  ${panel('Quy trình tuyển dụng chuẩn (Masterfile 2026)',`<div class="tw"><table class="tbl"><thead><tr><th>Giai đoạn</th><th>Thời gian</th><th>Tiêu chí hoàn thành</th><th>Biểu mẫu</th></tr></thead><tbody>${[['Xác định nhu cầu','Tuần 1','Nhu cầu được phê duyệt, gắn kế hoạch nhân sự','Phiếu đề xuất tuyển dụng; NS-02-BM01'],['Thiết kế vị trí','Tuần 1','JD và tiêu chí tuyển chọn được quản lý duyệt','NS-02-BM02 Mô tả công việc; BM03 Tiêu chuẩn chức danh'],['Sourcing','Tuần 2–4','Đủ CV đạt tiêu chí tối thiểu','NS-02-BM08 Thông báo tuyển dụng; email mẫu'],['Sàng lọc','Tuần 3–4','Có shortlist đủ số lượng','BM-04 Bảng dữ liệu ứng viên; BM-05 Phiếu xét duyệt'],['Phỏng vấn','Tuần 4–5','Ứng viên đạt ngưỡng hội đồng thống nhất','BM-06 Đánh giá kết quả PV; NS-02-BM17 Câu hỏi PV'],['Offer','Tuần 5','Ứng viên đồng ý điều kiện chính','Thư mời nhận việc (5 mẫu); NS-02-BM22'],['Onboarding & thử việc','Tuần 6–8','Kế hoạch hội nhập đã triển khai','BM-07 Thủ tục nhận việc; BM-08 Chương trình thử việc; BM-09 Đánh giá sau thử việc']].map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,{cls:'mt'})}`;
};

V.kpi=()=>{
  const m=M,w=m.working.filter(e=>e.contract!==C_PROB);
  const dist=['A','B','C','D','E'].map((r,i)=>({l:'Loại '+r,v:w.filter(e=>e.rating===r).length,c:COLORS[i]}));
  const dep=DEPTS.map(d=>{const a=w.filter(e=>e.dept===d.id);return{d,n:a.length,k:avg(a,e=>e.kpi),p3:sum(a,e=>e.pay?e.pay.p3:0)}});
  const d=S.f.bsc,dk=DEPT[d],deptAvg=(dep.find(x=>x.d.id===d)||{k:3.5}).k;
  const hrReal={'Chi phí NS / doanh thu':m.tot.cost/P('revenue')*100,'Tỷ lệ nghỉ việc năm':m.turnAnn*100,'Thời gian tuyển trung bình':m.ttf};
  const rnd=mulberry32(d.split('').reduce((s,c)=>s+c.charCodeAt(0),0)*97+m.Y);
  const rows=(BSC[d]||[]).map(([pp,name,tg,target,unit])=>{
    const lower=LOWER_BETTER.test(tg);let act=hrReal[name];
    if(act==null){const perf=(deptAvg-3.5)*.06+(rnd()-.45)*.12;act=target===0?(rnd()<.8?0:1):lower?target*(1-perf):target*(1+perf)}
    const ach=target===0?(act===0?1:0):lower?target/Math.max(act,.0001):act/target;
    return `<tr><td>${esc(pp)}</td><td>${esc(name)}</td><td class="n">${esc(tg)}</td><td class="n">${(Math.round(act*10)/10).toLocaleString('vi-VN')}${unit==='%'?'%':unit?' '+unit:''}</td><td>${pill(ach>=1?'Đạt':ach>=.9?'Gần đạt':'Chưa đạt',ach>=1?'ok':ach>=.9?'warn':'crit')}</td></tr>`});
  const comp=[0,1,2,3].map(l=>({l:'Cấp '+l+(l===0?' (chưa đạt chuẩn)':l===3?' (chuyên gia)':''),v:w.filter(e=>e.comp===l).length}));
  return `
  <div class="kpis">
   ${kpi('Điểm KPI bình quân',avg(w,e=>e.kpi).toFixed(2)+' / 5',`${w.length} nhân viên chính thức`)}
   ${kpi('Xếp loại A–B',pct((dist[0].v+dist[1].v)/Math.max(1,w.length),0),`${dist[0].v} A · ${dist[1].v} B`)}
   ${kpi('Xếp loại D–E',pct((dist[3].v+dist[4].v)/Math.max(1,w.length),0),'Cần kế hoạch cải thiện (PIP)',(dist[3].v+dist[4].v)/Math.max(1,w.length)>.15?'crit':'')}
   ${kpi('Quỹ P3 tháng',fmtB(m.tot.p3),`Mục tiêu ${P('p3Target')}% P1 × hệ số xếp loại`)}
  </div>
  <div class="grid g2">
   ${panel('Phân bổ xếp loại hiệu suất',donut(dist),{sub:'A ≥ 4,5 · B ≥ 3,9 · C ≥ 3,0 · D ≥ 2,3 · E < 2,3. Hệ số P3: A 1,5 · B 1,2 · C 1,0 · D 0,5 · E 0'})}
   ${panel('Khung năng lực (P2)',hbars(comp,{color:'var(--c2)'})+`<p class="small muted">Theo "Từ điển năng lực" và "Khung năng lực": năng lực cốt lõi (giao tiếp, làm việc nhóm, giải quyết vấn đề, định hướng khách hàng) và năng lực quản lý. Mỗi cấp cộng ${P('p2Rate')}% P1.</p>`)}
  </div>
  ${panel('Điểm KPI theo khối',tbl(['Khối',['NV'],['KPI TB'],'Mức',['Quỹ P3 tháng']],dep.map(x=>`<tr><td>${esc(x.d.name)}</td><td class="n">${x.n}</td><td class="n">${x.k.toFixed(2)}</td><td><div class="prog"><i style="width:${(x.k/5*100).toFixed(0)}%"></i></div></td><td class="n">${fmtM(x.p3)}</td></tr>`)),{cls:'mt'})}
  ${panel('Thẻ điểm cân bằng (BSC) – '+esc(dk.name),`<div class="filters"><select id="fbsc" data-f="bsc" aria-label="Chọn khối">${DEPTS.map(x=>`<option value="${x.id}"${x.id===d?' selected':''}>${esc(x.name)}</option>`).join('')}</select></div>`+tbl(['Viễn cảnh','Chỉ tiêu',['Mục tiêu'],['Thực hiện'],'Kết quả'],rows),{sub:d==='HR'?'Bộ KPI phòng Nhân sự: 3 chỉ tiêu đầu lấy trực tiếp từ dữ liệu thực của trang':'Theo bộ KPI BSC trong "Ebook 121 Template KPI". Số thực hiện mô phỏng, điều chỉnh theo điểm KPI bình quân của khối.',cls:'mt'})}`;
};

function costLines(m){
  const t=m.tot,n=m.active.length;
  const welfare=n*P('healthIns')+n*P('bday')/12+n*120000,training=P('training')/12,recruit=sum(m.openReqs,r=>r.spent)/Math.max(1,m.T.getMonth()+1);
  const ppe=m.active.filter(e=>['PRD','ENG','QA','SCM'].includes(e.dept)).length*180000,medical=n*65000,office=n*210000;
  const lines=[
   ['1','Chi phí cho người lao động',t.gross+t.insC+t.kpcd+welfare,1],['1.1','Lương, thưởng, phụ cấp (gross)',t.gross,2],['1.1.1','Lương vị trí P1',t.p1,3],['1.1.2','Phụ cấp năng lực P2',t.p2,3],['1.1.3','Lương hiệu suất P3',t.p3,3],['1.1.4','Phụ cấp (ăn ca, đi lại, điện thoại, nhà ở)',t.lunch+t.travel+t.phone+t.housing,3],['1.1.5','Tiền làm thêm giờ',t.ot,3],
   ['1.2','Bảo hiểm bắt buộc NSDLĐ đóng',t.insC,2],['1.2.1','Bảo hiểm xã hội',t.cBHXH,3],['1.2.2','Bảo hiểm y tế',t.cBHYT,3],['1.2.3','Bảo hiểm thất nghiệp',t.cBHTN,3],['1.3','Kinh phí công đoàn',t.kpcd,2],['1.4','Phúc lợi (BH sức khỏe, sinh nhật, hiếu hỉ)',welfare,2],
   ['2','Đào tạo, phát triển',training,1],['3','Tuyển dụng (bình quân tháng)',recruit,1],['4','Bảo hộ lao động',ppe,1],['5','Y tế, khám sức khỏe định kỳ',medical,1],['6','CCDC, văn phòng phẩm, viễn thông cho NLĐ',office,1]];
  return{lines,total:sum(lines.filter(l=>l[3]===1),l=>l[2])};
}
V.cost=()=>{
  const m=M,n=m.active.length,{lines,total}=costLines(m);
  const byD=DEPTS.map(d=>{const a=m.payroll.filter(e=>e.dept===d.id);return{l:d.name,v:sum(a,e=>e.pay.cost)/1e6}}).sort((a,b)=>b.v-a.v);
  return `
  <div class="kpis">
   ${kpi('Tổng chi phí nhân sự tháng',fmtB(total))}
   ${kpi('Tỷ lệ / doanh thu',pct(total/P('revenue')),`Doanh thu KH ${fmtB(P('revenue'))}/tháng`,total/P('revenue')>.22?'crit':'')}
   ${kpi('Chi phí bình quân / người',fmtM(total/Math.max(1,n)))}
   ${kpi('Doanh thu / nhân sự',fmtM(P('revenue')/Math.max(1,n)),'ISO 30414: năng suất vốn con người')}
  </div>
  <div class="grid g12">
   ${panel('Bảng tổng hợp chi phí nhân sự tháng '+(m.T.getMonth()+1),tbl(['Mã số','Chỉ tiêu',['Số tiền (đ)'],['Tỷ lệ']],lines.map(([c,l,v,lv])=>`<tr><td class="mono">${c}</td><td style="padding-left:${10+(lv-1)*16}px;${lv===1?'font-weight:600':''}">${esc(l)}</td><td class="n">${fmt(v)}</td><td class="n">${pct(v/total)}</td></tr>`),`<tr><td></td><td>Tổng chi phí</td><td class="n">${fmt(total)}</td><td class="n">100%</td></tr>`),{sub:'Cấu trúc theo "Bảng tổng hợp chi phí nhân sự". Mục 1 tính từ bảng lương; mục 2–6 theo định mức trong Chính sách.',act:`<button class="btn sm" data-act="exportCost">Xuất CSV</button>`})}
   ${panel('Chi phí công ty theo khối (triệu đồng)',hbars(byD,{f:v=>fmt(v),color:'var(--c2)'}))}
  </div>`;
};

V.compliance=()=>{
  const m=M,types={minwage:'Lương tối thiểu vùng',otm:'Làm thêm vượt giờ/tháng',oty:'Làm thêm vượt giờ/năm',oty90:'Làm thêm sắp chạm giới hạn',cexp:'HĐ hết hạn chưa xử lý',cend:'HĐ sắp hết hạn',prob:'Kết thúc thử việc',wp:'Giấy phép lao động',retire:'Nghỉ hưu',mat:'Trở lại sau thai sản',settle:'Thanh toán khi nghỉ việc',leave:'Phép năm tồn',bday:'Sinh nhật (phúc lợi)',train:'Huấn luyện ATVSLĐ',onb:'Onboarding quá hạn',offb:'Offboarding quá hạn',disc:'Thời hiệu kỷ luật'};
  const g=groupBy(m.checks,c=>c.type);
  const sel=S.f.ctype||'';const list=sel?(g[sel]||[]):m.checks.filter(c=>c.sev!=='info');
  return `
  ${panel('Lịch báo cáo nhân sự bắt buộc',tbl(['Báo cáo','Tần suất','Hạn kế tiếp',['Còn'],'Căn cứ pháp lý','Nơi nhận','Trạng thái',''],m.reports.map(r=>`<tr><td><b>${esc(r.name)}</b><div class="small muted">Mẫu: ${esc(r.file)}</div>${r.note?`<div class="small" style="color:var(--warn)">${esc(r.note)}</div>`:''}</td><td class="small">${esc(r.freq)}</td><td>${vn(r.next)}</td><td class="n">${r.na?'—':r.left+' ngày'}</td><td class="small">${esc(r.basis)}</td><td class="small">${esc(r.to)}</td><td>${r.na?pill('Không áp dụng','mute'):r.filed?pill('Đã nộp','ok'):pill(r.left<=7?'Sắp đến hạn':r.left<=30?'Trong 30 ngày':'Chưa đến kỳ',r.left<=7?'crit':r.left<=30?'warn':'info')}${!r.na&&!r.prevFiled&&r.prev&&days(r.prev,m.T)<=40?`<div class="small" style="color:var(--crit)">Kỳ ${vn(r.prev)} chưa ghi nhận</div>`:''}</td><td>${r.na?'':`<button class="btn sm" data-act="file" data-key="${r.key}"${lock()}>${r.filed?'Bỏ đánh dấu':'Đã nộp'}</button>`}</td></tr>`)),{sub:'Từ "Timeline nộp các báo cáo nhân sự bắt buộc trong năm". Hạn được tính lại theo ngày hôm nay.'})}
  <div class="grid g12" style="margin-top:16px">
   ${panel('Rà soát tự động',`<div class="filters"><select id="fctype" data-f="ctype" aria-label="Loại kiểm tra"><option value="">Khẩn và cần xử lý (${m.checks.filter(c=>c.sev!=='info').length})</option>${Object.entries(types).map(([k,l])=>`<option value="${k}"${k===sel?' selected':''}>${esc(l)} (${(g[k]||[]).length})</option>`).join('')}</select></div>`+tbl(['Mức','Nhân viên','Nội dung','Hạn','Căn cứ'],list.slice(0,80).map(c=>`<tr class="click" data-act="emp" data-id="${c.e?c.e.id:''}"><td>${pill(sevName[c.sev],c.sev)}</td><td><b>${esc(c.e?c.e.name:'')}</b><div class="small muted">${esc(c.e?c.e.id+' · '+c.e.deptName:'')}</div></td><td class="small">${esc(c.msg)}</td><td>${vn(c.due)}</td><td class="small">${esc(c.law)}</td></tr>`))+(list.length>80?`<p class="small muted">Hiển thị 80/${list.length} dòng.</p>`:''),{sub:'Chạy lại mỗi lần trang tính toán, dựa trên ngày hôm nay và tham số pháp lý hiện hành',act:`<button class="btn sm pri" data-act="runCompliance"${lock()}>Tạo việc từ cảnh báo</button><button class="btn sm" data-act="exportChecks">Xuất CSV</button>`})}
   ${panel('Tổng hợp theo loại',hbars(Object.entries(types).map(([k,l])=>({l,v:(g[k]||[]).length,c:(g[k]||[])[0]?{crit:'var(--crit)',warn:'var(--warn)',info:'var(--info)'}[g[k][0].sev]:'var(--c6)'}))))}
  </div>
  ${panel('Việc cần làm',taskList(),{sub:`${M.tasks.filter(t=>t.status!=='done').length} việc mở`,cls:'mt'})}`;
};

V.policy=()=>{
  const groups=groupBy(PARAMS,p=>p.g),pv=S.col.settings.policy;
  const ai=S.ai.policy,aiMap=ai&&Array.isArray(ai.items)?Object.fromEntries(ai.items.map(x=>[x.k,x])):{};
  const scale=Object.keys(SCALE_DEF).map(g=>`<label>GS${z2(g)} – điểm giữa<input id="sc${g}" type="number" step="10000" value="${scaleMid(Number(g))}"${lockAdmin()}></label>`).join('');
  return `
  <div class="banner">Thay đổi một tham số sẽ tính lại ngay bảng lương, thuế, bảo hiểm, giới hạn làm thêm, phép năm và cảnh báo tuân thủ cho mọi người đang mở trang. ${pv?`Cập nhật lần cuối ${new Date(pv.updatedAt).toLocaleString('vi-VN')}.`:'Đang dùng giá trị mặc định.'} ${S.canAdmin?'':'<b>Chỉ Người chỉnh sửa (Editor) hoặc chủ sở hữu được sửa tham số.</b>'}</div>
  ${Object.entries(groups).map(([g,ps])=>panel(esc(g),tbl(['Tham số',['Giá trị'],'Đơn vị','Căn cứ','Hiệu lực',...(ai?['Rà soát AI']:[])],ps.map(p=>{const a=aiMap[p.k];return `<tr><td>${esc(p.label)}</td><td class="n"><input id="pp_${p.k}" data-pk="${p.k}" type="number" step="any" value="${P(p.k)}" style="width:150px;text-align:right;border:1px solid var(--line);border-radius:6px;padding:4px 6px;background:var(--surface);font-family:var(--f-mono)"${lockAdmin()}>${P(p.k)!==p.v?`<div class="small" style="color:var(--warn)">mặc định ${fmt(p.v)}</div>`:''}</td><td>${esc(p.unit)}</td><td class="small">${esc(p.basis)}</td><td class="small">${esc(p.eff)}</td>${ai?`<td class="small">${a?`${pill(a.status==='khop'?'Khớp':a.status==='da_thay_doi'?'Đã thay đổi':'Cần kiểm tra',a.status==='khop'?'ok':a.status==='da_thay_doi'?'crit':'warn')}<div>${esc(a.note||'')}</div>${a.suggested!=null&&Number(a.suggested)!==P(p.k)?`<div>Đề xuất: <b class="num">${fmt(a.suggested)}</b> · ${esc(a.basis||'')}</div><button class="btn sm" data-act="applySug" data-k="${p.k}" data-v="${esc(a.suggested)}"${lockAdmin()}>Điền đề xuất</button>`:''}`:'—'}</td>`:''}</tr>`})),{sub:LEGAL_GROUPS.includes(g)?'Pháp luật Việt Nam':'Quy chế nội bộ AMG',cls:'mt'})).join('')}
  ${panel('Thang lương P1 – điểm giữa từng bậc',`<div class="form" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${scale}</div>`,{cls:'mt'})}
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0"><button class="btn pri" data-act="savePolicy"${lockAdmin()}>Lưu và áp dụng tham số</button><button class="btn" data-act="resetPolicy"${lockAdmin()}>Khôi phục mặc định</button><button class="btn" data-act="aiPolicy"${S.sample?'':' disabled title="Cần đăng nhập"'}>${S.ai.busy==='policy'?'<span class="spin"></span> Đang rà soát…':'AI rà soát (sao chép prompt, 0 đ)'}</button></div>
  ${ai&&ai.at?`<p class="small muted">Rà soát AI lúc ${new Date(ai.at).toLocaleString('vi-VN')}. Kết quả AI dựa trên dữ liệu huấn luyện của mô hình, có thể chưa cập nhật văn bản mới nhất: luôn đối chiếu văn bản gốc trước khi lưu.</p>`:''}
  <div class="grid g2" style="margin-top:16px">
   ${panel('Chuẩn mực quốc tế áp dụng cho MNC',`<div class="list">${STANDARDS.map(([t,d])=>`<div class="sev info"><div><b>${esc(t)}</b><div class="small">${esc(d)}</div></div></div>`).join('')}</div>`)}
   ${panel('Quy chế nội bộ',`<div class="small" style="max-width:70ch"><p><b>Đãi ngộ:</b> thăm hỏi ốm đau dài ngày; hỗ trợ thai sản và sinh con ${fmt(P('birth'))}đ/bé (tối đa 2 bé); mừng cưới ${fmt(P('wedding'))}đ; phúng viếng tứ thân phụ mẫu; quà sinh nhật ${fmt(P('bday'))}đ.</p><p><b>Thưởng:</b> 8/3, 20/10, 1/6, Trung thu, 1/5, Tết; nghỉ mát; thưởng thâm niên; tháng 13 và thưởng hiệu suất theo xếp loại (A 2,5 · B 1,8 · C 1,2 · D 0,5 tháng P1).</p><p><b>Kỷ luật:</b> theo nội quy đã đăng ký, hình thức tại Điều 124 BLLĐ 2019 (khiển trách, kéo dài nâng lương, cách chức, sa thải). Không phạt tiền, không cắt lương thay xử lý kỷ luật (Điều 127).</p><p><b>Chấm dứt HĐ:</b> báo trước 45 ngày (HĐ không xác định thời hạn), 30 ngày (HĐ 12–36 tháng), 3 ngày làm việc (dưới 12 tháng). Trợ cấp thôi việc 1/2 tháng lương mỗi năm làm việc không tham gia BHTN.</p></div>`)}
  </div>
  ${panel('Nguồn văn bản chính thức',`<div class="list">${OFFICIAL.map(([n,u])=>`<div><a href="${u}" target="_blank" rel="noopener">${esc(n)}</a> <span class="small muted mono">${esc(u)}</span></div>`).join('')}</div>`,{cls:'mt'})}`;
};

V.automation=()=>{
  const runs=Object.entries(S.col.runs).map(([id,r])=>({id,...r})).sort((a,b)=>b.at-a.at).slice(0,30);
  const T=M.T,per=`${z2(T.getMonth()+1)}/${T.getFullYear()}`;
  const cards=[
   ['runSync','Đồng bộ toàn hệ thống','Tính lại toàn bộ chỉ số theo ngày hôm nay và chính sách hiện hành, ghi nhật ký tóm tắt cho Ban giám đốc.',false],
   ['runPayroll',`Chốt bảng lương ${per}`,'Tính P1–P2–P3, phụ cấp, làm thêm, BHXH/BHYT/BHTN, thuế TNCN; lưu bản chụp kỳ lương để so sánh.',false],
   ['runCompliance','Rà soát tuân thủ & tạo việc','Quét hợp đồng, thử việc, giấy phép lao động, làm thêm giờ, nghỉ hưu, thanh toán nghỉ việc; tạo việc cho mục khẩn và cần xử lý.',false],
   ['runCalendar','Nhắc hạn báo cáo bắt buộc','Tính hạn nộp kế tiếp của các báo cáo cho cơ quan nhà nước; tạo việc cho báo cáo đến hạn trong 30 ngày.',false],
   ['aiPolicy','AI rà soát chính sách pháp luật','Claude đối chiếu các tham số pháp lý với hiểu biết mới nhất về văn bản còn hiệu lực, đề xuất cập nhật để Editor duyệt.',true],
   ['aiReport','AI soạn báo cáo nhân sự tháng','Claude viết báo cáo cho Ban giám đốc từ số liệu đang hiển thị: biến động, chi phí, rủi ro, đề xuất.',true],
   ['goPkg','Cập nhật chính sách & pháp luật theo gói','Chọn gói (lương tối thiểu vùng, thuế TNCN, bảo hiểm, lương cơ sở, phụ cấp, tăng lương năm), xem trước tác động rồi áp dụng; có lịch sử và hoàn tác.',false],
   ['runRoadmap','Áp dụng lộ trình pháp luật năm nay','Tự tính tuổi nghỉ hưu theo lộ trình NĐ 135/2020 cho năm hiện tại, cập nhật cảnh báo nghỉ hưu và tạo việc cho bộ phận nhân sự.',false],
   ['goBhxh','Lập danh sách BHXH tăng/giảm & số liệu báo cáo','Tổng hợp báo tăng, báo giảm, điều chỉnh mức đóng trong tháng và số liệu cho các báo cáo bắt buộc.',false],
   ['goTrain','Kiểm tra đào tạo bắt buộc','Rà soát huấn luyện ATVSLĐ, bảo vệ dữ liệu cá nhân, quy tắc ứng xử; người chưa học thành cảnh báo.',false],
   ['goLife','Theo dõi onboarding & offboarding','Checklist nhận việc, thử việc, nghỉ việc; bước quá hạn tự động thành cảnh báo tuân thủ.',false],
   ['goDocs','Tạo văn bản nhân sự','Sinh thư mời, quyết định lương, thuyên chuyển, thông báo chính sách từ dữ liệu hiện tại.',false],
  ];
  return `
  <div class="banner">Mỗi nút chạy ngay trên dữ liệu hiện tại. Kết quả được lưu vào dữ liệu chung nên mọi người có quyền xem đều thấy cùng một trạng thái.</div>
  ${sheetsPanel()}
  <div class="auto">${cards.map(([a,t,d,ai])=>`<div class="card"><h4>${esc(t)}</h4><p>${esc(d)}</p><div><button class="btn pri" data-act="${a}"${ai?(S.sample?'':' disabled title="Cần đăng nhập"'):lock()}>${S.ai.busy===a||S.ai.busy===a.replace('ai','').toLowerCase()?'<span class="spin"></span> Đang chạy…':'Chạy'}</button></div></div>`).join('')}</div>
  <div class="grid g2" style="margin-top:16px">
   ${panel('Xuất dữ liệu',`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="exportEmp">Hồ sơ nhân sự (CSV)</button><button class="btn" data-act="exportPay">Bảng lương (CSV)</button><button class="btn" data-act="exportChecks">Cảnh báo tuân thủ (CSV)</button><button class="btn" data-act="exportCost">Chi phí nhân sự (CSV)</button></div><p class="small muted">File CSV mã hóa UTF-8, mở trực tiếp bằng Excel hoặc Google Sheets.</p>`)}
   ${panel('Nhật ký tự động',runs.length?tbl(['Thời điểm','Tác vụ','Kết quả','Người chạy'],runs.map(r=>`<tr><td class="small">${new Date(r.at).toLocaleString('vi-VN')}</td><td>${esc(r.type)}</td><td class="small">${esc(r.summary)}</td><td class="small">${esc(nameOf(r.by))}</td></tr>`)):'<p class="muted">Chưa có lần chạy nào.</p>')}
  </div>
  ${S.ai.report?panel('Báo cáo nhân sự do AI soạn',`<div class="ai">${mdLite(S.ai.report.text)}</div>`,{sub:new Date(S.ai.report.at).toLocaleString('vi-VN'),act:`<button class="btn sm" data-act="saveReport">Tải về (.md)</button>`,cls:'mt'}):''}`;
};

V.library=()=>`
  <div class="banner">Thư viện được lập từ 542 file trong thư mục <b>HR SYSTEM</b>. Mỗi nhóm tài liệu đã được chuyển thành chức năng trong trang; bấm "Mở mô-đun" để xem nơi dùng.</div>
  <div class="lib">${LIB.map(l=>`<div class="grp"><div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b>${esc(l.g)}</b><button class="btn sm" data-act="go" data-v="${l.mod}">Mở mô-đun</button></div><ul>${l.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
  ${panel('Bản đồ liên kết dữ liệu',`<pre class="mermaid">flowchart LR
  A[Yêu cầu tuyển dụng] -->|Nhận việc| B[Hồ sơ nhân sự]
  B --> C[Hợp đồng & thử việc]
  B --> D[Chấm công & làm thêm]
  B --> E[KPI & năng lực]
  E -->|P2, P3| F[Bảng lương 3P]
  D -->|Tiền làm thêm| F
  G[Chính sách & pháp luật] -->|BH, thuế, lương tối thiểu| F
  G -->|Giới hạn giờ, tuổi hưu| H[Rà soát tuân thủ]
  C --> H
  F --> I[Chi phí nhân sự]
  H --> J[Việc cần làm]
  K[Lịch báo cáo bắt buộc] --> J
  B -->|Nghỉ việc| L[Biến động & tỷ lệ nghỉ việc]</pre>`,{cls:'mt'})}`;

V.access=()=>{
  const role=S.isOwner?'Chủ sở hữu':S.canAdmin?'Người chỉnh sửa (Editor)':S.canWrite&&S.db?'Người đóng góp (Contributor)':S.db?'Người xem / Người bình luận':'Chế độ xem cục bộ';
  const audit=Object.entries(S.col.audit).map(([id,a])=>({id,...a})).sort((a,b)=>b.at-a.at).slice(0,60);
  const mx=[['Xem toàn bộ dashboard, hồ sơ, bảng lương','yes','yes','yes','yes'],['Bình luận vào từng khối','no','yes','yes','yes'],['Sửa hồ sơ, tuyển dụng, đánh dấu báo cáo, chạy tự động','no','no','yes','yes'],['Sửa tham số chính sách & thang lương','no','no','no','yes'],['Mời người khác, đổi quyền','no','no','no','yes*']];
  return `
  <div class="kpis">${kpi('Bạn đang xem với vai trò',esc(role),S.me&&S.me.name?esc(S.me.name):'')}${kpi('Lưu trữ',S.db?'Dữ liệu chung':'Chỉ phiên này',S.db?'Đồng bộ thời gian thực':'Mở trên ứng dụng để lưu')}</div>
  <div class="grid g2">
   ${panel('Cách chia sẻ theo email',`<div class="steps small" style="max-width:68ch"><div><b>1.</b> Mở trang này trên ứng dụng, bấm nút <b>Share</b> (Chia sẻ) ở góc trên.</div><div><b>2.</b> Nhập email người nhận, chọn quyền: <b>Viewer</b> (chỉ xem), <b>Commenter</b> (xem và bình luận), <b>Contributor</b> (sửa dữ liệu) hoặc <b>Editor</b> (toàn quyền, gồm chính sách).</div><div><b>3.</b> Gửi lời mời. Người nhận đăng nhập bằng đúng email đó để mở link. Có thể đổi hoặc thu hồi quyền bất kỳ lúc nào trong cùng menu.</div><div><b>4.</b> Mọi thay đổi dữ liệu được ghi vào nhật ký bên dưới kèm người thực hiện.</div><p class="muted">Lưu ý bảo mật: trang chứa dữ liệu lương. Với dữ liệu thật, chỉ mời đúng người cần biết, không bật link công khai (Luật Bảo vệ dữ liệu cá nhân 2025).</p></div>`)}
   ${panel('Ma trận phân quyền',`<div class="tw"><table class="tbl matrix"><thead><tr><th>Thao tác</th><th>Viewer</th><th>Commenter</th><th>Contributor</th><th>Editor</th></tr></thead><tbody>${mx.map(r=>`<tr><td>${esc(r[0])}</td>${r.slice(1).map(c=>`<td class="${c.startsWith('yes')?'yes':'no'}">${c.startsWith('yes')?'Có'+(c.endsWith('*')?'*':''):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">* Mời và đổi quyền thực hiện trong menu Share của ứng dụng.</p>`)}
  </div>
  ${panel('Nhật ký thay đổi',audit.length?tbl(['Thời điểm','Người thực hiện','Thao tác','Chi tiết'],audit.map(a=>`<tr><td class="small">${new Date(a.at).toLocaleString('vi-VN')}</td><td>${esc(nameOf(a.by))}</td><td>${esc(a.action)}</td><td class="small">${esc(a.detail)}</td></tr>`)):'<p class="muted">Chưa có thay đổi nào.</p>',{cls:'mt'})}`;
};

/* ============ Google Sheets sync (viewer's own Google Sheets connector) ============ */
const SHEETS_SERVER='Google Sheets';
const TAB={ov:'Tổng quan',emp:'Nhân sự',pay:'Bảng lương',chk:'Tuân thủ',req:'Tuyển dụng',cost:'Chi phí',pol:'Chính sách',log:'Nhật ký đồng bộ'};
const EMP_HEAD=['Mã','Họ tên','Giới tính','Ngày sinh','Trình độ','Khối','Chức danh','Bậc','Địa điểm','Ngày vào làm','Hợp đồng','Hết hạn HĐ','Trạng thái','Ngày nghỉ','P1','Cấp năng lực','KPI','Xếp loại','Người phụ thuộc','Làm thêm tháng','Làm thêm năm','Phép đã nghỉ'];
const sheetCfg=()=>S.col.settings.sheets||{};
const sheetId=()=>sheetCfg().id||'';
const sheetUrl=()=>sheetId()?'https://docs.google.com/spreadsheets/d/'+sheetId()+'/edit':'';
function parseSheetId(s){const m=String(s||'').match(/\/d\/([A-Za-z0-9_-]{20,})/);return m?m[1]:String(s||'').trim()}
function dig(o,k,depth=0){if(!o||typeof o!=='object'||depth>6)return undefined;if(Object.prototype.hasOwnProperty.call(o,k))return o[k];for(const v of Object.values(o)){const r=dig(v,k,depth+1);if(r!==undefined)return r}return undefined}
function payloadOf(r){let p=r&&r.payload!==undefined?r.payload:undefined;
  if(p===undefined&&r&&Array.isArray(r.content)){const t=r.content.find(c=>c.type==='text');if(t){try{p=JSON.parse(t.text)}catch(_){p=t.text}}}
  if(typeof p==='string'){try{p=JSON.parse(p)}catch(_){}}return p}
async function gs(tool,input){return payloadOf(await S.mcp.callTool(SHEETS_SERVER,tool,input,{cache:false}))}
const A1=(t,r)=>`'${t}'!${r}`;
function numVi(v){if(typeof v==='number')return v;let s=String(v).replace(/\s|đ|%/g,'');if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');else if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))s=s.replace(/,/g,'');else s=s.replace(',','.');const n=Number(s);return isFinite(n)?n:NaN}
function dateVi(v){if(v==null||v==='')return null;const s=String(v).trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+'-'+z2(m[2])+'-'+z2(m[3]);m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(m)return m[3]+'-'+z2(m[2])+'-'+z2(m[1]);return null}
function sheetTabs(m){
  const R=Math.round,T=m.T,{lines,total}=costLines(m);
  const runs=Object.values(S.col.runs).sort((a,b)=>b.at-a.at).slice(0,300);
  return{
   [TAB.ov]:[['HR Analytics – AMG Việt Nam (dữ liệu mô phỏng)',''],['Cập nhật lúc',new Date().toLocaleString('vi-VN')],['Kỳ',`${z2(T.getMonth()+1)}/${T.getFullYear()}`],['',''],
    ['Nhân sự hiện có',m.active.length],['Đang làm việc',m.working.length],['Tuyển mới từ đầu năm',m.hiresY.length],['Nghỉ việc từ đầu năm',m.exitsY.length],['Tỷ lệ nghỉ việc quy năm (%)',+(m.turnAnn*100).toFixed(1)],
    ['Quỹ lương gross',R(m.tot.gross)],['Thực lĩnh',R(m.tot.net)],['Thuế TNCN',R(m.tot.tax)],['BH NLĐ đóng',R(m.tot.insE)],['BH NSDLĐ đóng',R(m.tot.insC)],['Tổng chi phí nhân sự',R(total)],['Chi phí nhân sự / doanh thu (%)',+(total/P('revenue')*100).toFixed(1)],
    ['Cảnh báo khẩn',m.checks.filter(c=>c.sev==='crit').length],['Cảnh báo cần xử lý',m.checks.filter(c=>c.sev==='warn').length],['Yêu cầu tuyển dụng đang mở',m.openReqs.length],['Vị trí còn trống',sum(m.openReqs,r=>r.qty-r.hired)],['Thời gian tuyển TB (ngày)',R(m.ttf)],['',''],
    ['Tháng','Tuyển mới','Nghỉ việc','Nhân sự cuối tháng'],...m.monthly.map((x,i)=>[MONTHS[i],x.h,x.x,x.hc==null?'':x.hc]),['','','',''],
    ['Khối','Nhân sự','Quỹ lương gross','KPI bình quân'],...DEPTS.map(d=>{const a=m.active.filter(e=>e.dept===d.id);return[d.name,a.length,R(sum(a.filter(e=>e.pay),e=>e.pay.gross)),+avg(a,e=>e.kpi).toFixed(2)]})],
   [TAB.emp]:[EMP_HEAD,...m.emps.map(e=>[e.id,e.name,e.gender,e.dob,e.edu,e.deptName,e.title,'GS'+z2(e.grade),(SITES[e.site]||{}).name||'',e.hire,e.contract,e.cEnd||'',e.status,e.exit||'',R(e.p1),e.comp,e.kpi,e.rating,e.dep,e.otM,e.otY,e.leave.used])],
   [TAB.pay]:[['Mã','Họ tên','Khối','P1','P2','P3','Phụ cấp','Làm thêm','Gross','BHXH NLĐ','BHYT NLĐ','BHTN NLĐ','Thu nhập tính thuế','Thuế TNCN','Thực lĩnh','BH NSDLĐ','KPCĐ','Chi phí công ty'],...m.payroll.map(e=>{const p=e.pay;return[e.id,e.name,e.deptName,...[p.p1,p.p2,p.p3,p.lunch+p.phone+p.travel+p.housing,p.ot,p.gross,p.eBHXH,p.eBHYT,p.eBHTN,p.assess,p.tax,p.net,p.insC,p.kpcd,p.cost].map(R)]})],
   [TAB.chk]:[['Mức','Mã NV','Họ tên','Khối','Loại','Nội dung','Hạn','Căn cứ'],...m.checks.map(c=>[sevName[c.sev],c.e?c.e.id:'',c.e?c.e.name:'',c.e?c.e.deptName:'',c.type,c.msg,c.due||'',c.law])],
   [TAB.req]:[['Mã','Vị trí','Khối','Bậc','Số lượng','Đã nhận việc','Ứng tuyển','Sàng lọc','Phỏng vấn','Offer','Ưu tiên','Kênh','Ngân sách','Đã chi','Ngày mở','Trạng thái'],...m.reqs.map(r=>[r.id,r.title,(DEPT[r.dept]||{}).name||r.dept,'GS'+z2(r.grade),r.qty,r.hired,r.applied,r.screened,r.interviewed,r.offered,r.prio,r.channel,r.budget,r.spent,r.opened,r.status])],
   [TAB.cost]:[['Mã số','Chỉ tiêu','Số tiền (đ)','Tỷ lệ (%)'],...lines.map(([c,l,v])=>[c,l,R(v),+(v/total*100).toFixed(2)]),['','Tổng chi phí',R(total),100]],
   [TAB.pol]:[['Nhóm','Tham số','Giá trị','Đơn vị','Căn cứ','Hiệu lực'],...PARAMS.map(p=>[p.g,p.label,P(p.k),p.unit,p.basis,p.eff])],
   [TAB.log]:[['Thời điểm','Tác vụ','Kết quả','Người chạy'],[new Date().toLocaleString('vi-VN'),'Đồng bộ Google Sheets','Đang ghi dữ liệu',nameOf(S.meId)],...runs.map(r=>[new Date(r.at).toLocaleString('vi-VN'),r.type,r.summary,nameOf(r.by)])],
  };
}
async function ensureTabs(id,tabs){
  const p=await gs('get_spreadsheet',{spreadsheetId:id,fields:['sheets.properties.sheetId','sheets.properties.title','sheets.properties.gridProperties']});
  const sheets=(dig(p,'sheets')||[]).map(s=>s.properties||s);const req=[];
  for(const[t,rows]of Object.entries(tabs)){
    const need=rows.length+50,cols=Math.max(...rows.map(r=>r.length));const s=sheets.find(x=>x.title===t);
    if(!s)req.push({addSheet:{properties:{title:t,gridProperties:{rowCount:Math.max(need,200),columnCount:Math.max(cols,10),frozenRowCount:t===TAB.ov?0:1}}}});
    else{const g=s.gridProperties||{};if((g.rowCount||0)<need)req.push({appendDimension:{sheetId:s.sheetId,dimension:'ROWS',length:need-(g.rowCount||0)}});if((g.columnCount||0)<cols)req.push({appendDimension:{sheetId:s.sheetId,dimension:'COLUMNS',length:cols-(g.columnCount||0)}})}
  }
  if(req.length)await gs('update_spreadsheet',{spreadsheetId:id,requests:req});
}
function sheetErr(e){
  const c=e&&e.code;
  const msg=c==='needs_reauth'?'Kết nối Google Sheets đã hết hạn: kết nối lại trong ứng dụng Settings → Connectors':
    c==='server_not_connected'?'Bạn chưa thêm connector Google Sheets: vào ứng dụng Settings → Connectors để thêm':
    c==='selection_required'?'Chọn tài khoản Google Sheets trong hộp thoại của ứng dụng rồi thử lại':
    c==='not_in_manifest'?'Bạn đã tắt quyền Google Sheets cho trang này (menu Permissions của artifact)':
    c==='blocked_by_policy'?'Tổ chức của bạn chặn Google Sheets cho trang này':
    c==='tool_error'?'Google Sheets từ chối: kiểm tra bạn có quyền chỉnh sửa file Sheet này':
    c==='server_unavailable'?'Google Sheets tạm thời không phản hồi, thử lại sau ít phút':
    'Không đồng bộ được: '+((e&&e.message)||c||'lỗi không xác định');
  S.sheet.msg=msg;toast(msg);
}
async function pushSheets(trigger){
  if(S.sheet.busy)return;
  if(!S.mcp)return toast('Cần đăng nhập để đồng bộ Google Sheets');
  const id=sheetId();if(!id)return toast('Chưa cấu hình Google Sheet đích');
  S.sheet.busy='push';render();
  try{
    build();const tabs=sheetTabs(M);
    await ensureTabs(id,tabs);
    await gs('batch_clear_values',{spreadsheetId:id,ranges:Object.keys(tabs).map(t=>A1(t,'A1:Z'))});
    for(const[t,rows]of Object.entries(tabs))await gs('update_values',{spreadsheetId:id,range:A1(t,'A1'),values:rows});
    const msg=`${Object.keys(tabs).length} tab · ${tabs[TAB.emp].length-1} hồ sơ · ${tabs[TAB.pay].length-1} dòng lương · ${tabs[TAB.chk].length-1} cảnh báo`;
    S.sheet.msg='Đã đẩy lúc '+new Date().toLocaleTimeString('vi-VN')+': '+msg;
    await logRun('Đẩy lên Google Sheets ('+(trigger==='auto'?'tự động':'thủ công')+')',msg);
    if(trigger!=='auto')toast('Đã đồng bộ lên Google Sheets');
  }catch(e){sheetErr(e)}
  S.sheet.busy='';render();
}
const PULL_FIELDS=[['Chức danh','title','s'],['Bậc','grade','g'],['P1','p1','n'],['Cấp năng lực','comp','n'],['KPI','kpi','n'],['Hợp đồng','contract','c'],['Hết hạn HĐ','cEnd','d'],['Người phụ thuộc','dep','n'],['Làm thêm tháng','otM','n'],['Làm thêm năm','otY','n'],['Phép đã nghỉ','leaveUsed','n']];
async function pullSheets(){
  if(S.sheet.busy)return;
  if(!S.mcp)return toast('Cần đăng nhập để đồng bộ Google Sheets');
  const id=sheetId();if(!id)return toast('Chưa cấu hình Google Sheet đích');
  S.sheet.busy='pull';render();
  try{
    const p=await gs('get_values',{spreadsheetId:id,range:A1(TAB.emp,'A1:V3000')});
    const vals=dig(p,'values')||[];
    if(vals.length<2){toast('Tab "Nhân sự" đang trống: hãy đẩy dữ liệu lên trước');S.sheet.busy='';render();return}
    const head=vals[0].map(x=>String(x).trim()),ix=h=>head.indexOf(h);
    if(ix('Mã')<0)throw{message:'Tab "Nhân sự" thiếu cột "Mã"'};
    build();const byId=Object.fromEntries(M.emps.map(e=>[e.id,e]));
    let nEmp=0,nField=0,skipped=0;const changedIds=[];
    for(const row of vals.slice(1)){
      const e=byId[String(row[ix('Mã')]||'').trim()];if(!e)continue;const patch={};
      for(const[h,k,t]of PULL_FIELDS){
        const i=ix(h);if(i<0||row[i]===undefined||row[i]==='')continue;let v=row[i],cur=k==='leaveUsed'?e.leave.used:e[k];
        if(t==='n'){v=numVi(v);if(!isFinite(v)){skipped++;continue}
          if(k==='kpi'&&(v<1||v>5)||k==='comp'&&(v<0||v>3)||v<0){skipped++;continue}
          if(Math.abs(v-Number(cur))<1e-9)continue}
        else if(t==='g'){v=parseInt(String(v).replace(/\D/g,''),10);if(!(v>=1&&v<=13)){skipped++;continue}if(v===e.grade)continue}
        else if(t==='c'){v=String(v).trim();if(![C_PROB,C_DEF,C_INDEF].includes(v)){skipped++;continue}if(v===cur)continue}
        else if(t==='d'){v=dateVi(v);if(!v){skipped++;continue}if(v===cur)continue}
        else{v=String(v).trim();if(v===cur)continue}
        patch[k]=v;
      }
      if(patch.p1!=null){const mult=e._p1Base?e.p1/e._p1Base:1;patch.p1=Math.round(patch.p1/mult)}
      if(Object.keys(patch).length){nEmp++;nField+=Object.keys(patch).length;changedIds.push(e.id);
        await put('employees',e.id,{...(S.col.employees[e.id]||{}),...patch,_at:Date.now(),_by:S.meId||null,_src:'sheets'})}
    }
    const msg=`${nEmp} hồ sơ, ${nField} trường được cập nhật${skipped?` · bỏ qua ${skipped} ô không hợp lệ`:''}`;
    S.sheet.msg='Đã nhập lúc '+new Date().toLocaleTimeString('vi-VN')+': '+msg;
    if(nEmp)audit('Nhập thay đổi từ Google Sheets',changedIds.slice(0,12).join(', ')+(changedIds.length>12?'…':''));
    await logRun('Nhập từ Google Sheets',msg);toast(nEmp?'Đã nhập '+msg:'Không có thay đổi mới trong Sheet');
  }catch(e){sheetErr(e)}
  S.sheet.busy='';render();
}
function afterAuto(){const c=sheetCfg();if(c.auto&&c.id&&S.mcp&&S.canWrite)pushSheets('auto')}
function sheetsPanel(){
  const c=sheetCfg(),id=c.id,last=Object.values(S.col.runs).filter(r=>/Google Sheets/.test(r.type)).sort((a,b)=>b.at-a.at)[0];
  const ok=!!S.mcp,b=S.sheet.busy;
  return panel('Đồng bộ Google Sheets',`
   <div class="grid g2" style="gap:12px">
    <div class="small" style="display:flex;flex-direction:column;gap:6px">
     <div>File đích: ${id?`<a href="${esc(sheetUrl())}" target="_blank" rel="noopener">${esc(c.title||'Mở Google Sheet')}</a> <span class="muted mono">${esc(id.slice(0,10))}…</span>`:'<span class="muted">chưa cấu hình</span>'}</div>
     <div>8 tab: ${Object.values(TAB).map(t=>pill(t,'mute')).join(' ')}</div>
     <div>Lần gần nhất: ${last?`${new Date(last.at).toLocaleString('vi-VN')} · ${esc(last.type)} · ${esc(nameOf(last.by))}<div class="muted">${esc(last.summary)}</div>`:'<span class="muted">chưa đồng bộ</span>'}</div>
     ${S.sheet.msg?`<div style="color:var(--accent)">${esc(S.sheet.msg)}</div>`:''}
     ${ok?'':'<div style="color:var(--warn)">Cần đăng nhập (Contributor trở lên) để đồng bộ.</div>'}
    </div>
    <div class="small" style="display:flex;flex-direction:column;gap:8px">
     <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn pri" data-act="pushSheets"${ok&&id&&!b?lock():' disabled'}>${b==='push'?'<span class="spin"></span> Đang đẩy…':'Đẩy dữ liệu lên Sheets'}</button>
      <button class="btn" data-act="pullSheets"${ok&&id&&!b?lock():' disabled'}>${b==='pull'?'<span class="spin"></span> Đang nhập…':'Nhập thay đổi từ Sheets'}</button>
     </div>
     <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="sh_auto" data-act="sheetAuto"${c.auto?' checked':''}${lockAdmin()}> Tự đẩy lên Sheets sau mỗi tác vụ tự động và khi lưu chính sách</label>
     <div style="display:flex;gap:6px;flex-wrap:wrap"><input id="sh_id" placeholder="Dán link hoặc ID Google Sheet khác" style="flex:1 1 220px;border:1px solid var(--line);border-radius:7px;padding:5px 8px;background:var(--surface)"${lockAdmin()}><button class="btn sm" data-act="sheetSave"${lockAdmin()}>Đổi file đích</button></div>
     <div class="muted">Máy chủ Apps Script ghi vào Google Sheet báo cáo của Owner (miễn phí); không cần tài khoản Google của người bấm. "Nhập thay đổi" đọc tab Nhân sự và cập nhật các cột: Chức danh, Bậc, P1, Cấp năng lực, KPI, Hợp đồng, Hết hạn HĐ, Người phụ thuộc, Làm thêm, Phép đã nghỉ.</div>
    </div>
   </div>`,{sub:'Hai chiều: trang → Sheets cho báo cáo; Sheets → trang cho chỉnh sửa hàng loạt'});
}

function nameOf(id){if(!id)return 'Khách';const p=S.profiles[id];return(p&&p.name)||(id===S.meId?'Bạn':'Thành viên')}
function mdLite(t){return esc(t).replace(/^### (.*)$/gm,'<b>$1</b>').replace(/^## (.*)$/gm,'<b style="font-size:15px">$1</b>').replace(/^# (.*)$/gm,'<b style="font-size:16px">$1</b>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}

/* ============ extended modules: chấm công, đào tạo, onboarding/offboarding, khen thưởng – kỷ luật, BHXH, văn bản, gói chính sách ============ */
function hseed(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function workdays(a,b){let n=0;const d=new Date(a);while(d<=b){const w=d.getDay();if(w!==0&&w!==6)n++;d.setDate(d.getDate()+1)}return n}
const fmtV=v=>Number.isInteger(Number(v))?fmt(v):Number(v).toLocaleString('vi-VN',{maximumFractionDigits:2});
const optHtml=(arr,cur)=>arr.map(([v,l])=>`<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(l)}</option>`).join('');
function attendance(e,T){
  if(e.status!=='Đang làm việc')return null;
  const first=new Date(T.getFullYear(),T.getMonth(),1),h=parse(e.hire),start=h>first?h:first;
  const std=workdays(start,T),r=mulberry32(hseed(e.id+'|'+T.getFullYear()+'-'+T.getMonth()));
  const late=Math.floor(Math.pow(r(),3)*7),unpaid=r()<.05?1+Math.floor(r()*2):0,sick=r()<.08?1+Math.floor(r()*3):0,leave=r()<.25?1+Math.floor(r()*2):0;
  const u=Math.min(unpaid,std),s=Math.min(sick,Math.max(0,std-u)),l=Math.min(leave,Math.max(0,std-u-s));
  return{std,late,unpaid:u,sick:s,leave:l,actual:std-u-s-l};
}

/* ----- Đào tạo (Quy trình đào tạo, đào tạo nội bộ / thuê ngoài, huấn luyện ATVSLĐ) ----- */
const COURSES=[
 {id:'C01',name:'Hội nhập văn hóa & nội quy lao động AMG',type:'Nội bộ',hours:8,cost:0,req:true,onboard:true,who:e=>e.tenureY<1,law:'Quy trình đào tạo hội nhập; nội quy lao động'},
 {id:'C02',name:'Huấn luyện ATVSLĐ định kỳ (nhóm 3, 4)',type:'Thuê ngoài – tổ chức huấn luyện được cấp phép',hours:16,cost:450000,req:true,safety:true,who:e=>['PRD','ENG','QA','SCM'].includes(e.dept)&&e.grade<=8,law:'Luật ATVSLĐ 2015; NĐ 44/2016/NĐ-CP'},
 {id:'C03',name:'Huấn luyện ATVSLĐ nhóm 1, 2 (quản lý, phụ trách ATVSLĐ)',type:'Thuê ngoài – tổ chức huấn luyện được cấp phép',hours:16,cost:900000,req:true,safety:true,who:e=>e.grade>=9&&['PRD','ENG','QA','SCM','BOD','HR'].includes(e.dept),law:'NĐ 44/2016/NĐ-CP'},
 {id:'C04',name:'Bảo vệ dữ liệu cá nhân trong công việc',type:'Nội bộ (e-learning)',hours:2,cost:0,req:true,who:()=>true,law:'Luật Bảo vệ dữ liệu cá nhân 2025'},
 {id:'C05',name:'Quy tắc ứng xử & chống hối lộ',type:'Nội bộ (e-learning)',hours:2,cost:0,req:true,who:e=>e.grade>=5,law:'Chính sách tuân thủ tập đoàn (FCPA, UK Bribery Act)'},
 {id:'C06',name:'Phòng chống quấy rối tình dục tại nơi làm việc',type:'Nội bộ',hours:2,cost:0,req:true,who:()=>true,law:'Điều 85 NĐ 145/2020/NĐ-CP'},
 {id:'C07',name:'Lãnh đạo tuyến đầu',type:'Thuê ngoài',hours:24,cost:6500000,req:false,who:e=>e.grade>=7&&e.grade<=10},
 {id:'C08',name:'Lean Six Sigma Green Belt',type:'Thuê ngoài',hours:40,cost:12000000,req:false,who:e=>['PRD','QA','ENG'].includes(e.dept)&&e.grade>=5},
 {id:'C09',name:'Bán hàng tư vấn B2B',type:'Nội bộ',hours:16,cost:1500000,req:false,who:e=>e.dept==='SAL'},
 {id:'C10',name:'Phân tích dữ liệu với Excel & Power BI',type:'Thuê ngoài',hours:20,cost:3500000,req:false,who:e=>['FIN','HR','IT','SCM','MKT'].includes(e.dept)&&e.grade>=4},
];
function trainState(m){
  return COURSES.map(c=>{
    const ov=(S.col.training[c.id]||{}).done||{};
    const target=m.working.filter(e=>c.who(e)),done=[],pending=[];
    for(const e of target){
      let d=ov[e.id];
      if(d===undefined){const r=mulberry32(hseed(c.id+e.id))(),td=e.tenureY*365;const rate=c.req?(c.onboard?.9:.87):.5;d=td>14&&r<rate}
      (d?done:pending).push(e);
    }
    return{...c,target,done,pending,rate:target.length?done.length/target.length:1,spent:done.length*c.cost,hoursDone:done.length*c.hours};
  });
}

/* ----- Onboarding / Offboarding (Thủ tục nhận việc, chương trình thử việc, quy trình nghỉ việc, quản lý tài sản) ----- */
const ONB=[['offer','Gửi thư mời nhận việc',-7],['contract','Ký HĐ thử việc / HĐ lao động',0],['docs','Thu hồ sơ: CCCD, bằng cấp, giấy khám sức khỏe, phiếu kê khai thông tin',3],['account','Cấp email, tài khoản hệ thống, thẻ ra vào',0],['asset','Bàn giao thiết bị, tài sản (biên bản)',1],['day1','Hội nhập ngày đầu, phổ biến nội quy',1],['buddy','Phân công người hướng dẫn',2],['safety','Huấn luyện ATVSLĐ ban đầu',7],['r30','Đánh giá 30 ngày',30],['probEval','Đánh giá kết thúc thử việc',null],['official','Thông báo kết quả, ký HĐ chính thức',null],['bhxh','Báo tăng BHXH',null]];
const OFFB=[['letter','Nhận đơn / ra quyết định chấm dứt HĐ',-30],['interview','Phỏng vấn thôi việc',-3],['handover','Bàn giao công việc',-1],['asset','Thu hồi tài sản, thẻ ra vào',0],['account','Khóa tài khoản hệ thống',0],['pay','Thanh toán lương, phép năm chưa nghỉ',14],['severance','Chi trợ cấp thôi việc (nếu có)',14],['bhxh','Báo giảm và chốt sổ BHXH',14],['docs','Trả bản chính giấy tờ, xác nhận quá trình làm việc',14]];
function lifecycle(m){
  const T=m.T;
  const onb=m.active.filter(e=>{const d=days(parse(e.hire),T);return d<=120&&d>=-30}).map(e=>{
    const ov=S.col.onboard[e.id]||{},r=mulberry32(hseed('onb'+e.id)),pe=e.probEnd||iso(addDays(parse(e.hire),60));
    const items=ONB.map(([k,l,d])=>{const due=d==null?(k==='bhxh'?iso(addDays(parse(pe),5)):pe):iso(addDays(parse(e.hire),d));const def=parse(due)<addDays(T,-2)&&r()<.97;const done=ov[k]!==undefined?!!ov[k]:def;return{k,l,due,done,over:!done&&parse(due)<T}});
    return{e,items,done:items.filter(i=>i.done).length,over:items.filter(i=>i.over)};
  });
  const offb=m.emps.filter(e=>(e.status==='Nghỉ việc'&&e.exit&&days(parse(e.exit),T)<=60&&days(parse(e.exit),T)>=0)||(e.plannedExit&&e.status!=='Nghỉ việc')).map(e=>{
    const base=e.status==='Nghỉ việc'?e.exit:e.plannedExit,ov=S.col.offboard[e.id]||{},r=mulberry32(hseed('off'+e.id));
    const items=OFFB.map(([k,l,d])=>{const due=iso(addDays(parse(base),d));const def=parse(due)<addDays(T,-1)&&r()<.97;const done=ov[k]!==undefined?!!ov[k]:def;return{k,l,due,done,over:!done&&parse(due)<T}});
    return{e,base,items,done:items.filter(i=>i.done).length,over:items.filter(i=>i.over)};
  });
  return{onb,offb};
}

/* ----- Khen thưởng & kỷ luật (dashboard khen thưởng; quy trình xác minh & xử lý vi phạm; Điều 122–129 BLLĐ) ----- */
const REWARD_REASONS=['Nhân viên xuất sắc quý','Sáng kiến cải tiến','Vượt chỉ tiêu doanh số','An toàn lao động không sự cố','Hỗ trợ đồng nghiệp & văn hóa'];
const DISC_FORMS=['Khiển trách','Kéo dài thời hạn nâng lương không quá 06 tháng','Cách chức','Sa thải'];
const DISC_REASONS=['Đi muộn nhiều lần không lý do chính đáng','Vi phạm quy định ATVSLĐ','Tiết lộ bí mật kinh doanh','Tự ý bỏ việc 05 ngày cộng dồn trong 30 ngày','Gây thiệt hại tài sản công ty'];
const DISC_STEPS=['Lập biên bản vi phạm','Họp xử lý (có tổ chức đại diện NLĐ)','Đã ra quyết định','Hết hiệu lực'];
const SENIORITY={5:2000000,10:5000000,15:8000000,20:10000000};
function genRelations(){
  const r=mulberry32(77),act=S.base.filter(e=>e.status!=='Nghỉ việc'&&e.contract!==C_PROB),out=[];
  for(let i=0;i<46;i++){const e=act[Math.floor(r()*act.length)];out.push({id:'RW-26-'+z2(i+1),kind:'reward',emp:e.id,reason:REWARD_REASONS[Math.floor(r()*REWARD_REASONS.length)],amount:[2e6,3e6,5e6,10e6][Math.floor(r()*4)],date:iso(new Date(2026,Math.floor(r()*10),1+Math.floor(r()*27))),status:'Đã chi'})}
  const prd=act.filter(e=>['PRD','SCM','ENG'].includes(e.dept));
  for(let i=0;i<6;i++){const e=(i<4?prd:act)[Math.floor(r()*(i<4?prd:act).length)];const viol=new Date(2026,Math.floor(r()*10),1+Math.floor(r()*27));
    out.push({id:'KL-26-'+z2(i+1),kind:'discipline',emp:e.id,reason:DISC_REASONS[i%DISC_REASONS.length],form:DISC_FORMS[i===5?1:Math.min(2,Math.floor(r()*2))],date:iso(viol),status:DISC_STEPS[i<2?1:i===2?0:2]})}
  return out;
}
S.relBase=genRelations();
function mergedRelations(){const ov=S.col.relations;const out=S.relBase.map(b=>ov[b.id]&&!ov[b.id]._new?{...b,...ov[b.id]}:{...b});for(const[id,d]of Object.entries(ov))if(d._new)out.push({...d,id});return out.filter(x=>!x._deleted)}
function disciplinedIds(m){const T=m.T;return new Set(m.relations.filter(x=>x.kind==='discipline'&&x.status==='Đã ra quyết định'&&x.form!=='Khiển trách'&&days(parse(x.date),T)<=183).map(x=>x.emp))}

/* ----- BHXH tăng / giảm / điều chỉnh trong tháng (mẫu D02-LT) ----- */
function bhxhChanges(m){
  const T=m.T,inM=d=>{const x=d&&parse(d);return x&&x.getFullYear()===T.getFullYear()&&x.getMonth()===T.getMonth()},rows=[];
  const meritThis=Object.values(S.col.merit).filter(x=>inM(iso(new Date(x.at))));
  for(const e of m.emps){
    if(e.status!=='Nghỉ việc'&&e.contract!==C_PROB&&(inM(e.hire)||inM(e.probEnd)))rows.push({type:'Tăng',e,reason:'Ký HĐ lao động chính thức',sal:e.pay?e.pay.insSal:0});
    if(e.status==='Nghỉ việc'&&inM(e.exit))rows.push({type:'Giảm',e,reason:'Chấm dứt HĐ: '+(e.exitReason||''),sal:0});
    const ov=S.col.employees[e.id];
    if(e.status==='Đang làm việc'&&e.pay&&e.contract!==C_PROB&&((ov&&!ov._new&&ov._at&&inM(iso(new Date(ov._at)))&&(ov.p1!=null||ov.comp!=null))||meritThis.some(x=>x.factors&&x.factors[e.id]>0)))rows.push({type:'Điều chỉnh',e,reason:'Điều chỉnh mức lương đóng',sal:e.pay.insSal});
    if(e.status==='Nghỉ thai sản'&&inM(e.matEnd))rows.push({type:'Tăng',e,reason:'Đi làm lại sau thai sản',sal:0});
  }
  return rows;
}

/* ----- Đánh giá công việc theo phương pháp tính điểm (P1) ----- */
const JE_FACTORS=[['je1','Kiến thức & trình độ chuyên môn',25],['je2','Kinh nghiệm cần có',15],['je3','Mức độ phức tạp, giải quyết vấn đề',20],['je4','Phạm vi trách nhiệm & ảnh hưởng',20],['je5','Giao tiếp & quản lý con người',10],['je6','Điều kiện làm việc',10]];
const JE_LEVELS=['','1 – Cơ bản','2 – Trung bình','3 – Khá','4 – Cao','5 – Rất cao'];

/* ----- Văn bản tự động (email tuyển dụng, thư mời nhận việc, quyết định, thông báo) ----- */
const CO='Công ty TNHH Aurora Meridian Group Việt Nam (AMG Việt Nam)';
const TPL=[
 {id:'interview',name:'Thư mời phỏng vấn',who:'cand'},{id:'offer',name:'Thư mời nhận việc',who:'both'},{id:'reject',name:'Thư cảm ơn và từ chối ứng viên',who:'cand'},
 {id:'welcome',name:'Thư chào mừng nhân viên mới',who:'emp'},{id:'probation',name:'Thông báo kết quả thử việc',who:'emp'},{id:'endContract',name:'Thông báo chấm dứt HĐ khi hết hạn',who:'emp'},
 {id:'salary',name:'Quyết định điều chỉnh lương',who:'emp'},{id:'transfer',name:'Quyết định thuyên chuyển công tác',who:'emp'},{id:'ot',name:'Giấy đề nghị làm thêm giờ',who:'emp'},
 {id:'proxy',name:'Giấy ủy quyền nhận lương thay',who:'emp'},{id:'confirm',name:'Xác nhận quá trình làm việc',who:'emp'},{id:'policy',name:'Thông báo thay đổi chính sách',who:'all'},
];
function genDoc(id,o){
  const e=o.e,d=o.date?vn(o.date):vn(today()),sig=`\n\nTrân trọng,\nPhòng Nhân sự – ${CO}`;
  const name=e?e.name:(o.cand||'[Họ tên ứng viên]'),pos=o.pos||(e?e.title:'[Vị trí]'),deptN=e?e.deptName:'';
  const P1=e?e.p1:(o.pos?scaleMid(4):0);
  const hdr=t=>`${CO}\nSố: ......../${new Date().getFullYear()}/AMG-NS\nTP.HCM, ngày ${vn(today())}\n\n${t.toUpperCase()}\n\n`;
  switch(id){
   case'interview':return `Kính gửi Anh/Chị ${name},\n\nCảm ơn Anh/Chị đã ứng tuyển vị trí ${pos} tại ${CO}. Chúng tôi trân trọng mời Anh/Chị tham dự buổi phỏng vấn:\n- Thời gian: ${d}${o.note?' – '+o.note:''}\n- Địa điểm: Trụ sở TP.HCM của AMG Việt Nam (hoặc trực tuyến theo đường link gửi kèm)\n- Mang theo: CV, bản sao bằng cấp, CCCD\n\nVui lòng xác nhận tham dự trước 17h00 ngày làm việc liền trước.${sig}`;
   case'offer':return `Kính gửi Anh/Chị ${name},\n\n${CO} trân trọng mời Anh/Chị nhận việc với các điều kiện sau:\n- Vị trí: ${pos}${deptN&&!pos.includes(deptN)?' – '+deptN:''}${e?' (bậc GS'+z2(e.grade)+')':''}\n- Ngày bắt đầu: ${d}\n- Thời gian thử việc: ${e&&e.probEnd?days(parse(e.hire),parse(e.probEnd)):(e&&e.grade>=9?180:e&&e.grade<=3?30:60)} ngày, hưởng ${P('probPay')}% lương chính thức\n- Lương vị trí (P1): ${fmt(P1)} đồng/tháng; cộng phụ cấp năng lực (P2) và lương hiệu suất (P3) theo quy chế 3P sau thử việc\n- Phụ cấp: ăn ca ${fmt(P('lunch'))}đ, đi lại ${fmt(P('travel'))}đ, điện thoại ${fmt(P('phone'))}đ/tháng\n- Phúc lợi: BHXH, BHYT, BHTN theo luật; bảo hiểm sức khỏe; ${P('leaveBase')} ngày phép năm; thưởng tháng 13 và thưởng hiệu suất\n\nVui lòng phản hồi trong 03 ngày làm việc.${sig}`;
   case'reject':return `Kính gửi Anh/Chị ${name},\n\nCảm ơn Anh/Chị đã dành thời gian ứng tuyển vị trí ${pos}. Sau khi cân nhắc, chúng tôi rất tiếc chưa thể tiếp tục với hồ sơ của Anh/Chị ở thời điểm này. Hồ sơ được lưu trong dữ liệu ứng viên 12 tháng (có sự đồng ý của Anh/Chị theo Luật Bảo vệ dữ liệu cá nhân) để liên hệ khi có vị trí phù hợp.${sig}`;
   case'welcome':return `Chào mừng ${name} gia nhập ${deptN||'AMG Việt Nam'}!\n\nNgày làm việc đầu tiên: ${e?vn(e.hire):d}. Lịch tuần đầu: hội nhập văn hóa và nội quy, nhận thiết bị, gặp người hướng dẫn, huấn luyện ATVSLĐ ban đầu.\nEmail công việc: ${e?e.email:''}\nĐánh giá 30 ngày và kết thúc thử việc: ${e&&e.probEnd?vn(e.probEnd):'theo chương trình thử việc'}.${sig}`;
   case'probation':return hdr('Thông báo kết quả thử việc')+`Kính gửi: Ông/Bà ${name} – ${pos}\n\nCăn cứ Điều 27 Bộ luật Lao động 2019 và kết quả đánh giá thử việc (điểm KPI ${e?e.kpi.toFixed(1):'...'}/5), Công ty thông báo Ông/Bà ĐẠT yêu cầu thử việc. Hợp đồng lao động chính thức có hiệu lực từ ${e&&e.probEnd?vn(addDays(parse(e.probEnd),1)):d}.${sig}`;
   case'endContract':return hdr('Thông báo chấm dứt hợp đồng lao động')+`Kính gửi: Ông/Bà ${name} – ${pos}\n\nHợp đồng lao động xác định thời hạn của Ông/Bà hết hạn ngày ${e&&e.cEnd?vn(e.cEnd):d}. Căn cứ khoản 1 Điều 34 và Điều 45 Bộ luật Lao động 2019, Công ty thông báo chấm dứt hợp đồng khi hết hạn (thông báo trước ít nhất 15 ngày). Công ty sẽ thanh toán đầy đủ quyền lợi và chốt sổ BHXH trong 14 ngày làm việc kể từ ngày chấm dứt.${sig}`;
   case'salary':return hdr('Quyết định điều chỉnh lương')+`Điều 1. Điều chỉnh lương vị trí (P1) của Ông/Bà ${name}, ${pos}, ${deptN}, từ ngày ${d}: ${e?fmt(e.p1):'...'} đồng/tháng, bậc GS${e?z2(e.grade):'..'}.\nĐiều 2. Mức lương đóng BHXH điều chỉnh tương ứng; Phòng Nhân sự báo điều chỉnh với cơ quan BHXH.\nĐiều 3. Các phòng ban liên quan và Ông/Bà có tên tại Điều 1 thi hành quyết định này.\n\nTỔNG GIÁM ĐỐC`;
   case'transfer':return hdr('Quyết định thuyên chuyển công tác')+`Điều 1. Thuyên chuyển Ông/Bà ${name} đến ${deptN} – ${(e&&SITES[e.site]||{}).name||''}, chức danh ${pos}, kể từ ngày ${d}.\nĐiều 2. Quyền lợi theo bậc GS${e?z2(e.grade):'..'}; hai bên ký phụ lục hợp đồng lao động theo Điều 22 BLLĐ 2019.\nĐiều 3. Bàn giao công việc, tài sản trước ngày hiệu lực.\n\nTỔNG GIÁM ĐỐC`;
   case'ot':return hdr('Giấy đề nghị làm thêm giờ')+`Bộ phận: ${deptN}\nNgười làm thêm: ${name} – ${pos}\nNgày: ${d}${o.note?'\nNội dung: '+o.note:''}\nLũy kế đã làm thêm: tháng ${e?e.otM:0}/${P('otMonth')} giờ; năm ${e?e.otY:0}/${e&&e.dept==='PRD'?P('otYearSp'):P('otYear')} giờ (Điều 107 BLLĐ 2019).\nNgười lao động đồng ý làm thêm: ............ (ký)\nQuản lý trực tiếp duyệt: ............ (ký)`;
   case'proxy':return `GIẤY ỦY QUYỀN NHẬN LƯƠNG THAY\n\nTôi: ${name}, mã nhân viên ${e?e.id:'...'}, ${deptN}\nỦy quyền cho: ${o.cand||'[Họ tên, CCCD người được ủy quyền]'}\nNhận thay tiền lương tháng ${today().getMonth()+1}/${today().getFullYear()}: ${e&&e.pay?fmt(e.pay.net)+' đồng':'...'}\nThời hạn ủy quyền: đến ${d}.\n\nNgười ủy quyền ............ Người được ủy quyền ............`;
   case'confirm':return hdr('Xác nhận quá trình làm việc')+`${CO} xác nhận Ông/Bà ${name} làm việc tại Công ty từ ngày ${e?vn(e.hire):'...'}${e&&e.exit?' đến ngày '+vn(e.exit):' đến nay'}, chức danh cuối cùng ${pos}, ${deptN}. Thời gian tham gia BHXH tại Công ty được chốt theo sổ BHXH.${sig}`;
   case'policy':{const h=Object.values(S.col.policyHistory).sort((a,b)=>b.at-a.at)[0];return `Kính gửi toàn thể Cán bộ nhân viên,\n\nPhòng Nhân sự thông báo cập nhật chính sách${h?': '+h.name:''}, hiệu lực từ ${d}.\n${h?Object.keys((h.after&&h.after.values)||{}).filter(k=>(h.before.values||{})[k]!==h.after.values[k]).map(k=>{const p=PARAMS.find(x=>x.k===k);return p?`- ${p.label}: ${fmt((h.before.values||{})[k]??p.v)} → ${fmt(h.after.values[k])} ${p.unit}`:''}).filter(Boolean).join('\n')||'- Xem chi tiết tại mục Chính sách & pháp luật':'- [Nội dung thay đổi]'}\n\nMọi thắc mắc vui lòng liên hệ Phòng Nhân sự.${sig}`}
  }
  return '';
}

/* ----- Gói cập nhật chính sách & pháp luật ----- */
function retireAge(year,g){return g==='Nam'?60+Math.min(24,Math.max(0,year-2020)*3)/12:55+Math.min(60,Math.max(0,year-2020)*4)/12}
const MERIT={A:10,B:7,C:4,D:1,E:0};
const PKGS=[
 {id:'roadmap',name:'Lộ trình pháp luật theo năm hiện tại',law:'Điều 169 BLLĐ 2019; NĐ 135/2020/NĐ-CP',desc:()=>`Tự tính tuổi nghỉ hưu năm ${today().getFullYear()}: nam ${(retireAge(today().getFullYear(),'Nam')).toFixed(2)} tuổi, nữ ${(retireAge(today().getFullYear(),'Nữ')).toFixed(2)} tuổi. Rà soát lại danh sách sắp nghỉ hưu.`,
  values:()=>{const y=today().getFullYear();return{retireM:+retireAge(y,'Nam').toFixed(4),retireF:+retireAge(y,'Nữ').toFixed(4)}},tasks:['Rà soát danh sách NLĐ đủ tuổi nghỉ hưu năm nay, lập kế hoạch kế nhiệm','Thông báo NLĐ sắp nghỉ hưu và hướng dẫn hồ sơ hưởng lương hưu']},
 {id:'mw2026',name:'Lương tối thiểu vùng 2026',law:'NĐ 293/2025/NĐ-CP, hiệu lực 01/01/2026',desc:()=>'Vùng I 5.310.000đ, II 4.730.000đ, III 4.140.000đ, IV 3.700.000đ. Ảnh hưởng trần đóng BHTN và kiểm tra lương tối thiểu.',
  values:()=>({lttv1:5310000,lttv2:4730000,lttv3:4140000,lttv4:3700000}),tasks:['Rà soát NLĐ có lương thấp hơn mức tối thiểu vùng mới','Cập nhật mức đóng BHTN tối đa (20 lần lương tối thiểu vùng)','Công khai thang bảng lương tại nơi làm việc (Điều 93 BLLĐ 2019)']},
 {id:'pit2026',name:'Thuế TNCN: giảm trừ gia cảnh mới & biểu lũy tiến 5 bậc',law:'NQ 110/2025/UBTVQH15; Luật Thuế TNCN (sửa đổi) 2025',desc:()=>'Giảm trừ bản thân 15,5 triệu, người phụ thuộc 6,2 triệu; biểu 5 bậc 5%–10%–20%–30%–35% với ngưỡng 10/30/60/100 triệu.',
  values:()=>({gt_self:15500000,gt_dep:6200000,t1:10000000,t2:30000000,t3:60000000,t4:100000000,r1:5,r2:10,r3:20,r4:30,r5:35}),tasks:['Thông báo NLĐ về mức giảm trừ gia cảnh và biểu thuế mới','Nhắc NLĐ cập nhật đăng ký người phụ thuộc','Cấu hình lại quyết toán thuế TNCN năm']},
 {id:'ins2024',name:'Bảo hiểm bắt buộc theo Luật BHXH 2024',law:'Luật BHXH 2024 (01/07/2025); Luật Việc làm 2025 (01/01/2026); Luật Công đoàn 2024',desc:()=>'Đặt lại tỷ lệ đóng NLĐ 8% / 1,5% / 1% và NSDLĐ 17,5% / 3% / 1%, KPCĐ 2%, trần 20 lần.',
  values:()=>({e_bhxh:8,e_bhyt:1.5,e_bhtn:1,c_bhxh:17.5,c_bhyt:3,c_bhtn:1,kpcd:2,capBHXH:20,capBHTN:20}),tasks:['Đối chiếu bảng kê đóng BHXH tháng với cơ quan BHXH','Rà soát NLĐ thuộc diện bắt buộc mới theo Luật BHXH 2024']},
 {id:'mwX',name:'Kịch bản: điều chỉnh lương tối thiểu vùng',law:'Kịch bản dự báo – chờ Nghị định mới',input:{label:'Mức tăng (%)',def:7.2,step:.1},desc:x=>`Tăng lương tối thiểu cả 4 vùng thêm ${x}% (làm tròn 10.000đ).`,
  values:x=>Object.fromEntries([1,2,3,4].map(v=>['lttv'+v,Math.round(DEF['lttv'+v]*(1+x/100)/10000)*10000])),tasks:['Lập phương án điều chỉnh lương cho NLĐ dưới mức tối thiểu mới','Dự trù ngân sách BHTN tăng thêm']},
 {id:'lcsX',name:'Kịch bản: lương cơ sở mới',law:'Kịch bản dự báo – chờ Nghị định mới',input:{label:'Lương cơ sở mới (đ)',def:2340000,step:10000},desc:x=>`Lương cơ sở ${fmt(x)}đ → trần đóng BHXH, BHYT ${fmt(x*P('capBHXH'))}đ.`,
  values:x=>({lcs:x}),tasks:['Cập nhật trần lương đóng BHXH, BHYT cho nhóm thu nhập cao']},
 {id:'lunchX',name:'Chính sách nội bộ: phụ cấp ăn ca',law:'Quy chế phúc lợi AMG',input:{label:'Mức mới (đ/tháng)',def:900000,step:10000},desc:x=>`Phụ cấp ăn ca ${fmt(x)}đ/người/tháng.`,
  values:x=>({lunch:x}),tasks:['Ban hành thông báo thay đổi phụ cấp ăn ca','Kiểm tra phần vượt mức miễn thuế TNCN (nếu có)']},
 {id:'merit',name:'Xét tăng lương năm theo ma trận hiệu suất',law:'Quy chế lương 3P AMG; Điều 93, 103 BLLĐ 2019',input:{label:'Dịch chuyển thang lương theo thị trường (%)',def:5,step:.5},merit:true,
  desc:x=>`Thang lương P1 dịch chuyển ${x}%. Lương P1 từng người tăng theo xếp loại: A +${MERIT.A}%, B +${MERIT.B}%, C +${MERIT.C}%, D +${MERIT.D}%, E 0%. Không áp dụng cho người đang thử việc hoặc đang chịu kỷ luật kéo dài nâng lương.`,
  values:()=>({}),tasks:['Gửi quyết định điều chỉnh lương cho từng NLĐ (mục Biểu mẫu & văn bản)','Báo điều chỉnh mức đóng BHXH (danh sách BHXH tăng/giảm)','Công khai thang bảng lương mới tại nơi làm việc']},
];
function scaleShift(pct){const o={};for(const g of Object.keys(SCALE_DEF))o[g]=Math.round(scaleMid(Number(g))*(1+pct/100)/10000)*10000;return o}
function meritFactors(){const dis=disciplinedIds(M),f={};for(const e of M.working)if(e.contract!==C_PROB&&!dis.has(e.id)&&MERIT[e.rating]>0)f[e.id]=MERIT[e.rating];return f}
function simulate(pk,x){
  const saved=S.col.settings.policy,savedSim=S.sim;build();
  const before={tot:{...M.tot},below:M.checks.filter(c=>c.type==='minwage').length,crit:M.checks.filter(c=>c.sev==='crit').length};
  const vals=pk.values(x)||{};
  S.col.settings.policy={...(saved||{}),values:{...((saved&&saved.values)||{}),...vals},scale:pk.merit?scaleShift(x):((saved&&saved.scale)||{})};
  S.sim=pk.merit?meritFactors():null;const raised=S.sim?Object.keys(S.sim).length:0;
  build();const after={tot:{...M.tot},below:M.checks.filter(c=>c.type==='minwage').length,crit:M.checks.filter(c=>c.sev==='crit').length};
  S.col.settings.policy=saved;S.sim=savedSim;build();
  return{before,after,vals,raised};
}

/* ----- views of extended modules ----- */
V.training=()=>{
  const m=M,tr=m.train,req=tr.filter(c=>c.req),reqT=sum(req,c=>c.target.length),reqD=sum(req,c=>c.done.length);
  const spent=sum(tr,c=>c.spent),hours=sum(tr,c=>c.hoursDone),saf=tr.filter(c=>c.safety);
  const byDept=DEPTS.map(d=>{const t=sum(req,c=>c.target.filter(e=>e.dept===d.id).length),dn=sum(req,c=>c.done.filter(e=>e.dept===d.id).length);return{l:d.name,v:t?Math.round(dn/t*1000)/10:100}}).sort((a,b)=>a.v-b.v);
  return `
  <div class="kpis">
   ${kpi('Hoàn thành khóa bắt buộc',pct(reqD/Math.max(1,reqT)),`${fmt(reqD)}/${fmt(reqT)} lượt`)}
   ${kpi('Huấn luyện ATVSLĐ',pct(sum(saf,c=>c.done.length)/Math.max(1,sum(saf,c=>c.target.length))),`${sum(saf,c=>c.pending.length)} người chưa huấn luyện`,sum(saf,c=>c.pending.length)?'crit':'')}
   ${kpi('Giờ đào tạo đã thực hiện',fmt(hours),`${(hours/Math.max(1,m.working.length)).toFixed(1)} giờ/người`)}
   ${kpi('Chi phí đào tạo',fmtB(spent),`Ngân sách năm ${fmtB(P('training'))} · đã dùng ${pct(spent/P('training'),0)}`,spent>P('training')?'crit':'')}
  </div>
  ${panel('Kế hoạch đào tạo '+m.Y,tbl(['Mã','Khóa học','Hình thức',['Giờ'],['Đối tượng'],['Hoàn thành'],'Tỷ lệ',['Chi phí'],'Căn cứ',''],tr.map(c=>`<tr><td class="mono">${c.id}</td><td><b>${esc(c.name)}</b> ${c.req?pill('Bắt buộc',c.safety?'crit':'warn'):pill('Phát triển','info')}</td><td class="small">${esc(c.type)}</td><td class="n">${c.hours}</td><td class="n">${c.target.length}</td><td class="n">${c.done.length}</td><td><div class="prog"><i style="width:${(c.rate*100).toFixed(0)}%"></i></div><span class="small muted">${pct(c.rate,0)}</span></td><td class="n">${fmtM(c.spent)}</td><td class="small">${esc(c.law||'')}</td><td><button class="btn sm" data-act="trainOpen" data-id="${c.id}"${lock()}>Ghi nhận</button></td></tr>`)),{sub:'Theo Quy trình đào tạo, đào tạo nội bộ và thuê ngoài. Khóa ATVSLĐ chưa hoàn thành tự động thành cảnh báo tuân thủ.'})}
  <div class="grid g2" style="margin-top:16px">
   ${panel('Tỷ lệ hoàn thành khóa bắt buộc theo khối (%)',hbars(byDept,{f:v=>v.toLocaleString('vi-VN'),color:'var(--c5)',max:100}))}
   ${panel('Quy trình đào tạo',`<div class="list small">${[['Xác định nhu cầu','Từ đánh giá KPI, khung năng lực P2, yêu cầu pháp luật (ATVSLĐ)'],['Lập kế hoạch & ngân sách','Kế hoạch năm, phê duyệt ngân sách '+fmtB(P('training'))],['Tổ chức','Nội bộ: phân công giảng viên; thuê ngoài: chọn đơn vị, ký hợp đồng'],['Đánh giá sau đào tạo','Bài kiểm tra, phản hồi, áp dụng vào công việc sau 3 tháng'],['Lưu hồ sơ','Danh sách, chứng chỉ; sổ theo dõi huấn luyện ATVSLĐ lưu theo NĐ 44/2016']].map(([a,b],i)=>`<div class="sev info"><div><b>${i+1}. ${a}</b><div>${esc(b)}</div></div></div>`).join('')}</div>`)}
  </div>`;
};
V.lifecycle=()=>{
  const{onb,offb}=M.life;
  const row=(x,kind)=>`<tr class="click" data-act="lcOpen" data-kind="${kind}" data-id="${x.e.id}"><td class="mono">${x.e.id}</td><td><b>${esc(x.e.name)}</b><div class="small muted">${esc(x.e.title)}</div></td><td>${esc(x.e.deptName)}</td><td>${vn(kind==='onb'?x.e.hire:x.base)}</td><td><div class="prog"><i style="width:${(x.done/x.items.length*100).toFixed(0)}%"></i></div><span class="small muted">${x.done}/${x.items.length}</span></td><td>${x.over.length?pill(x.over.length+' bước quá hạn','crit'):pill('Đúng tiến độ','ok')}</td></tr>`;
  return `
  <div class="kpis">
   ${kpi('Đang onboarding',onb.length,'Nhân viên vào làm trong 120 ngày')}
   ${kpi('Onboarding quá hạn',onb.filter(x=>x.over.length).length,'Người có bước trễ',onb.some(x=>x.over.length)?'crit':'')}
   ${kpi('Đang offboarding',offb.length,'Nghỉ việc trong 60 ngày hoặc đã nộp đơn')}
   ${kpi('Offboarding quá hạn',offb.filter(x=>x.over.length).length,'Thanh toán, chốt sổ BHXH trễ',offb.some(x=>x.over.length)?'crit':'')}
  </div>
  ${panel('Onboarding & thử việc',tbl(['Mã','Nhân viên','Khối','Ngày vào','Tiến độ','Trạng thái'],onb.sort((a,b)=>b.over.length-a.over.length).map(x=>row(x,'onb'))),{sub:'Theo Thủ tục nhận việc, Chương trình thử việc và Ebook Onboarding. Bấm một dòng để đánh dấu từng bước.'})}
  ${panel('Offboarding & nghỉ việc',tbl(['Mã','Nhân viên','Khối','Ngày nghỉ','Tiến độ','Trạng thái'],offb.sort((a,b)=>b.over.length-a.over.length).map(x=>row(x,'offb'))),{sub:'Theo Quy trình xử lý xin thôi việc, nghỉ việc, quản lý tài sản; Điều 48 BLLĐ 2019 (thanh toán trong 14 ngày làm việc).',cls:'mt'})}`;
};
V.relations=()=>{
  const m=M,T=m.T,rel=m.relations,emp=Object.fromEntries(m.emps.map(e=>[e.id,e]));
  const rw=rel.filter(x=>x.kind==='reward'&&parse(x.date).getFullYear()===m.Y),dc=rel.filter(x=>x.kind==='discipline');
  const sen=m.active.filter(e=>{const y=m.Y-parse(e.hire).getFullYear();return SENIORITY[y]&&e.contract!==C_PROB}).map(e=>({e,y:m.Y-parse(e.hire).getFullYear(),date:iso(new Date(m.Y,parse(e.hire).getMonth(),parse(e.hire).getDate()))}));
  return `
  <div class="kpis">
   ${kpi('Khen thưởng '+m.Y,rw.length,`Tổng ${fmtM(sum(rw,x=>x.amount))}`)}
   ${kpi('Thưởng thâm niên '+m.Y,sen.length,`Tổng ${fmtM(sum(sen,x=>SENIORITY[x.y]))}`)}
   ${kpi('Hồ sơ kỷ luật',dc.length,`${dc.filter(x=>x.status!=='Đã ra quyết định'&&x.status!=='Hết hiệu lực').length} đang xử lý`)}
   ${kpi('Đang chịu kỷ luật hiệu lực',disciplinedIds(m).size,'Không xét tăng lương năm')}
  </div>
  <div class="grid g2">
   ${panel('Khen thưởng theo khối',hbars(DEPTS.map(d=>({l:d.name,v:rw.filter(x=>(emp[x.emp]||{}).dept===d.id).length})).sort((a,b)=>b.v-a.v),{color:'var(--c3)'}))}
   ${panel('Khen thưởng theo lý do',donut(countBy(rw,x=>x.reason).sort((a,b)=>b.v-a.v)))}
  </div>
  ${panel('Hồ sơ kỷ luật lao động',tbl(['Mã','Nhân viên','Hành vi vi phạm','Hình thức','Ngày vi phạm','Thời hiệu còn','Trạng thái',''],dc.map(x=>{const e=emp[x.emp]||{};const left=183-days(parse(x.date),T);const fin=x.status==='Đã ra quyết định'||x.status==='Hết hiệu lực';return `<tr><td class="mono">${x.id}</td><td>${esc(e.name||x.emp)}<div class="small muted">${esc(e.deptName||'')}</div></td><td class="small">${esc(x.reason)}</td><td class="small">${esc(x.form)}</td><td>${vn(x.date)}</td><td class="n">${fin?'—':left<0?'<b style="color:var(--crit)">Hết</b>':left+' ngày'}</td><td>${pill(x.status,fin?'mute':left<30?'crit':'warn')}</td><td>${fin?'':`<button class="btn sm" data-act="discNext" data-id="${x.id}"${lock()}>Bước tiếp</button>`}</td></tr>`})),{sub:'Điều 122–125 BLLĐ 2019: thời hiệu 06 tháng (12 tháng với vi phạm về tài chính, bí mật kinh doanh); phải họp xử lý có tổ chức đại diện NLĐ; không phạt tiền thay kỷ luật.',act:`<button class="btn sm pri" data-act="relNew"${lock()}>Thêm khen thưởng / kỷ luật</button>`,cls:'mt'})}
  <div class="grid g2" style="margin-top:16px">
   ${panel('Danh sách khen thưởng '+m.Y,tbl(['Mã','Nhân viên','Lý do',['Số tiền'],'Ngày'],rw.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,60).map(x=>`<tr><td class="mono">${x.id}</td><td>${esc((emp[x.emp]||{}).name||x.emp)}</td><td class="small">${esc(x.reason)}</td><td class="n">${fmt(x.amount)}</td><td>${vn(x.date)}</td></tr>`)))}
   ${panel('Thưởng thâm niên tự động '+m.Y,tbl(['Nhân viên','Khối',['Năm'],['Mức thưởng'],'Ngày tròn năm'],sen.sort((a,b)=>a.date.localeCompare(b.date)).map(x=>`<tr><td>${esc(x.e.name)}</td><td>${esc(x.e.deptName)}</td><td class="n">${x.y}</td><td class="n">${fmt(SENIORITY[x.y])}</td><td>${vn(x.date)} ${parse(x.date)<=T?pill('Đến hạn','ok'):''}</td></tr>`)),{sub:'Theo chính sách thưởng thâm niên: 5 năm 2 triệu, 10 năm 5 triệu, 15 năm 8 triệu, 20 năm 10 triệu'})}
  </div>`;
};
V.docs=()=>{
  const f=S.f,tp=TPL.find(t=>t.id===(f.d_tpl||'offer'))||TPL[1];
  return `
  ${panel('Tạo văn bản nhân sự',`<div class="form">
    <label>Mẫu văn bản<select id="d_tpl" data-f="d_tpl">${optHtml(TPL.map(t=>[t.id,t.name]),tp.id)}</select></label>
    <label>Mã nhân viên ${tp.who==='cand'?'(không cần)':''}<input id="d_emp" data-f="d_emp" list="empList" value="${esc(f.d_emp||'')}" placeholder="VD: AMG-0042"></label>
    <label>${tp.id==='proxy'?'Người được ủy quyền':'Tên ứng viên (nếu chưa có hồ sơ)'}<input id="d_cand" data-f="d_cand" value="${esc(f.d_cand||'')}"></label>
    <label>Vị trí / chức danh<input id="d_pos" data-f="d_pos" value="${esc(f.d_pos||'')}" placeholder="Để trống: lấy từ hồ sơ"></label>
    <label>Ngày hiệu lực / ngày hẹn<input id="d_date" data-f="d_date" type="date" value="${esc(f.d_date||iso(today()))}"></label>
    <label>Ghi chú thêm<input id="d_note" data-f="d_note" value="${esc(f.d_note||'')}"></label>
   </div>
   <datalist id="empList">${M.active.slice(0,500).map(e=>`<option value="${e.id}">${esc(e.name)} – ${esc(e.title)}</option>`).join('')}</datalist>
   <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn pri" data-act="docGen">Tạo văn bản</button><button class="btn" data-act="docCopy"${S.docText?'':' disabled'}>Sao chép</button><button class="btn" data-act="docSave"${S.docText?'':' disabled'}>Tải về (.txt)</button></div>
   ${S.docText?`<textarea id="d_out" readonly style="width:100%;min-height:340px;margin-top:12px;border:1px solid var(--line);border-radius:8px;padding:12px;background:var(--surface-2);color:var(--ink);font:13.5px/1.6 var(--f-body)">${esc(S.docText)}</textarea>`:''}`,{sub:'Lấy dữ liệu trực tiếp từ hồ sơ, bảng lương và chính sách hiện hành. Dựa trên các mẫu email tuyển dụng, thư mời nhận việc và biểu mẫu trong folder.'})}
  ${panel('Danh mục mẫu',`<div class="lib">${[['Tuyển dụng','Thư mời phỏng vấn, thư mời nhận việc, thư cảm ơn và từ chối'],['Hội nhập & thử việc','Thư chào mừng, thông báo kết quả thử việc'],['Hợp đồng & lương','Quyết định điều chỉnh lương, thuyên chuyển, thông báo chấm dứt HĐ'],['Chấm công & lương','Giấy đề nghị làm thêm giờ, ủy quyền nhận lương thay'],['Hành chính','Xác nhận quá trình làm việc, thông báo thay đổi chính sách']].map(([g,i])=>`<div class="grp"><b>${g}</b><div class="small muted">${i}</div></div>`).join('')}</div>`,{cls:'mt'})}`;
};

function attendancePanel(){
  const w=M.working.filter(e=>e.att),T=M.T;
  const rows=DEPTS.map(d=>{const a=w.filter(e=>e.dept===d.id);const std=sum(a,e=>e.att.std),act=sum(a,e=>e.att.actual);return `<tr><td>${esc(d.name)}</td><td class="n">${a.length}</td><td class="n">${fmt(std)}</td><td class="n">${fmt(act)}</td><td class="n">${pct(act/Math.max(1,std))}</td><td class="n">${sum(a,e=>e.att.late)}</td><td class="n">${sum(a,e=>e.att.leave)}</td><td class="n">${sum(a,e=>e.att.sick)}</td><td class="n">${sum(a,e=>e.att.unpaid)}</td></tr>`});
  const lateTop=[...w].sort((a,b)=>b.att.late-a.att.late).filter(e=>e.att.late>=4).slice(0,12);
  return `<div class="grid g12" style="margin-top:16px">${panel(`Bảng tổng hợp chấm công tháng ${T.getMonth()+1}/${T.getFullYear()} (đến ${vn(T)})`,tbl(['Khối',['NV'],['Công chuẩn'],['Công thực tế'],['Chuyên cần'],['Đi muộn'],['Nghỉ phép'],['Nghỉ ốm'],['Không lương']],rows,`<tr><td>Tổng</td><td class="n">${w.length}</td><td class="n">${fmt(sum(w,e=>e.att.std))}</td><td class="n">${fmt(sum(w,e=>e.att.actual))}</td><td class="n">${pct(sum(w,e=>e.att.actual)/Math.max(1,sum(w,e=>e.att.std)))}</td><td class="n">${sum(w,e=>e.att.late)}</td><td class="n">${sum(w,e=>e.att.leave)}</td><td class="n">${sum(w,e=>e.att.sick)}</td><td class="n">${sum(w,e=>e.att.unpaid)}</td></tr>`),{sub:'Theo mẫu tổng hợp dữ liệu chấm công. Ngày nghỉ ốm (BHXH chi trả) và nghỉ không lương được trừ thẳng vào bảng lương.'})}
  ${panel('Đi muộn từ 4 lần trong tháng',tbl(['Mã','Họ tên',['Lần']],lateTop.map(e=>`<tr class="click" data-act="emp" data-id="${e.id}"><td class="mono">${e.id}</td><td>${esc(e.name)}</td><td class="n">${e.att.late}</td></tr>`)),{sub:'Căn cứ nội quy để nhắc nhở; lặp lại có thể lập biên bản (mục Khen thưởng & kỷ luật)'})}</div>`;
}
function jobEvalPanel(){
  const f=S.f;let pts=0;
  const sel=JE_FACTORS.map(([k,l,w])=>{const lv=Number(f[k]||3);pts+=w*lv;return `<label>${esc(l)} (trọng số ${w}%)<select id="${k}" data-f="${k}">${optHtml([1,2,3,4,5].map(v=>[v,JE_LEVELS[v]]),lv)}</select></label>`}).join('');
  const g=Math.max(1,Math.min(13,Math.round(1+(pts-100)/400*12))),mid=scaleMid(g);
  return panel('Đánh giá công việc theo phương pháp tính điểm',`<div class="grid g12" style="gap:16px"><div class="form">${sel}</div><div class="kv"><div>Tổng điểm (100–500)</div><div><b>${pts}</b></div><div>Bậc công việc đề xuất</div><div><b>GS${z2(g)}</b></div><div>Nhóm</div><div>${GROUP(g)}</div><div>Khoảng lương P1</div><div>${fmt(mid*.8)} – ${fmt(mid*1.2)}</div><div>Điểm giữa</div><div>${fmt(mid)}</div><div>Nhân viên hiện có ở bậc này</div><div>${M.working.filter(e=>e.grade===g).length}</div></div></div>`,{sub:'Theo "Biểu mẫu đánh giá công việc theo phương pháp tính điểm" (3P). Dùng khi tạo vị trí mới hoặc xếp lại bậc.',cls:'mt'});
}
function bhxhPanel(){
  const rows=bhxhChanges(M),T=M.T;
  return panel(`Danh sách báo tăng / giảm / điều chỉnh BHXH tháng ${T.getMonth()+1}/${T.getFullYear()}`,tbl(['Loại','Mã','Họ tên','Khối',['Mức lương đóng'],'Lý do'],rows.map(r=>`<tr class="click" data-act="emp" data-id="${r.e.id}"><td>${pill(r.type,r.type==='Tăng'?'ok':r.type==='Giảm'?'crit':'info')}</td><td class="mono">${r.e.id}</td><td>${esc(r.e.name)}</td><td>${esc(r.e.deptName)}</td><td class="n">${r.sal?fmt(r.sal):'—'}</td><td class="small">${esc(r.reason)}</td></tr>`)),{sub:'Lập tự động từ hồ sơ để kê khai mẫu D02-LT với cơ quan BHXH (hạn: trước ngày cuối tháng). Người thử việc theo hợp đồng thử việc riêng không thuộc diện.',act:`<button class="btn sm" data-act="exportBhxh">Xuất CSV</button>`,cls:'mt'});
}
function reportData(r){
  const m=M,T=m.T,a=m.active,vnN=a.filter(e=>!e.expat),cnt=(arr,f)=>countBy(arr,f).map(x=>[x.l,x.v]);
  const prevM=new Date(T.getFullYear(),T.getMonth()-1,1),inPrev=d=>{const x=d&&parse(d);return x&&x.getFullYear()===prevM.getFullYear()&&x.getMonth()===prevM.getMonth()};
  switch(r.id){
   case'R1':{const up=m.emps.filter(e=>inPrev(e.hire)),down=m.emps.filter(e=>e.status==='Nghỉ việc'&&inPrev(e.exit));return{rows:[['Kỳ báo cáo',`Tháng ${prevM.getMonth()+1}/${prevM.getFullYear()}`],['Số lao động tăng',up.length],['Số lao động giảm',down.length],['Tổng lao động cuối kỳ',a.length]],list:[['Loại','Mã','Họ tên','Ngày'],...up.map(e=>['Tăng',e.id,e.name,e.hire]),...down.map(e=>['Giảm',e.id,e.name,e.exit])]}}
   case'R2':return{rows:[['Tổng số lao động',a.length],['Lao động nữ',a.filter(e=>e.gender==='Nữ').length],['Lao động nước ngoài',a.filter(e=>e.expat).length],...cnt(a,e=>'HĐ: '+e.contract),...cnt(a,e=>'Trình độ: '+e.edu),['Tăng từ đầu năm',m.hiresY.length],['Giảm từ đầu năm',m.exitsY.length]]};
   case'R3':return{rows:[['Tổng số lao động',a.length],['Số vụ tai nạn lao động',0],['Số người bị nạn',0],['Số người chết',0],['Thiệt hại (đồng)',0],['Ghi chú','Không ghi nhận TNLĐ trong kỳ (dữ liệu mô phỏng)']]};
   case'R4':return{rows:[['Tổng số lao động',a.length],['Lao động làm nghề nặng nhọc, độc hại',a.filter(e=>['PRD','ENG'].includes(e.dept)&&e.grade<=4).length],['Khám sức khỏe định kỳ','100% theo kế hoạch'],['Bệnh nghề nghiệp',0],['Nghỉ ốm trong tháng (ngày)',sum(m.working,e=>e.att?e.att.sick:0)]]};
   case'R5':{const saf=m.train.filter(c=>c.safety);return{rows:[['Tổng số lao động',a.length],['Đã huấn luyện ATVSLĐ',sum(saf,c=>c.done.length)],['Chưa huấn luyện',sum(saf,c=>c.pending.length)],['Chi phí huấn luyện ATVSLĐ (đồng)',sum(saf,c=>c.spent)],['Chi phí bảo hộ lao động / tháng (đồng)',costLines(m).lines.find(l=>l[0]==='4')[2]],['Số vụ TNLĐ',0]]}}
   case'R6':{const p=m.payroll.filter(e=>e.pay.insTN>0);return{rows:[['Số NLĐ tham gia BHTN',p.length],['Quỹ lương đóng BHTN / tháng (đồng)',Math.round(sum(p,e=>e.pay.insTN))],['Số NLĐ chấm dứt HĐ từ đầu năm',m.exitsY.length],['Lao động nước ngoài (không thuộc diện BHTN)',a.filter(e=>e.expat).length]]}}
   case'R7':{const f=a.filter(e=>e.expat);return{rows:[['Số lao động nước ngoài',f.length],...cnt(f,e=>'Quốc tịch: '+e.nat)],list:[['Mã','Họ tên','Quốc tịch','Chức danh','Hết hạn GPLĐ'],...f.map(e=>[e.id,e.name,e.nat,e.title,e.wp])]}}
  }
  return{rows:[['Không áp dụng',r.na||'—']]};
}
function reportPanel(){
  return panel('Lập số liệu báo cáo bắt buộc',`<div style="display:flex;gap:8px;flex-wrap:wrap">${M.reports.filter(r=>!r.na).map(r=>`<button class="btn sm" data-act="repOpen" data-id="${r.id}">${esc(r.name.replace(/^Báo cáo /,''))}</button>`).join('')}</div>`,{sub:'Tự tổng hợp số liệu từ hồ sơ, chấm công, đào tạo và bảng lương để điền vào mẫu báo cáo tương ứng',cls:'mt'});
}
function pkgPanel(){
  const pk=PKGS.find(p=>p.id===(S.f.pkg||'roadmap'))||PKGS[0];
  const x=pk.input?Number(S.f.pkgX!==undefined&&S.f.pkgX!==''?S.f.pkgX:pk.input.def):null;
  const sim=simulate(pk,x),B=sim.before,A=sim.after;
  const diffs=Object.entries(sim.vals).map(([k,v])=>{const p=PARAMS.find(q=>q.k===k);return{p,cur:P(k),v}}).filter(d=>d.p);
  const d=(a,b)=>{const v=b-a;return `<span style="color:${v>0?'var(--crit)':v<0?'var(--ok)':'var(--muted)'}">${v>0?'+':''}${fmtM(v)}</span>`};
  const hist=Object.entries(S.col.policyHistory).map(([id,h])=>({id,...h})).sort((a,b)=>b.at-a.at).slice(0,12);
  const y=today().getFullYear(),road=Math.abs(P('retireM')-retireAge(y,'Nam'))>.005||Math.abs(P('retireF')-retireAge(y,'Nữ'))>.005;
  return `${road?`<div class="banner warn">Lộ trình tuổi nghỉ hưu năm ${y} chưa được áp dụng (đang dùng nam ${P('retireM')}, nữ ${P('retireF')}). <button class="btn sm" data-act="pkgQuick" data-id="roadmap"${lockAdmin()}>Áp dụng ngay</button></div>`:''}
  ${panel('Cập nhật chính sách & pháp luật theo gói',`
   <div class="grid g2" style="gap:16px">
    <div style="display:flex;flex-direction:column;gap:10px">
     <div class="form"><label class="full">Chọn gói cập nhật<select id="pkg" data-f="pkg">${optHtml(PKGS.map(p=>[p.id,p.name]),pk.id)}</select></label>
     ${pk.input?`<label class="full">${esc(pk.input.label)}<input id="pkgX" data-f="pkgX" type="number" step="${pk.input.step}" value="${x}"></label>`:''}</div>
     <div class="small">${esc(pk.desc(x))}</div><div class="small muted">Căn cứ: ${esc(pk.law)}</div>
     ${diffs.length?tbl(['Tham số',['Hiện tại'],['Sau cập nhật']],diffs.map(q=>`<tr><td class="small">${esc(q.p.label)}</td><td class="n">${fmtV(q.cur)}</td><td class="n" style="${q.cur!==q.v?'font-weight:700':''}">${fmtV(q.v)}</td></tr>`)):''}
     <div class="small muted">Khi áp dụng: lưu lịch sử để hoàn tác, tạo ${pk.tasks.length} việc cần làm, ghi nhật ký, tính lại toàn hệ thống${sheetCfg().auto?' và đẩy lên Google Sheets':''}.</div>
     <div><button class="btn pri" data-act="pkgApply"${lockAdmin()}>Áp dụng gói</button></div>
    </div>
    <div>${tbl(['Tác động / tháng',['Trước'],['Sau'],['Chênh lệch']],[['Quỹ lương gross','gross'],['Bảo hiểm NLĐ đóng','insE'],['Thuế TNCN','tax'],['Thực lĩnh','net'],['Bảo hiểm NSDLĐ đóng','insC'],['Chi phí công ty','cost']].map(([l,k])=>`<tr><td>${l}</td><td class="n">${fmtM(B.tot[k])}</td><td class="n">${fmtM(A.tot[k])}</td><td class="n">${d(B.tot[k],A.tot[k])}</td></tr>`).concat([`<tr><td>NLĐ dưới lương tối thiểu</td><td class="n">${B.below}</td><td class="n">${A.below}</td><td class="n">${A.below-B.below}</td></tr>`,`<tr><td>Cảnh báo khẩn</td><td class="n">${B.crit}</td><td class="n">${A.crit}</td><td class="n">${A.crit-B.crit}</td></tr>`]).concat(pk.merit?[`<tr><td>Số người được tăng lương</td><td></td><td class="n">${sim.raised}</td><td></td></tr>`]:[]))}
     <div class="small muted" style="margin-top:6px">Mô phỏng trên dữ liệu hiện tại, chưa lưu.</div></div>
   </div>`,{sub:'Chọn gói, xem trước tác động, bấm áp dụng. Chỉ Editor hoặc chủ sở hữu được áp dụng.'})}
  ${hist.length?panel('Lịch sử cập nhật chính sách',tbl(['Thời điểm','Gói','Người áp dụng',['Δ chi phí/tháng'],''],hist.map(h=>`<tr><td class="small">${new Date(h.at).toLocaleString('vi-VN')}</td><td>${esc(h.name)}${h.x!=null?` <span class="muted small">(${h.x})</span>`:''}</td><td>${esc(nameOf(h.by))}</td><td class="n">${h.impact?fmtM(h.impact.dCost):'—'}</td><td>${h.rolledBack?pill('Đã hoàn tác','mute'):`<button class="btn sm" data-act="pkgRollback" data-id="${h.id}"${lockAdmin()}>Hoàn tác</button>`}</td></tr>`)),{cls:'mt'}):''}`;
}
function trainDrawer(cid){
  const c=M.train.find(x=>x.id===cid);if(!c)return;
  openDrawer(`<div class="dh"><div><h2 style="font-size:19px">${esc(c.name)}</h2><div class="small muted">${c.done.length}/${c.target.length} đã hoàn thành · ${esc(c.law||c.type)}</div></div><button class="btn sm" data-act="close">Đóng</button></div>
   <div class="panel"><header><h3>Chưa hoàn thành (${c.pending.length})</h3><div class="act"><button class="btn sm" data-act="trainAll">Chọn tất cả</button></div></header>
   <div class="list" style="max-height:52vh;overflow:auto">${c.pending.map(e=>`<label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" class="tc" value="${e.id}"> <span class="mono small">${e.id}</span> ${esc(e.name)} <span class="muted small">· ${esc(e.deptName)}</span></label>`).join('')||'<p class="muted">Tất cả đã hoàn thành.</p>'}</div>
   <div style="margin-top:12px"><button class="btn pri" data-act="trainSave" data-id="${c.id}"${lock()}>Ghi nhận hoàn thành ngày ${vn(today())}</button></div></div>`);
}
function lcDrawer(kind,id){
  const x=(kind==='onb'?M.life.onb:M.life.offb).find(z=>z.e.id===id);if(!x)return;
  openDrawer(`<div class="dh"><div><h2 style="font-size:19px">${kind==='onb'?'Onboarding':'Offboarding'}: ${esc(x.e.name)}</h2><div class="small muted">${esc(x.e.id)} · ${esc(x.e.title)} · ${kind==='onb'?'vào làm '+vn(x.e.hire):'nghỉ việc '+vn(x.base)}</div></div><button class="btn sm" data-act="close">Đóng</button></div>
   <div class="panel"><div class="list">${x.items.map(i=>`<div class="sev ${i.done?'':i.over?'crit':'info'}"><div><b style="${i.done?'text-decoration:line-through;opacity:.6':''}">${esc(i.l)}</b><div class="small muted">Hạn ${vn(i.due)}</div></div><button class="btn sm" data-act="lcToggle" data-kind="${kind}" data-id="${id}" data-k="${i.k}"${lock()}>${i.done?'Bỏ đánh dấu':'Hoàn thành'}</button></div>`).join('')}</div></div>
   ${kind==='onb'?`<div><button class="btn" data-act="docFor" data-tpl="welcome" data-id="${id}">Tạo thư chào mừng</button> <button class="btn" data-act="docFor" data-tpl="probation" data-id="${id}">Tạo thông báo kết quả thử việc</button></div>`:`<div><button class="btn" data-act="docFor" data-tpl="confirm" data-id="${id}">Tạo xác nhận quá trình làm việc</button></div>`}`);
}
function relDrawer(){
  openDrawer(`<div class="dh"><div><h2 style="font-size:19px">Thêm khen thưởng / kỷ luật</h2></div><button class="btn sm" data-act="close">Đóng</button></div>
   <div class="panel"><div class="form">
    <label>Loại<select id="rl_kind">${optHtml([['reward','Khen thưởng'],['discipline','Kỷ luật']],'reward')}</select></label>
    <label>Mã nhân viên<input id="rl_emp" list="empList2" placeholder="AMG-0001"></label>
    <label class="full">Lý do / hành vi<select id="rl_reason">${optHtml([...REWARD_REASONS,...DISC_REASONS].map(x=>[x,x]),REWARD_REASONS[0])}</select></label>
    <label>Số tiền thưởng (đ)<input id="rl_amount" type="number" step="500000" value="3000000"></label>
    <label>Hình thức kỷ luật<select id="rl_form">${optHtml(DISC_FORMS.map(x=>[x,x]),DISC_FORMS[0])}</select></label>
    <label>Ngày<input id="rl_date" type="date" value="${iso(today())}"></label>
   </div><datalist id="empList2">${M.active.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('')}</datalist>
   <div style="margin-top:12px"><button class="btn pri" data-act="relSave">Lưu</button></div></div>`);
}
function repDrawer(id){
  const r=M.reports.find(x=>x.id===id);if(!r)return;const d=reportData(r);S.repCache={r,d};
  openDrawer(`<div class="dh"><div><h2 style="font-size:19px">${esc(r.name)}</h2><div class="small muted">Hạn ${vn(r.next)} · ${esc(r.basis)} · nơi nhận: ${esc(r.to)}</div></div><button class="btn sm" data-act="close">Đóng</button></div>
   <div class="panel">${tbl(['Chỉ tiêu',['Giá trị']],d.rows.map(([a,b])=>`<tr><td>${esc(a)}</td><td class="n">${typeof b==='number'?fmt(b):esc(b)}</td></tr>`))}</div>
   ${d.list&&d.list.length>1?`<div class="panel">${tbl(d.list[0],d.list.slice(1).map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`))}</div>`:''}
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="repExport">Xuất CSV</button><button class="btn pri" data-act="file" data-key="${r.key}"${lock()}>${r.filed?'Bỏ đánh dấu đã nộp':'Đánh dấu đã nộp kỳ '+vn(r.next)}</button></div>
   <p class="small muted">Mẫu biểu: ${esc(r.file)}. Số liệu lấy từ dữ liệu trang tại ${new Date().toLocaleString('vi-VN')}.</p>`);
}

/* wrap existing views with the new panels */
{const _t=V.time;V.time=()=>_t()+attendancePanel();
 const _p=V.payroll;V.payroll=()=>_p()+jobEvalPanel();
 const _c=V.compliance;V.compliance=()=>_c()+reportPanel()+bhxhPanel();
 const _po=V.policy;V.policy=()=>pkgPanel()+'<div style="height:16px"></div>'+_po();}

/* extra Google Sheets tabs */
Object.assign(TAB,{att:'Chấm công',train:'Đào tạo',life:'Onboarding – Offboarding',rel:'Khen thưởng – Kỷ luật',bhxh:'BHXH tăng giảm'});
{const _st=sheetTabs;sheetTabs=function(m){const t=_st(m),emp=Object.fromEntries(m.emps.map(e=>[e.id,e]));
  t[TAB.att]=[['Mã','Họ tên','Khối','Công chuẩn','Công thực tế','Đi muộn','Nghỉ phép','Nghỉ ốm','Không lương'],...m.working.filter(e=>e.att).map(e=>[e.id,e.name,e.deptName,e.att.std,e.att.actual,e.att.late,e.att.leave,e.att.sick,e.att.unpaid])];
  t[TAB.train]=[['Mã khóa','Khóa học','Bắt buộc','Đối tượng','Hoàn thành','Tỷ lệ (%)','Chi phí','Căn cứ'],...m.train.map(c=>[c.id,c.name,c.req?'Có':'Không',c.target.length,c.done.length,+(c.rate*100).toFixed(1),c.spent,c.law||''])];
  t[TAB.life]=[['Loại','Mã','Họ tên','Khối','Ngày mốc','Bước đã xong','Tổng bước','Bước quá hạn'],...m.life.onb.map(x=>['Onboarding',x.e.id,x.e.name,x.e.deptName,x.e.hire,x.done,x.items.length,x.over.map(i=>i.l).join('; ')]),...m.life.offb.map(x=>['Offboarding',x.e.id,x.e.name,x.e.deptName,x.base,x.done,x.items.length,x.over.map(i=>i.l).join('; ')])];
  t[TAB.rel]=[['Mã','Loại','Mã NV','Họ tên','Lý do','Số tiền / Hình thức','Ngày','Trạng thái'],...m.relations.map(x=>[x.id,x.kind==='reward'?'Khen thưởng':'Kỷ luật',x.emp,(emp[x.emp]||{}).name||'',x.reason,x.kind==='reward'?x.amount:x.form,x.date,x.status])];
  t[TAB.bhxh]=[['Loại','Mã','Họ tên','Khối','Mức lương đóng','Lý do'],...bhxhChanges(m).map(r=>[r.type,r.e.id,r.e.name,r.e.deptName,Math.round(r.sal),r.reason])];
  return t}}

/* ============ render ============ */
let rq=0;
function scheduleRender(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;render()})}
function render(){
  build();
  const v=V[S.view]?S.view:'overview';
  const crit=M.checks.filter(c=>c.sev==='crit').length,openT=M.tasks.filter(t=>t.status!=='done').length;
  $('#nav').innerHTML=VIEWS.map(([id,l])=>`<button data-act="go" data-v="${id}"${id===v?' aria-current="page"':''}><span>${l}</span>${id==='compliance'&&crit?`<span class="cnt hot">${crit}</span>`:id==='recruit'?`<span class="cnt">${M.openReqs.length}</span>`:id==='people'?`<span class="cnt">${M.active.length}</span>`:id==='automation'&&openT?`<span class="cnt">${openT}</span>`:''}</button>`).join('');
  $('#vtitle').innerHTML=`<span class="crumb">AMG Việt Nam · HR Analytics</span>${esc(VIEWS.find(x=>x[0]===v)[1])}`;
  const ae=document.activeElement,aid=ae&&ae.id,sel=ae&&ae.selectionStart;
  const sy=window.scrollY;
  $('#view').innerHTML=V[v]();
  document.querySelectorAll('#view .panel.mt').forEach(p=>p.style.marginTop='16px');
  if(aid){const el=document.getElementById(aid);if(el&&el!==document.body){el.focus();try{if(sel!=null)el.setSelectionRange(sel,sel)}catch(_){}}}
  window.scrollTo(0,sy);
  banner();
}
function banner(){
  const b=$('#banner');
  if(S.mode==='connecting')b.innerHTML='';
  else if(!S.db)b.innerHTML=`<div class="banner warn">Đang chạy với dữ liệu mô phỏng gốc. Thay đổi chỉ tồn tại trong phiên này; mở trang trên ứng dụng và đăng nhập để lưu và chia sẻ dữ liệu chung.</div>`;
  else if(!S.canWrite)b.innerHTML=`<div class="banner">Bạn đang ở chế độ xem${S.comments?' và bình luận':''}. Liên hệ chủ sở hữu để được cấp quyền chỉnh sửa.</div>`;
  else b.innerHTML='';
}
function go(v){if(!V[v])v='overview';S.view=v;if(location.hash!=='#'+v){try{history.replaceState(null,'','#'+v)}catch(_){location.hash=v}}render();window.scrollTo(0,0)}
window.addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(V[v]&&v!==S.view){S.view=v;render()}});

/* ============ writes ============ */
async function put(col,id,data){
  S.col[col][id]=data;scheduleRender();
  if(S.db){try{await S.db.doc(col+'/'+id).set(data)}catch(e){toast('Không lưu được: '+(e&&e.code==='not_granted'?'bạn không có quyền chỉnh sửa':(e&&e.message)||'lỗi kết nối'));throw e}}
}
async function remove(col,id){delete S.col[col][id];scheduleRender();if(S.db){try{await S.db.doc(col+'/'+id).delete()}catch(e){toast('Không xóa được');throw e}}}
function audit(action,detail){return put('audit',uid(),{at:Date.now(),by:S.meId||null,action,detail}).catch(()=>{})}
function logRun(type,summary){return put('runs',uid(),{at:Date.now(),by:S.meId||null,type,summary}).catch(()=>{})}
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,3600)}

/* ============ drawer: employee ============ */
function openDrawer(html){$('#drawer').innerHTML=html;$('#drawerWrap').hidden=false;const f=$('#drawer button, #drawer input');if(f)f.focus()}
function closeDrawer(){$('#drawerWrap').hidden=true;$('#drawer').innerHTML=''}
function empDrawer(id){
  const e=M.emps.find(x=>x.id===id);if(!e)return;const p=e.pay,T=M.T;
  const notice=e.contract===C_INDEF?'45 ngày':e.contract===C_DEF?'30 ngày':'Không cần báo trước';
  const pre09=Math.max(0,days(parse(e.hire),new Date(2009,0,1))/365.25);
  const sev=Math.round(pre09*2)/2*.5*(e.p1+e.p1*P('p2Rate')/100*e.comp);
  const flags=M.checks.filter(c=>c.e&&c.e.id===id);
  const opt=(arr,cur)=>arr.map(([v,l])=>`<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(l)}</option>`).join('');
  const dis=S.canWrite?'':' disabled';
  openDrawer(`
   <div class="dh"><div><span class="muted small mono">${e.id} · ${esc(e.email)}</span><h2 style="font-size:20px">${esc(e.name)}</h2><div class="small">${esc(e.title)} · ${esc(e.deptName)} · GS${z2(e.grade)}</div><div style="margin-top:6px">${statusPill(e)} ${e.expat?pill(e.nat,'info'):''} ${pill('KPI '+e.kpi.toFixed(1)+' · '+e.rating,e.rating<='B'?'ok':e.rating==='C'?'mute':'warn')}</div></div><button class="btn sm" data-act="close">Đóng</button></div>
   ${flags.length?`<div class="list">${flags.map(c=>`<div class="sev ${c.sev}"><div class="small">${esc(c.msg)}<div class="muted">${esc(c.law)}</div></div></div>`).join('')}</div>`:''}
   <div class="panel"><header><h3>Thông tin</h3></header><div class="kv">
    <div>Giới tính / tuổi</div><div>${esc(e.gender)} · ${Math.floor(e.age)}</div><div>Trình độ</div><div>${esc(e.edu)}</div>
    <div>Địa điểm</div><div>${esc((SITES[e.site]||{}).name)} (Vùng ${['','I','II','III','IV'][(SITES[e.site]||{region:1}).region]})</div>
    <div>Ngày vào làm</div><div>${vn(e.hire)} · ${e.tenureY.toFixed(1)} năm</div>
    <div>Hợp đồng</div><div>${esc(e.contract)}${e.cEnd?' · đến '+vn(e.cEnd):''}${e.probEnd&&e.contract===C_PROB?' · TV đến '+vn(e.probEnd):''}</div>
    ${e.expat?`<div>Giấy phép lao động</div><div>hết hạn ${vn(e.wp)}</div>`:''}
    <div>Người phụ thuộc</div><div>${e.dep}</div><div>Phép năm</div><div>${e.leave.used}/${e.leave.ent} ngày (còn ${e.leave.rem})</div>
    <div>Làm thêm tháng / năm</div><div>${e.otM}h / ${e.otY}h</div>
    ${e.status==='Nghỉ việc'?`<div>Nghỉ việc</div><div>${vn(e.exit)} · ${esc(e.exitReason||'')}</div>`:''}
   </div></div>
   ${p?`<div class="panel"><header><h3>Phiếu lương tháng ${T.getMonth()+1}/${T.getFullYear()}</h3></header><div class="kv">
    <div>P1 – lương vị trí${p.prob?' ('+P('probPay')+'% thử việc)':''}</div><div>${fmt(p.p1)}</div><div>P2 – năng lực cấp ${e.comp}</div><div>${fmt(p.p2)}</div><div>P3 – hiệu suất loại ${e.rating}</div><div>${fmt(p.p3)}</div>
    <div>Phụ cấp ăn ca, đi lại, điện thoại${p.housing?', nhà ở':''}</div><div>${fmt(p.lunch+p.travel+p.phone+p.housing)}</div><div>Làm thêm ${e.otM} giờ</div><div>${fmt(p.ot)}</div>
    ${p.dUnpaid+p.dSick?`<div>Trừ ngày nghỉ không lương / nghỉ ốm (BHXH chi trả)</div><div>−${fmt(p.dUnpaid+p.dSick)}</div>`:''}
    <div class="tot">Tổng thu nhập</div><div class="tot">${fmt(p.gross)}</div>
    <div>Lương đóng BHXH, BHYT</div><div>${fmt(p.insSal)}</div><div>BHXH ${P('e_bhxh')}% · BHYT ${P('e_bhyt')}% · BHTN ${e.expat?0:P('e_bhtn')}%</div><div>−${fmt(p.insE)}</div>
    <div>Thu nhập tính thuế sau giảm trừ</div><div>${fmt(p.assess)}</div><div>Thuế TNCN</div><div>−${fmt(p.tax)}</div>
    <div class="tot">Thực lĩnh</div><div class="tot">${fmt(p.net)}</div>
    <div class="muted">Công ty đóng BH + KPCĐ + BH sức khỏe</div><div class="muted">${fmt(p.insC+p.kpcd+p.health)}</div><div class="muted">Tổng chi phí công ty</div><div class="muted">${fmt(p.cost)}</div>
   </div></div>`:''}
   <div class="panel"><header><h3>Cập nhật hồ sơ</h3><span class="sub">${S.canWrite?'Lưu sẽ tính lại lương, KPI, tuân thủ ngay':'Bạn chỉ có quyền xem'}</span></header>
   <div class="form">
    <label class="full">Chức danh<input id="f_title" value="${esc(e.title)}"${dis}></label>
    <label>Khối<select id="f_dept"${dis}>${opt(DEPTS.map(d=>[d.id,d.name]),e.dept)}</select></label>
    <label>Địa điểm<select id="f_site"${dis}>${opt(Object.entries(SITES).map(([k,s])=>[k,s.name]),e.site)}</select></label>
    <label>Bậc công việc<select id="f_grade"${dis}>${opt(Object.keys(SCALE_DEF).map(g=>[g,'GS'+z2(g)+' – '+GROUP(Number(g))]),e.grade)}</select></label>
    <label>Lương P1 (đ)<input id="f_p1" type="number" step="10000" value="${e.p1}"${dis}></label>
    <label>Cấp năng lực P2 (0–3)<input id="f_comp" type="number" min="0" max="3" value="${e.comp}"${dis}></label>
    <label>Điểm KPI (1–5)<input id="f_kpi" type="number" min="1" max="5" step="0.1" value="${e.kpi}"${dis}></label>
    <label>Loại hợp đồng<select id="f_contract"${dis}>${opt([[C_PROB,C_PROB],[C_DEF,C_DEF],[C_INDEF,C_INDEF]],e.contract)}</select></label>
    <label>Ngày hết hạn HĐ<input id="f_cend" type="date" value="${esc(e.cEnd||'')}"${dis}></label>
    <label>Người phụ thuộc<input id="f_dep" type="number" min="0" max="9" value="${e.dep}"${dis}></label>
    <label>Làm thêm tháng (giờ)<input id="f_otm" type="number" min="0" value="${e.otM}"${dis}></label>
    <label>Làm thêm lũy kế năm (giờ)<input id="f_oty" type="number" min="0" value="${e.otY}"${dis}></label>
    <label>Ngày phép đã nghỉ<input id="f_leave" type="number" min="0" step="0.5" value="${e.leave.used}"${dis}></label>
   </div>
   <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn pri" data-act="saveEmp" data-id="${e.id}"${dis}>Lưu thay đổi</button>${e.status==='Nghỉ thai sản'?`<button class="btn" data-act="returnEmp" data-id="${e.id}"${dis}>Đi làm lại</button>`:''}</div></div>
   ${e.status!=='Nghỉ việc'?`<div class="panel"><header><h3>Chấm dứt hợp đồng</h3><span class="sub">Thời hạn báo trước: ${notice}. Trợ cấp thôi việc ước tính: ${fmt(sev)}đ${pre09>0?' ('+pre09.toFixed(1)+' năm trước 2009, chưa tham gia BHTN)':' (toàn bộ thời gian đã tham gia BHTN)'}</span></header>
    <div class="form"><label>Ngày nghỉ việc<input id="x_date" type="date" value="${iso(addDays(T,30))}"${dis}></label><label>Lý do<select id="x_reason"${dis}>${opt(EXIT_REASONS.map(r=>[r,r]),EXIT_REASONS[3])}</select></label></div>
    <div style="margin-top:12px"><button class="btn" data-act="exitEmp" data-id="${e.id}"${dis} style="border-color:var(--crit);color:var(--crit)">Ghi nhận nghỉ việc</button></div></div>`:''}`);
}
function newEmpDrawer(req){
  const g=req?req.grade:4,d=req?req.dept:'SAL',T=M.T;
  const opt=(arr,cur)=>arr.map(([v,l])=>`<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(l)}</option>`).join('');
  openDrawer(`<div class="dh"><div><h2 style="font-size:20px">${req?'Nhận việc: '+esc(req.title):'Thêm nhân viên'}</h2><div class="small muted">${req?esc(req.id)+' · hồ sơ thử việc sẽ được tạo và liên kết với yêu cầu tuyển dụng':'Hồ sơ mới sẽ vào danh bạ, bảng lương và rà soát tuân thủ'}</div></div><button class="btn sm" data-act="close">Đóng</button></div>
   <div class="panel"><div class="form">
    <label class="full">Họ và tên<input id="n_name" required placeholder="Ví dụ: Nguyễn Minh Anh"></label>
    <label>Giới tính<select id="n_gender">${opt([['Nam','Nam'],['Nữ','Nữ']],'Nam')}</select></label>
    <label>Ngày sinh<input id="n_dob" type="date" value="1998-05-20"></label>
    <label>Trình độ<select id="n_edu">${opt(['THPT','Trung cấp','Cao đẳng','Đại học','Thạc sĩ','Tiến sĩ'].map(x=>[x,x]),'Đại học')}</select></label>
    <label>Ngày vào làm<input id="n_hire" type="date" value="${iso(T)}"></label>
    <label>Khối<select id="n_dept">${opt(DEPTS.map(x=>[x.id,x.name]),d)}</select></label>
    <label>Địa điểm<select id="n_site">${opt(Object.entries(SITES).map(([k,s])=>[k,s.name]),Object.keys(DEPT[d].sites)[0])}</select></label>
    <label class="full">Chức danh<input id="n_title" value="${esc(req?req.title:'Nhân viên')}"></label>
    <label>Bậc<select id="n_grade">${opt(Object.keys(SCALE_DEF).map(x=>[x,'GS'+z2(x)]),g)}</select></label>
    <label>Lương P1 (đ)<input id="n_p1" type="number" step="10000" value="${scaleMid(g)}"></label>
    <label>Người phụ thuộc<input id="n_dep" type="number" min="0" value="0"></label>
   </div><div style="margin-top:12px"><button class="btn pri" data-act="createEmp" data-req="${req?req.id:''}">Tạo hồ sơ</button></div></div>`);
}
function newReqDrawer(){
  const opt=(arr,cur)=>arr.map(([v,l])=>`<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(l)}</option>`).join('');
  openDrawer(`<div class="dh"><div><h2 style="font-size:20px">Tạo yêu cầu tuyển dụng</h2><div class="small muted">Theo phiếu đề xuất tuyển dụng nhân sự (BM1)</div></div><button class="btn sm" data-act="close">Đóng</button></div>
   <div class="panel"><div class="form">
    <label class="full">Vị trí<input id="r_title" placeholder="Ví dụ: Kỹ sư quy trình"></label>
    <label>Khối<select id="r_dept">${opt(DEPTS.map(x=>[x.id,x.name]),'PRD')}</select></label>
    <label>Bậc<select id="r_grade">${opt(Object.keys(SCALE_DEF).map(x=>[x,'GS'+z2(x)]),5)}</select></label>
    <label>Số lượng<input id="r_qty" type="number" min="1" value="1"></label>
    <label>Ưu tiên<select id="r_prio">${opt([['Cao','Cao'],['Trung bình','Trung bình'],['Thấp','Thấp']],'Trung bình')}</select></label>
    <label>Kênh<select id="r_ch">${opt(['TopCV','VietnamWorks','LinkedIn','Giới thiệu nội bộ','Headhunt','Ngày hội việc làm'].map(x=>[x,x]),'TopCV')}</select></label>
    <label>Ngân sách (đ)<input id="r_budget" type="number" step="1000000" value="15000000"></label>
    <label>Hạn cần người<input id="r_target" type="date" value="${iso(addDays(M.T,45))}"></label>
   </div><div style="margin-top:12px"><button class="btn pri" data-act="createReq">Tạo yêu cầu</button></div></div>`);
}
const val=id=>{const el=document.getElementById(id);return el?el.value:''};
function nextEmpId(){let mx=0;for(const e of M.emps){const n=parseInt(String(e.id).slice(4),10);if(n>mx)mx=n}return 'AMG-'+String(mx+1).padStart(4,'0')}

/* ============ automation ============ */
async function runSync(){
  build();const m=M;
  const s=`${m.active.length} nhân sự · quỹ lương ${fmtB(m.tot.gross)} · nghỉ việc quy năm ${pct(m.turnAnn)} · ${m.checks.filter(c=>c.sev==='crit').length} cảnh báo khẩn · ${m.reports.filter(r=>!r.na&&!r.filed&&r.left<=30).length} báo cáo đến hạn trong 30 ngày`;
  await logRun('Đồng bộ toàn hệ thống',s);toast('Đã đồng bộ: '+s);afterAuto();
}
async function runPayroll(){
  build();const m=M,T=m.T,id=T.getFullYear()+'-'+z2(T.getMonth()+1);
  const byDept={};for(const d of DEPTS){const a=m.payroll.filter(e=>e.dept===d.id);byDept[d.id]={n:a.length,gross:Math.round(sum(a,e=>e.pay.gross)),cost:Math.round(sum(a,e=>e.pay.cost))}}
  await put('payrolls',id,{at:Date.now(),by:S.meId||null,headcount:m.payroll.length,gross:Math.round(m.tot.gross),net:Math.round(m.tot.net),tax:Math.round(m.tot.tax),insE:Math.round(m.tot.insE),insC:Math.round(m.tot.insC),cost:Math.round(m.tot.cost),byDept});
  await logRun('Chốt bảng lương '+id,`${m.payroll.length} người · gross ${fmtB(m.tot.gross)} · thực lĩnh ${fmtB(m.tot.net)} · thuế ${fmtM(m.tot.tax)}`);
  audit('Chốt bảng lương',id);toast('Đã chốt bảng lương '+id);afterAuto();
}
async function runCompliance(){
  build();const items=M.checks.filter(c=>c.sev!=='info');let n=0;
  for(const c of items){const id=safeId(c.key);if(S.col.tasks[id])continue;n++;
    await put('tasks',id,{title:`${c.e?c.e.name+' – ':''}${c.msg}`,sev:c.sev,due:c.due,law:c.law,status:'open',module:'compliance',emp:c.e?c.e.id:null,at:Date.now(),by:S.meId||null}).catch(()=>{});
    if(n>=120)break}
  await logRun('Rà soát tuân thủ',`${items.length} mục khẩn/cần xử lý · tạo mới ${n} việc`);toast(`Đã tạo ${n} việc mới`);afterAuto();
}
async function runCalendar(){
  build();let n=0;
  for(const r of M.reports){if(r.na||r.filed||r.left>30)continue;const id=safeId('rep_'+r.key);if(S.col.tasks[id])continue;n++;
    await put('tasks',id,{title:'Nộp '+r.name,sev:r.left<=7?'crit':'warn',due:iso(r.next),law:r.basis,status:'open',module:'compliance',at:Date.now(),by:S.meId||null}).catch(()=>{})}
  await logRun('Nhắc hạn báo cáo',`${n} báo cáo đến hạn trong 30 ngày được tạo việc`);toast(n?`Đã tạo ${n} việc nhắc hạn`:'Không có báo cáo nào đến hạn trong 30 ngày');afterAuto();
}
async function aiPolicy(){
  if(!S.sample)return toast('Cần mở trang trên ứng dụng để dùng AI');
  S.ai.busy='policy';render();
  const T=today(),legal=PARAMS.filter(p=>LEGAL_GROUPS.includes(p.g)).map(p=>({k:p.k,label:p.label,value:P(p.k),unit:p.unit,basis:p.basis,effective:p.eff}));
  const prompt=`Bạn là chuyên gia pháp luật lao động, bảo hiểm và thuế TNCN Việt Nam. Hôm nay là ${iso(T)}.
Dưới đây là các tham số chính sách nhân sự đang dùng (JSON). Với mỗi tham số, đối chiếu với hiểu biết mới nhất của bạn về văn bản pháp luật Việt Nam còn hiệu lực tại ngày hôm nay.
Trả về DUY NHẤT một mảng JSON, mỗi phần tử: {"k": key, "status": "khop" | "can_kiem_tra" | "da_thay_doi", "suggested": số hoặc null, "basis": "số hiệu văn bản đề xuất hoặc chuỗi rỗng", "note": "giải thích ngắn bằng tiếng Việt, tối đa 30 từ"}.
Chỉ điền "suggested" khi bạn chắc chắn về giá trị mới. Không bịa số hiệu văn bản; nếu không chắc, dùng status "can_kiem_tra".
${JSON.stringify(legal)}`;
  try{
    const res=await S.sample.json(prompt,{modelTier:'complex'});
    const items=Array.isArray(res)?res:(res&&Array.isArray(res.items)?res.items:[]);
    S.ai.policy={at:Date.now(),items};
    const changed=items.filter(x=>x.status!=='khop').length;
    await logRun('AI rà soát chính sách',`${items.length} tham số · ${changed} cần kiểm tra hoặc đã thay đổi`);
    toast('AI đã rà soát xong, xem cột "Rà soát AI"');S.view='policy';try{history.replaceState(null,'','#policy')}catch(_){}
  }catch(e){toast(e&&e.code==='copied'?e.message:e&&e.code==='not_granted'?'Bạn chưa cho phép trang dùng AI':e&&e.code==='rate_limited'?'AI đang bận, thử lại sau ít phút':'AI chưa trả lời được: '+((e&&e.message)||''))}
  S.ai.busy='';render();
}
async function aiReport(){
  if(!S.sample)return toast('Cần mở trang trên ứng dụng để dùng AI');
  S.ai.busy='report';render();
  const m=M,T=m.T;
  const data={ngay:iso(T),nhanSu:m.active.length,dangLam:m.working.length,tuyenMoiYTD:m.hiresY.length,nghiViecYTD:m.exitsY.length,tyLeNghiViecQuyNam:+(m.turnAnn*100).toFixed(1),
    lyDoNghi:countBy(m.exitsY,e=>e.exitReason),bienDongThang:m.monthly.map((x,i)=>({thang:i+1,tuyen:x.h,nghi:x.x,hc:x.hc})),
    quyLuongGross:Math.round(m.tot.gross),thucLinh:Math.round(m.tot.net),thueTNCN:Math.round(m.tot.tax),chiPhiCongTy:Math.round(m.tot.cost),tyLeChiPhiDoanhThu:+(m.tot.cost/P('revenue')*100).toFixed(1),
    canhBaoKhan:m.checks.filter(c=>c.sev==='crit').length,canhBaoTheoLoai:countBy(m.checks.filter(c=>c.sev!=='info'),c=>c.type),
    baoCaoSapHan:m.reports.filter(r=>!r.na&&r.left<=30).map(r=>({ten:r.name,han:iso(r.next),daNop:r.filed})),
    tuyenDung:{yeuCauMo:m.openReqs.length,viTriTrong:sum(m.openReqs,r=>r.qty-r.hired),thoiGianTuyenTB:Math.round(m.ttf)},
    kpiTB:+avg(m.working,e=>e.kpi).toFixed(2)};
  const prompt=`Bạn là Giám đốc Nhân sự của một tập đoàn đa quốc gia tại Việt Nam (dữ liệu mô phỏng). Viết báo cáo nhân sự tháng ${T.getMonth()+1}/${T.getFullYear()} gửi Ban Tổng Giám đốc, bằng tiếng Việt, dạng Markdown với tiêu đề "## ".
Các mục: 1) Tóm tắt điều hành (3 gạch đầu dòng), 2) Biến động nhân sự, 3) Lương và chi phí, 4) Tuân thủ pháp luật và rủi ro, 5) Tuyển dụng, 6) Đề xuất hành động (tối đa 5, có người phụ trách và thời hạn).
Chỉ dùng số liệu dưới đây, không bịa thêm số. Số tiền viết theo tỷ đồng hoặc triệu đồng. Dưới 450 từ.
${JSON.stringify(data)}`;
  try{const r=await S.sample(prompt,{modelTier:'default',onText:({text})=>{S.ai.report={at:Date.now(),text};if(S.view==='automation'){const el=document.querySelector('#view .ai');if(el)el.innerHTML=mdLite(text);else scheduleRender()}}});
    S.ai.report={at:Date.now(),text:r.text};await logRun('AI soạn báo cáo tháng',`${r.text.length} ký tự`);toast('Báo cáo đã sẵn sàng')}
  catch(e){toast(e&&e.code==='copied'?e.message:e&&e.code==='not_granted'?'Bạn chưa cho phép trang dùng AI':'AI chưa trả lời được')}
  S.ai.busy='';render();
}

/* ============ export ============ */
const csvCell=v=>{const s=String(v??'');return /[",\n;]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
async function saveFile(filename,rows){
  const data='﻿'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');
  if(!S.downloads)return toast('Xuất file cần mở trang trên ứng dụng');
  try{await S.downloads.save({filename,data});toast('Đã gửi file '+filename)}catch(e){if(e&&e.code!=='declined'&&e.code!=='cancelled')toast('Không xuất được file')}
}
const stamp=()=>iso(today());
const ACT={
 go:b=>go(b.dataset.v),
 close:closeDrawer,
 emp:b=>{if(b.dataset.id)empDrawer(b.dataset.id)},
 page:b=>{S.f.page+=Number(b.dataset.d);render()},
 ppage:b=>{S.f.pp+=Number(b.dataset.d);render()},
 comment:b=>{const p=b.closest('.panel');if(S.comments&&p)S.comments.openComposer({element:p}).catch(()=>{})},
 newEmp:()=>newEmpDrawer(null),
 newReq:()=>newReqDrawer(),
 saveEmp:async b=>{
  const id=b.dataset.id,e=M.emps.find(x=>x.id===id);if(!e)return;
  const patch={title:val('f_title'),dept:val('f_dept'),site:val('f_site'),grade:Number(val('f_grade')),p1:Number(val('f_p1')),comp:Math.max(0,Math.min(3,Number(val('f_comp')))),kpi:Math.max(1,Math.min(5,Number(val('f_kpi')))),
   contract:val('f_contract'),cEnd:val('f_cend')||null,dep:Number(val('f_dep')),otM:Number(val('f_otm')),otY:Number(val('f_oty')),leaveUsed:Number(val('f_leave'))};
  if(patch.contract===C_INDEF)patch.cEnd=null;
  {const mult=e._p1Base?e.p1/e._p1Base:1;if(Math.abs(patch.p1-e.p1)>1)patch.p1=Math.round(patch.p1/mult);else delete patch.p1}
  if(e.contract===C_PROB&&patch.contract!==C_PROB)patch.probEnd=e.probEnd;
  const changed=Object.keys(patch).filter(k=>String(patch[k]??'')!==String((k==='leaveUsed'?e.leave.used:e[k])??''));
  if(!changed.length)return toast('Không có thay đổi');
  const prev=S.col.employees[id]||{};
  try{await put('employees',id,{...prev,...patch,_at:Date.now(),_by:S.meId||null});audit('Sửa hồ sơ',`${id} ${e.name}: ${changed.join(', ')}`);const big=changed.filter(k=>['dept','site','grade','p1','title','contract'].includes(k));if(big.length)put('tasks',safeId('pl_'+id+'_'+Date.now()),{title:`${e.name}: ký phụ lục HĐ / quyết định (${big.join(', ')})${big.includes('p1')?', báo điều chỉnh BHXH':''}`,sev:'warn',due:iso(addDays(today(),7)),law:'Điều 22, 29 BLLĐ 2019',status:'open',emp:id,at:Date.now(),by:S.meId||null}).catch(()=>{});toast('Đã lưu hồ sơ '+id);empDrawer(id)}catch(_){}
 },
 returnEmp:async b=>{const id=b.dataset.id,prev=S.col.employees[id]||{};await put('employees',id,{...prev,status:'Đang làm việc',matEnd:null,_at:Date.now()});audit('Đi làm lại sau thai sản',id);closeDrawer()},
 exitEmp:async b=>{
  const id=b.dataset.id,e=M.emps.find(x=>x.id===id),d=val('x_date'),r=val('x_reason');if(!d)return toast('Chọn ngày nghỉ việc');
  if(parse(d)>today()){const tid=safeId('exitplan_'+id);await put('tasks',tid,{title:`${e.name} nghỉ việc ngày ${vn(d)}: bàn giao, thu hồi tài sản, phỏng vấn thôi việc (quy trình xử lý xin thôi việc)`,sev:'warn',due:d,law:'Điều 35, 48 BLLĐ 2019',status:'open',emp:id,at:Date.now(),by:S.meId||null});
    const prev=S.col.employees[id]||{};await put('employees',id,{...prev,plannedExit:d,plannedReason:r,_at:Date.now()});audit('Ghi nhận đơn nghỉ việc',`${id} ${e.name}, ngày nghỉ ${d}`);toast('Đã tạo việc chuẩn bị nghỉ việc cho ngày '+vn(d));closeDrawer();return}
  const prev=S.col.employees[id]||{};await put('employees',id,{...prev,status:'Nghỉ việc',exit:d,exitReason:r,_at:Date.now(),_by:S.meId||null});
  await put('tasks',safeId('settle_'+id),{title:`${e.name}: thanh toán quyền lợi, chốt sổ BHXH, trả giấy tờ trong 14 ngày làm việc`,sev:'warn',due:iso(addDays(parse(d),18)),law:'Điều 48 BLLĐ 2019',status:'open',emp:id,at:Date.now(),by:S.meId||null});
  audit('Ghi nhận nghỉ việc',`${id} ${e.name}, ${d}, ${r}`);toast('Đã ghi nhận nghỉ việc');closeDrawer();
 },
 createEmp:async b=>{
  const name=val('n_name').trim();if(!name){toast('Nhập họ và tên');document.getElementById('n_name').focus();return}
  const id=nextEmpId(),g=Number(val('n_grade')),hire=val('n_hire')||iso(today()),probDays=g>=9?180:g>=4?60:g===3?30:8;
  const doc={_new:true,name,gender:val('n_gender'),dob:val('n_dob'),edu:val('n_edu'),dept:val('n_dept'),site:val('n_site'),grade:g,title:val('n_title'),hire,contract:C_PROB,cEnd:null,cSeq:0,probEnd:iso(addDays(parse(hire),probDays)),
   p1:Number(val('n_p1')),comp:0,kpi:3.5,otM:0,otY:0,dep:Number(val('n_dep')),union:false,status:'Đang làm việc',exit:null,exitReason:null,matEnd:null,expat:false,nat:'Việt Nam',wp:null,leaveFrac:0,leaveUsed:0,email:slug(name)+'@amg-vn.example',req:b.dataset.req||null,_at:Date.now(),_by:S.meId||null};
  try{
   await put('employees',id,doc);
   if(b.dataset.req){const r=M.reqs.find(x=>x.id===b.dataset.req);if(r){const hired=r.hired+1,done=hired>=r.qty;const prev=S.col.reqs[r.id]||{};
     await put('reqs',r.id,{...prev,hired,offered:Math.max(r.offered,hired),status:done?'Hoàn tất':r.status,closed:done?iso(today()):null,_at:Date.now()})}}
   await put('tasks',safeId('prob_'+id),{title:`${name}: đánh giá kết thúc thử việc, ký HĐ chính thức`,sev:'warn',due:doc.probEnd,law:'Điều 27 BLLĐ 2019',status:'open',emp:id,at:Date.now(),by:S.meId||null});
   audit('Tạo hồ sơ nhân viên',`${id} ${name}${b.dataset.req?' từ '+b.dataset.req:''}`);toast('Đã tạo hồ sơ '+id);closeDrawer();
  }catch(_){}
 },
 createReq:async()=>{
  const title=val('r_title').trim();if(!title)return toast('Nhập tên vị trí');
  const n=M.reqs.length+1,id='REQ-'+String(today().getFullYear()).slice(2)+'-'+z2(n)+'-'+uid().slice(-3).toUpperCase();
  await put('reqs',id,{_new:true,dept:val('r_dept'),title,qty:Math.max(1,Number(val('r_qty'))),grade:Number(val('r_grade')),prio:val('r_prio'),channel:val('r_ch'),budget:Number(val('r_budget')),spent:0,opened:iso(today()),target:val('r_target'),applied:0,screened:0,interviewed:0,offered:0,hired:0,status:'Đang tuyển',closed:null,_at:Date.now(),_by:S.meId||null});
  audit('Tạo yêu cầu tuyển dụng',`${id} ${title}`);toast('Đã tạo '+id);closeDrawer();
 },
 reqCv:async b=>{const r=M.reqs.find(x=>x.id===b.dataset.id);const prev=S.col.reqs[r.id]||{};const applied=r.applied+1,screened=r.screened+(Math.random()<.45?1:0),interviewed=r.interviewed+(Math.random()<.2?1:0);
   await put('reqs',r.id,{...prev,applied,screened,interviewed,status:interviewed>0&&r.status==='Đang tuyển'?'Phỏng vấn':r.status,_at:Date.now()}).catch(()=>{})},
 reqHire:b=>{const r=M.reqs.find(x=>x.id===b.dataset.id);if(r)newEmpDrawer(r)},
 reqPause:async b=>{const r=M.reqs.find(x=>x.id===b.dataset.id);const prev=S.col.reqs[r.id]||{};await put('reqs',r.id,{...prev,status:r.status==='Tạm dừng'?'Đang tuyển':'Tạm dừng',_at:Date.now()}).catch(()=>{});audit(r.status==='Tạm dừng'?'Mở lại tuyển dụng':'Tạm dừng tuyển dụng',r.id)},
 task:async b=>{const t=S.col.tasks[b.dataset.id];if(!t)return;await put('tasks',b.dataset.id,{...t,status:t.status==='done'?'open':'done',doneAt:Date.now(),doneBy:S.meId||null}).catch(()=>{})},
 file:async b=>{const k=b.dataset.key;if(S.col.filings[k]){await remove('filings',k).catch(()=>{});audit('Bỏ đánh dấu đã nộp báo cáo',k)}else{await put('filings',k,{at:Date.now(),by:S.meId||null}).catch(()=>{});audit('Đánh dấu đã nộp báo cáo',k)}},
 savePolicy:async()=>{
  const values={},changed=[];for(const p of PARAMS){const v=val('pp_'+p.k);if(v!==''&&Number(v)!==p.v)values[p.k]=Number(v);if(v!==''&&Number(v)!==P(p.k))changed.push(p.label)}
  const scale={};for(const g of Object.keys(SCALE_DEF)){const v=Number(val('sc'+g));if(v&&v!==SCALE_DEF[g])scale[g]=v;if(v&&v!==scaleMid(Number(g)))changed.push('Thang lương GS'+z2(g))}
  try{await put('settings','policy',{values,scale,updatedAt:Date.now(),updatedBy:S.meId||null});audit('Cập nhật chính sách',changed.length?changed.slice(0,8).join('; ')+(changed.length>8?'…':''):'Không đổi giá trị');await logRun('Áp dụng chính sách mới',`${changed.length} tham số thay đổi; bảng lương và tuân thủ đã tính lại`);toast('Đã áp dụng tham số mới');afterAuto()}catch(_){}
 },
 resetPolicy:async()=>{await put('settings','policy',{values:{},scale:{},updatedAt:Date.now(),updatedBy:S.meId||null}).catch(()=>{});audit('Khôi phục chính sách mặc định','');toast('Đã khôi phục mặc định')},
 applySug:b=>{const el=document.getElementById('pp_'+b.dataset.k);if(el){el.value=b.dataset.v;el.focus();toast('Đã điền đề xuất. Kiểm tra lại rồi bấm "Lưu và áp dụng tham số"')}},
 runSync,runPayroll,runCompliance,runCalendar,aiPolicy,aiReport,
 pushSheets:()=>pushSheets('manual'),pullSheets:()=>pullSheets(),
 sheetAuto:async()=>{const c=sheetCfg();await put('settings','sheets',{...c,auto:!c.auto,updatedAt:Date.now(),updatedBy:S.meId||null}).catch(()=>{});audit('Đồng bộ Sheets tự động',!c.auto?'Bật':'Tắt')},
 sheetSave:async()=>{const id=parseSheetId(val('sh_id'));if(!/^[A-Za-z0-9_-]{20,}$/.test(id))return toast('Link hoặc ID Google Sheet không hợp lệ');const c=sheetCfg();await put('settings','sheets',{...c,id,title:'Google Sheet đích',updatedAt:Date.now(),updatedBy:S.meId||null}).catch(()=>{});audit('Đổi Google Sheet đích',id);toast('Đã đổi file đích. Bấm "Đẩy dữ liệu lên Sheets" để ghi dữ liệu')},
 saveReport:async()=>{if(!S.ai.report)return;if(!S.downloads)return toast('Xuất file cần mở trang trên ứng dụng');try{await S.downloads.save({filename:'bao-cao-nhan-su-'+stamp()+'.md',data:S.ai.report.text})}catch(_){}},
 exportEmp:()=>saveFile('ho-so-nhan-su-'+stamp()+'.csv',[['Mã','Họ tên','Giới tính','Ngày sinh','Trình độ','Khối','Chức danh','Bậc','Địa điểm','Ngày vào làm','Hợp đồng','Hết hạn HĐ','Trạng thái','Ngày nghỉ','Lý do nghỉ','KPI','Xếp loại','Quốc tịch'],...M.emps.map(e=>[e.id,e.name,e.gender,e.dob,e.edu,e.deptName,e.title,'GS'+z2(e.grade),(SITES[e.site]||{}).name,e.hire,e.contract,e.cEnd||'',e.status,e.exit||'',e.exitReason||'',e.kpi,e.rating,e.nat])]),
 exportPay:()=>saveFile('bang-luong-'+stamp()+'.csv',[['Mã','Họ tên','Khối','P1','P2','P3','Phụ cấp','Làm thêm','Gross','BHXH NLĐ','BHYT NLĐ','BHTN NLĐ','Thu nhập tính thuế','Thuế TNCN','Thực lĩnh','BH NSDLĐ','KPCĐ','Chi phí công ty'],...M.payroll.map(e=>{const p=e.pay;return[e.id,e.name,e.deptName,...[p.p1,p.p2,p.p3,p.lunch+p.phone+p.travel+p.housing,p.ot,p.gross,p.eBHXH,p.eBHYT,p.eBHTN,p.assess,p.tax,p.net,p.insC,p.kpcd,p.cost].map(Math.round)]})]),
 exportChecks:()=>saveFile('canh-bao-tuan-thu-'+stamp()+'.csv',[['Mức','Mã NV','Họ tên','Khối','Nội dung','Hạn','Căn cứ'],...M.checks.map(c=>[sevName[c.sev],c.e?c.e.id:'',c.e?c.e.name:'',c.e?c.e.deptName:'',c.msg,c.due,c.law])]),
 exportCost:()=>{const t=M.tot;saveFile('chi-phi-nhan-su-'+stamp()+'.csv',[['Chỉ tiêu','Số tiền'],['Lương P1',t.p1],['P2',t.p2],['P3',t.p3],['Phụ cấp',t.lunch+t.phone+t.travel+t.housing],['Làm thêm',t.ot],['BHXH NSDLĐ',t.cBHXH],['BHYT NSDLĐ',t.cBHYT],['BHTN NSDLĐ',t.cBHTN],['KPCĐ',t.kpcd],['BH sức khỏe',t.health]].map(r=>[r[0],Math.round(r[1]??0)]))},
};
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-act]');if(!b||b.disabled)return;const f=ACT[b.dataset.act];if(f){ev.preventDefault();Promise.resolve(f(b,ev)).catch(()=>{})}});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!$('#drawerWrap').hidden)closeDrawer();if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches('tr[data-act],.st[data-act]')){ev.preventDefault();ev.target.click()}});
document.addEventListener('input',ev=>{const k=ev.target.dataset&&ev.target.dataset.f;if(!k)return;S.f[k]=ev.target.value;if(k==='pkg')S.f.pkgX='';if(k==='q'||k==='dept'||k==='site'||k==='status'||k==='contract')S.f.page=0;if(k==='pq')S.f.pp=0;clearTimeout(S.fT);S.fT=setTimeout(render,ev.target.tagName==='INPUT'?180:0)});

/* ============ clock & connection ============ */
function tick(){const n=new Date();$('#clock').textContent=n.toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'})+' · '+n.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
  const d=iso(today());if(tick.d&&tick.d!==d)render();tick.d=d}
function setSync(state,text){$('#sync').innerHTML=`<span class="dot ${state}"></span>${esc(text)}`}
async function connect(){
  const C=window.claude;
  if(!C||!C.use){S.mode='local';S.canWrite=true;S.canAdmin=true;setSync('off','Dữ liệu cục bộ');render();return}
  const use=n=>C.use(n).catch(()=>null);
  const [db,user,comments,downloads,sample,mcp]=await Promise.all(['db','user','comments','downloads','sample','mcp'].map(use));
  S.mcp=mcp;S.db=db;S.user=user;S.comments=comments;S.downloads=downloads;S.sample=sample;
  if(user){try{S.meId=await user.id();S.me=await user.me();S.isOwner=await user.isOwner();S.canAdmin=(await user.canEdit())||S.isOwner;const cw=await user.can('data.write');S.canWrite=cw===null?true:!!cw;if(S.canAdmin)S.canWrite=true}catch(_){}}
  if(S.me){const nm=S.me.name||'Bạn';$('#who').innerHTML=`${S.me.avatarUrl?`<img src="${esc(S.me.avatarUrl)}" alt="">`:''}${esc(nm)} · ${S.isOwner?'Chủ sở hữu':S.canAdmin?'Editor':S.canWrite&&db?'Contributor':'Viewer'}`}
  if(!db){S.mode='local';S.canWrite=true;S.canAdmin=true;setSync('off','Dữ liệu cục bộ');render();return}
  S.mode='db';setSync('','Đang tải dữ liệu chung');
  let loaded=0;const timer=setTimeout(()=>{if(loaded<COLS.length)setSync('off','Kết nối chậm, đang dùng dữ liệu gốc')},10000);
  const seen=new Set();
  for(const c of COLS){
    db.collection(c).onSnapshot(snap=>{
      const m={};snap.docs.forEach(d=>{const x=d.data();if(x)m[d.id]=x});S.col[c]=m;
      if(!seen.has(c)){seen.add(c);loaded++;if(loaded===COLS.length){clearTimeout(timer);setSync('on','Đồng bộ thời gian thực')}}
      if(c==='audit'||c==='runs')resolveProfiles();
      scheduleRender();
    },err=>{setSync('off','Lỗi đồng bộ: '+((err&&err.code)||''))});
  }
  render();
}
let profT=0;
function resolveProfiles(){clearTimeout(profT);profT=setTimeout(async()=>{if(!S.user)return;const ids=[...new Set([...Object.values(S.col.audit),...Object.values(S.col.runs)].map(x=>x.by).filter(Boolean))];if(!ids.length)return;try{S.profiles=await S.user.profiles(ids);scheduleRender()}catch(_){}},300)}

/* ============ actions of extended modules ============ */
async function applyPkg(pk,x){
  if(!S.canAdmin)return toast('Chỉ Editor hoặc chủ sở hữu được áp dụng gói chính sách');
  const sim=simulate(pk,x),cur=S.col.settings.policy||{},hid=uid();
  const before={values:{...(cur.values||{})},scale:{...(cur.scale||{})}};
  const after={values:{...(cur.values||{}),...sim.vals},scale:pk.merit?scaleShift(x):{...(cur.scale||{})}};
  let mid=null;
  try{
    if(pk.merit){build();const f=meritFactors();mid='M'+today().getFullYear()+'-'+hid.slice(-5);await put('merit',mid,{at:Date.now(),by:S.meId||null,factors:f,pct:x})}
    await put('settings','policy',{...cur,values:after.values,scale:after.scale,updatedAt:Date.now(),updatedBy:S.meId||null});
    await put('policyHistory',hid,{at:Date.now(),by:S.meId||null,pkg:pk.id,name:pk.name,x:pk.input?x:null,law:pk.law,before,after,merit:mid,impact:{dGross:Math.round(sim.after.tot.gross-sim.before.tot.gross),dCost:Math.round(sim.after.tot.cost-sim.before.tot.cost),raised:sim.raised}});
    for(let i=0;i<pk.tasks.length;i++)await put('tasks',safeId('pol_'+hid+'_'+i),{title:pk.tasks[i]+' ('+pk.name+')',sev:'warn',due:iso(addDays(today(),15)),law:pk.law,status:'open',module:'policy',at:Date.now(),by:S.meId||null}).catch(()=>{});
    audit('Áp dụng gói chính sách',pk.name+(pk.input?' ('+x+')':''));
    const s=`Δ quỹ lương ${fmtM(sim.after.tot.gross-sim.before.tot.gross)}/tháng · Δ chi phí ${fmtM(sim.after.tot.cost-sim.before.tot.cost)}/tháng${pk.merit?' · '+sim.raised+' người tăng lương':''} · ${pk.tasks.length} việc mới`;
    await logRun('Cập nhật chính sách: '+pk.name,s);toast('Đã áp dụng: '+pk.name);afterAuto();
  }catch(_){}
}
async function rollbackPkg(id){
  const h=S.col.policyHistory[id];if(!h||!S.canAdmin)return;
  const cur=S.col.settings.policy||{};
  try{
    await put('settings','policy',{...cur,values:(h.before&&h.before.values)||{},scale:(h.before&&h.before.scale)||{},updatedAt:Date.now(),updatedBy:S.meId||null});
    if(h.merit&&S.col.merit[h.merit])await remove('merit',h.merit);
    await put('policyHistory',id,{...h,rolledBack:Date.now(),rolledBackBy:S.meId||null});
    audit('Hoàn tác gói chính sách',h.name);await logRun('Hoàn tác chính sách: '+h.name,'Đã khôi phục tham số trước khi áp dụng');toast('Đã hoàn tác '+h.name);afterAuto();
  }catch(_){}
}
async function runRoadmapAuto(){const pk=PKGS.find(p=>p.id==='roadmap');await applyPkg(pk,null)}
Object.assign(ACT,{
 trainOpen:b=>trainDrawer(b.dataset.id),
 trainAll:()=>document.querySelectorAll('#drawer .tc').forEach(c=>c.checked=true),
 trainSave:async b=>{const cid=b.dataset.id,ids=[...document.querySelectorAll('#drawer .tc:checked')].map(c=>c.value);if(!ids.length)return toast('Chọn ít nhất một người');
   const prev=S.col.training[cid]||{done:{}};const done={...(prev.done||{})};ids.forEach(i=>done[i]=iso(today()));
   try{await put('training',cid,{...prev,done,_at:Date.now()});audit('Ghi nhận đào tạo',`${cid}: ${ids.length} người`);toast(`Đã ghi nhận ${ids.length} người hoàn thành`);closeDrawer()}catch(_){}},
 lcOpen:b=>lcDrawer(b.dataset.kind,b.dataset.id),
 lcToggle:async b=>{const{kind,id,k}=b.dataset,col=kind==='onb'?'onboard':'offboard';const x=(kind==='onb'?M.life.onb:M.life.offb).find(z=>z.e.id===id);if(!x)return;const it=x.items.find(i=>i.k===k);
   const prev=S.col[col][id]||{};try{await put(col,id,{...prev,[k]:!it.done,_at:Date.now()});build();lcDrawer(kind,id)}catch(_){}},
 relNew:()=>relDrawer(),
 relSave:async()=>{const kind=val('rl_kind'),emp=val('rl_emp').trim(),e=M.emps.find(x=>x.id===emp);if(!e)return toast('Không tìm thấy mã nhân viên');
   const id=(kind==='reward'?'RW-':'KL-')+uid().slice(-6).toUpperCase();
   const doc=kind==='reward'?{_new:true,kind,emp,reason:val('rl_reason'),amount:Number(val('rl_amount')),date:val('rl_date'),status:'Đã chi'}:{_new:true,kind,emp,reason:val('rl_reason'),form:val('rl_form'),date:val('rl_date'),status:DISC_STEPS[0]};
   try{await put('relations',id,{...doc,_at:Date.now(),_by:S.meId||null});
    if(kind==='discipline')await put('tasks',safeId('disc_'+id),{title:`${e.name}: tổ chức họp xử lý kỷ luật (có tổ chức đại diện NLĐ), thời hiệu đến ${vn(addDays(parse(doc.date),183))}`,sev:'warn',due:iso(addDays(parse(doc.date),150)),law:'Điều 122–123 BLLĐ 2019',status:'open',emp,at:Date.now(),by:S.meId||null});
    audit(kind==='reward'?'Thêm khen thưởng':'Mở hồ sơ kỷ luật',`${id} ${e.name}`);toast('Đã lưu '+id);closeDrawer()}catch(_){}},
 discNext:async b=>{const x=M.relations.find(r=>r.id===b.dataset.id);if(!x)return;const i=DISC_STEPS.indexOf(x.status),next=DISC_STEPS[Math.min(DISC_STEPS.length-1,i+1)];
   try{await put('relations',x.id,{...(S.col.relations[x.id]||{}),status:next,_at:Date.now()});
    if(next==='Đã ra quyết định'&&x.form==='Sa thải'){const e=M.emps.find(z=>z.id===x.emp);if(e)await put('employees',e.id,{...(S.col.employees[e.id]||{}),plannedExit:iso(addDays(today(),3)),plannedReason:'Kỷ luật sa thải',_at:Date.now()})}
    audit('Cập nhật kỷ luật',`${x.id}: ${next}`)}catch(_){}},
 docGen:()=>{const tp=S.f.d_tpl||'offer',e=M.emps.find(x=>x.id===String(S.f.d_emp||'').trim())||null;
   if(TPL.find(t=>t.id===tp).who==='emp'&&!e)return toast('Nhập mã nhân viên cho mẫu này');
   S.docText=genDoc(tp,{e,cand:S.f.d_cand,pos:S.f.d_pos,date:S.f.d_date,note:S.f.d_note});render()},
 docFor:b=>{S.f.d_tpl=b.dataset.tpl;S.f.d_emp=b.dataset.id;S.f.d_cand='';S.f.d_pos='';const e=M.emps.find(x=>x.id===b.dataset.id);S.docText=genDoc(b.dataset.tpl,{e,date:iso(today())});closeDrawer();go('docs')},
 docCopy:async()=>{try{await navigator.clipboard.writeText(S.docText);toast('Đã sao chép')}catch(_){const t=document.getElementById('d_out');if(t){t.focus();t.select()}toast('Đã chọn văn bản, nhấn Ctrl/Cmd + C để sao chép')}},
 docSave:async()=>{if(!S.downloads)return toast('Tải file cần mở trang trên ứng dụng');try{await S.downloads.save({filename:'van-ban-'+(S.f.d_tpl||'hr')+'-'+stamp()+'.txt',data:S.docText})}catch(_){}},
 repOpen:b=>repDrawer(b.dataset.id),
 repExport:()=>{const c=S.repCache;if(!c)return;const rows=[['Chỉ tiêu','Giá trị'],...c.d.rows];if(c.d.list)rows.push([],...c.d.list);saveFile(safeId(c.r.id)+'-so-lieu-'+stamp()+'.csv',rows)},
 exportBhxh:()=>saveFile('bhxh-tang-giam-'+stamp()+'.csv',[['Loại','Mã','Họ tên','Khối','Mức lương đóng','Lý do'],...bhxhChanges(M).map(r=>[r.type,r.e.id,r.e.name,r.e.deptName,Math.round(r.sal),r.reason])]),
 pkgApply:()=>{const pk=PKGS.find(p=>p.id===(S.f.pkg||'roadmap'))||PKGS[0];const x=pk.input?Number(S.f.pkgX!==undefined&&S.f.pkgX!==''?S.f.pkgX:pk.input.def):null;return applyPkg(pk,x)},
 pkgQuick:b=>{const pk=PKGS.find(p=>p.id===b.dataset.id);return applyPkg(pk,pk.input?pk.input.def:null)},
 pkgRollback:b=>rollbackPkg(b.dataset.id),
 runRoadmap:runRoadmapAuto,goPkg:()=>go('policy'),goBhxh:()=>go('compliance'),goTrain:()=>go('training'),goLife:()=>go('lifecycle'),goDocs:()=>go('docs'),
});
