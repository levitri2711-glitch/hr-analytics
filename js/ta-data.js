/* Talent Acquisition – dữ liệu mô phỏng, khung năng lực, mô hình tính toán. Dùng chung helper của hr.js. */
"use strict";
const RT=mulberry32(20261115);
const tp=a=>a[Math.floor(RT()*a.length)],tb=(a,b)=>a+RT()*(b-a),tri=(a,b)=>Math.floor(tb(a,b+1));
const tg=()=>{const u=RT()||1e-9,v=RT();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const r1=x=>Math.round(x*10)/10;
['cands','jds','campaigns','posts','tests','scorecards','offers','probation','preboard','taSettings','taPolicy'].forEach(c=>{if(!COLS.includes(c)){COLS.push(c);S.col[c]={}}});

/* ---------- Quy trình ---------- */
const STAGES=[
 {k:'apply',l:'Ứng tuyển',d:'Hồ sơ đổ về từ các kênh, ứng viên đồng ý xử lý dữ liệu cá nhân'},
 {k:'screen',l:'Sàng lọc CV',d:'Tiêu chí loại trừ + ma trận chấm điểm CV có trọng số'},
 {k:'test',l:'Trắc nghiệm năng lực',d:'Ngôn ngữ, số học, logic, tình huống (SJT)'},
 {k:'interview',l:'Phỏng vấn STAR',d:'Phỏng vấn hành vi có cấu trúc, chấm theo thang BARS'},
 {k:'assess',l:'Đánh giá & tham chiếu',d:'Ma trận ra quyết định, kiểm tra tham chiếu có đồng ý'},
 {k:'offer',l:'Offer',d:'Đề nghị lương 3P, phúc lợi, điều kiện thử việc'},
 {k:'hired',l:'Nhận việc',d:'Pre-onboarding → onboarding → đánh giá thử việc → HĐLĐ chính thức'}];
const ST_NAME={active:'Đang xử lý',rejected:'Không đạt',withdrawn:'Rút hồ sơ',declined:'Từ chối offer',hired:'Đã nhận việc',pool:'Talent pool'};
const ST_PILL={active:'info',rejected:'mute',withdrawn:'mute',declined:'warn',hired:'ok',pool:'warn'};
const REJ={0:['Không đạt tiêu chí bắt buộc','Kinh nghiệm chưa phù hợp','Hồ sơ trùng lặp'],1:['Điểm CV dưới ngưỡng','Kỹ năng chưa khớp JD','Mức lương kỳ vọng vượt khung'],2:['Điểm trắc nghiệm dưới ngưỡng','Không hoàn thành bài test'],3:['Năng lực chưa đạt yêu cầu','Chưa phù hợp văn hoá làm việc (giá trị cốt lõi)'],4:['Kết quả tham chiếu chưa đạt','Có ứng viên phù hợp hơn'],5:['Chấp nhận offer nơi khác','Mức lương chưa thoả thuận được']};
const probDaysOf=g=>g>=9?180:g>=4?60:g===3?30:8;
const probBasis=g=>g>=9?'≤ 180 ngày – người quản lý doanh nghiệp (Điều 25 BLLĐ 2019)':g>=4?'≤ 60 ngày – chức danh cần trình độ cao đẳng trở lên':g===3?'≤ 30 ngày – chức danh cần trình độ trung cấp, công nhân kỹ thuật':'≤ 6 ngày làm việc – công việc khác';

/* ---------- Kênh tuyển dụng (mô phỏng) ---------- */
const CHANNELS=[
 {id:'linkedin',name:'LinkedIn',type:'Mạng xã hội nghề nghiệp',paid:1,cpc:18000,ctr:.011,col:'#0a66c2'},
 {id:'facebook',name:'Facebook',type:'Mạng xã hội',paid:1,cpc:4500,ctr:.018,col:'#1877f2'},
 {id:'tiktok',name:'TikTok',type:'Video ngắn',paid:1,cpc:2500,ctr:.022,col:'#ee1d52'},
 {id:'zalo',name:'Zalo OA',type:'Nhắn tin & cộng đồng',paid:1,cpc:3000,ctr:.02,col:'#0068ff'},
 {id:'topcv',name:'TopCV',type:'Trang việc làm',paid:1,cpc:6000,ctr:.03,col:'#00b14f'},
 {id:'vnw',name:'VietnamWorks',type:'Trang việc làm',paid:1,cpc:8000,ctr:.025,col:'#ff7d55'},
 {id:'itviec',name:'ITviec',type:'Trang việc làm IT',paid:1,cpc:12000,ctr:.028,col:'#c8102e'},
 {id:'career',name:'Trang tuyển dụng AMG',type:'Kênh sở hữu',paid:0,col:'#0b6e63'},
 {id:'referral',name:'Giới thiệu nội bộ',type:'Nhân viên giới thiệu',paid:0,col:'#7a5af8'},
 {id:'campus',name:'Campus & ngày hội việc làm',type:'Sự kiện',paid:0,col:'#d97706'},
 {id:'headhunt',name:'Headhunter',type:'Đối tác tuyển dụng',paid:0,col:'#9a3412'},
 {id:'internal',name:'Ứng viên nội bộ',type:'Luân chuyển nội bộ',paid:0,col:'#2b7a3d'}];
const CH=Object.fromEntries(CHANNELS.map(c=>[c.id,c]));
const MSG_TYPES={brand:'Thương hiệu tuyển dụng',target:'Nhắm mục tiêu',rjp:'Xem trước thực tế công việc (RJP)'};
function sourceMix(r){
  const g=r.grade,w={};const add=(k,v)=>w[k]=(w[k]||0)+v;
  if(g<=3){add('facebook',.25);add('tiktok',.15);add('zalo',.15);add('campus',.2);add('referral',.2);add('topcv',.05)}
  else if(g<=6){add('topcv',.22);add('vnw',.18);add('facebook',.1);add('linkedin',.12);add('career',.12);add('referral',.16);add('internal',.05);if(r.dept==='IT'||r.dept==='RND')add('itviec',.25)}
  else{add('linkedin',.35);add('referral',.15);add('vnw',.12);add('career',.1);add('internal',.12)}
  const c=String(r.channel||'').toLowerCase();
  [['linkedin','linkedin'],['topcv','topcv'],['vietnamworks','vnw'],['itviec','itviec'],['giới thiệu','referral'],['headhunt','headhunt'],['ngày hội','campus'],['facebook','facebook'],['tiktok','tiktok']].forEach(([kw,id])=>{if(c.includes(kw))add(id,.5)});
  const tot=sum(Object.values(w));return Object.entries(w).map(([id,v])=>({id,w:v/tot})).sort((a,b)=>b.w-a.w);
}
const pickW=(mix,x)=>{let s=0;for(const m of mix){s+=m.w;if(x<=s)return m.id}return mix[mix.length-1].id};

/* ---------- Khung năng lực 3 tầng (cốt lõi – lãnh đạo – chuyên môn), mô hình ASK, ánh xạ Great Eight ---------- */
const G8=['Lãnh đạo & ra quyết định','Hỗ trợ & hợp tác','Tương tác & trình bày','Phân tích & diễn giải','Sáng tạo & hình thành ý tưởng','Tổ chức & thực thi','Thích ứng & chịu áp lực','Tạo kết quả & tinh thần doanh nhân'];
const LV=['1 · Cơ bản','2 · Phát triển','3 · Thành thạo','4 · Nâng cao','5 · Chuyên gia'];
const COMP=[
 {id:'INT',tier:'core',n:'Chính trực & tuân thủ',g8:6,d:'Hành động trung thực, tuân thủ pháp luật, quy tắc ứng xử và bảo mật thông tin.',A:'Trung thực, chịu trách nhiệm',S:'Nhận diện xung đột lợi ích, báo cáo vi phạm',K:'Quy tắc ứng xử, quy định chống tham nhũng, bảo mật dữ liệu',
  lv:['Tuân thủ quy định khi được nhắc','Chủ động tuân thủ, hỏi khi chưa rõ','Nhận diện và báo cáo rủi ro tuân thủ','Hướng dẫn người khác xử lý tình huống khó','Xây dựng chuẩn mực, làm gương cho tổ chức'],
  q:['Kể về lần bạn phát hiện một sai sót hoặc vi phạm có thể gây thiệt hại. Bạn đã làm gì và kết quả ra sao?','Hãy chia sẻ tình huống bạn bị áp lực phải “lách” quy trình để kịp tiến độ. Bạn xử lý thế nào?'],
  bars:{1:'Bỏ qua sai phạm hoặc đổ lỗi',3:'Báo cáo đúng kênh, sửa sai trong phạm vi của mình',5:'Xử lý triệt để, đề xuất kiểm soát để không lặp lại'}},
 {id:'CUS',tier:'core',n:'Hướng khách hàng',g8:2,d:'Hiểu và đáp ứng nhu cầu khách hàng nội bộ và bên ngoài.',A:'Tôn trọng, tận tâm',S:'Lắng nghe, xử lý phàn nàn',K:'Sản phẩm, quy trình dịch vụ, SLA',
  lv:['Phản hồi khi được yêu cầu','Đáp ứng đúng hạn yêu cầu thường gặp','Chủ động nắm bắt nhu cầu, xử lý phàn nàn','Thiết kế cải tiến trải nghiệm khách hàng','Định hướng văn hoá lấy khách hàng làm trung tâm'],
  q:['Kể về một khách hàng (nội bộ hoặc bên ngoài) rất không hài lòng mà bạn từng phục vụ. Bạn đã làm gì?','Chia sẻ lần bạn làm nhiều hơn yêu cầu để khách hàng thành công.'],
  bars:{1:'Phản ứng phòng thủ, không theo đến cùng',3:'Lắng nghe, đưa giải pháp và thời hạn rõ',5:'Giải quyết tận gốc, biến khách hàng thành người ủng hộ'}},
 {id:'TEAM',tier:'core',n:'Hợp tác',g8:1,d:'Làm việc hiệu quả với người khác vì mục tiêu chung.',A:'Cởi mở, tôn trọng khác biệt',S:'Chia sẻ thông tin, giải quyết bất đồng',K:'Vai trò các bộ phận liên quan',
  lv:['Làm phần việc được giao trong nhóm','Chủ động hỗ trợ đồng nghiệp','Kết nối liên phòng ban để giải quyết việc','Hoá giải xung đột, xây dựng đồng thuận','Kiến tạo mạng lưới hợp tác toàn tổ chức'],
  q:['Kể về lần bạn bất đồng với đồng nghiệp về cách làm. Bạn xử lý thế nào và kết quả ra sao?','Mô tả một dự án liên phòng ban bạn tham gia. Vai trò của bạn là gì?'],
  bars:{1:'Làm việc riêng lẻ, né tránh xung đột',3:'Trao đổi thẳng thắn, tìm phương án chung',5:'Dẫn dắt hợp tác, nâng hiệu quả cả nhóm'}},
 {id:'LEARN',tier:'core',n:'Học hỏi & thích ứng',g8:6,d:'Chủ động học kỹ năng mới và thích ứng với thay đổi.',A:'Ham học, cầu thị',S:'Tự học, áp dụng phản hồi',K:'Xu hướng nghề, công cụ mới',
  lv:['Học khi được đào tạo','Tự tìm hiểu kiến thức cần cho việc','Áp dụng nhanh kiến thức mới vào công việc','Chia sẻ, huấn luyện người khác','Dẫn dắt đổi mới, học tập của tổ chức'],
  q:['Kể về lần bạn phải học một kỹ năng hoàn toàn mới trong thời gian ngắn.','Chia sẻ một phản hồi tiêu cực bạn nhận được và bạn đã thay đổi thế nào.'],
  bars:{1:'Ngại thay đổi, chờ hướng dẫn',3:'Chủ động học và áp dụng có kết quả',5:'Biến bài học thành cải tiến cho cả nhóm'}},
 {id:'SAFE',tier:'core',n:'An toàn & chất lượng',g8:5,d:'Tuân thủ ATVSLĐ, làm đúng ngay từ đầu.',A:'Kỷ luật, cẩn trọng',S:'Nhận diện mối nguy, kiểm tra chất lượng',K:'Luật ATVSLĐ 2015, ISO 9001/14001/45001',
  lv:['Tuân thủ quy định an toàn cơ bản','Phát hiện và báo cáo mối nguy','Áp dụng kiểm soát rủi ro trong công việc','Huấn luyện, đánh giá an toàn khu vực','Xây dựng văn hoá an toàn – chất lượng'],
  q:['Kể về lần bạn dừng công việc vì lý do an toàn hoặc chất lượng.','Mô tả một cải tiến giúp giảm lỗi hoặc rủi ro mà bạn đã thực hiện.'],
  bars:{1:'Bỏ qua quy trình để kịp tiến độ',3:'Dừng, báo cáo và xử lý theo quy trình',5:'Phân tích nguyên nhân gốc và chuẩn hoá phòng ngừa'}},
 {id:'LEAD',tier:'lead',n:'Lãnh đạo đội nhóm',g8:0,d:'Định hướng, truyền cảm hứng và chịu trách nhiệm về kết quả của nhóm.',A:'Gương mẫu, công bằng',S:'Giao việc, tạo động lực, phản hồi',K:'Quản trị mục tiêu, quản trị thành tích',
  lv:['Dẫn dắt nhiệm vụ nhỏ','Điều phối nhóm nhỏ theo kế hoạch','Đặt mục tiêu, phản hồi, quản lý thành tích nhóm','Xây dựng đội ngũ hiệu suất cao','Lãnh đạo thay đổi quy mô tổ chức'],
  q:['Kể về lần nhóm của bạn không đạt mục tiêu. Bạn đã làm gì?','Chia sẻ cách bạn xử lý một thành viên có thành tích kém kéo dài.'],
  bars:{1:'Làm thay, không giao việc rõ ràng',3:'Đặt mục tiêu rõ, theo dõi và phản hồi định kỳ',5:'Phát huy tối đa đội ngũ, kết quả vượt mục tiêu bền vững'}},
 {id:'DEC',tier:'lead',n:'Ra quyết định',g8:0,d:'Ra quyết định kịp thời dựa trên dữ liệu và đánh giá rủi ro.',A:'Quyết đoán, chịu trách nhiệm',S:'Phân tích phương án, đánh giá rủi ro',K:'Công cụ phân tích quyết định',
  lv:['Quyết định việc thường ngày theo hướng dẫn','Quyết định trong phạm vi với dữ liệu sẵn có','Cân nhắc phương án, rủi ro trước khi quyết','Quyết định phức tạp khi thông tin chưa đầy đủ','Quyết định chiến lược ảnh hưởng toàn tổ chức'],
  q:['Kể về một quyết định khó bạn phải đưa ra khi thiếu thông tin.','Chia sẻ một quyết định sai của bạn và bạn học được gì.'],
  bars:{1:'Trì hoãn hoặc quyết theo cảm tính',3:'Có dữ liệu, có phương án dự phòng',5:'Quyết định đúng thời điểm, giải trình được, kết quả rõ'}},
 {id:'DEV',tier:'lead',n:'Phát triển người khác',g8:1,d:'Huấn luyện, kèm cặp và tạo cơ hội phát triển cho người khác.',A:'Quan tâm, kiên nhẫn',S:'Coaching, giao việc phát triển',K:'Mô hình 70-20-10, IDP',
  lv:['Chia sẻ kinh nghiệm khi được hỏi','Hướng dẫn người mới','Kèm cặp có kế hoạch, phản hồi phát triển','Xây dựng người kế nhiệm','Kiến tạo hệ thống phát triển nhân tài'],
  q:['Kể về một người bạn đã kèm cặp và sự tiến bộ của họ.','Bạn đã giúp một nhân viên vượt qua giai đoạn khó khăn như thế nào?'],
  bars:{1:'Không dành thời gian phát triển người khác',3:'Có kế hoạch kèm cặp và theo dõi tiến bộ',5:'Đào tạo được người kế nhiệm, lan toả văn hoá học tập'}},
 {id:'STRAT',tier:'lead',n:'Tư duy chiến lược',g8:4,d:'Nhìn xa, gắn công việc với chiến lược và thị trường.',A:'Tầm nhìn, chủ động',S:'Phân tích xu hướng, xây kế hoạch dài hạn',K:'Mô hình kinh doanh, thị trường, đối thủ',
  lv:['Hiểu mục tiêu bộ phận','Gắn công việc với mục tiêu năm','Xây kế hoạch 1–3 năm cho mảng phụ trách','Định hình chiến lược khối','Định hướng chiến lược tập đoàn'],
  q:['Kể về một sáng kiến dài hạn bạn đề xuất và triển khai.','Bạn đã điều chỉnh kế hoạch thế nào khi thị trường thay đổi bất ngờ?'],
  bars:{1:'Chỉ tập trung việc trước mắt',3:'Kế hoạch có mục tiêu, nguồn lực, rủi ro',5:'Tạo lợi thế cạnh tranh bền vững, đo được'}},
 {id:'NEG',tier:'func',n:'Đàm phán & thuyết phục',g8:2,d:'Đạt thoả thuận có lợi, giữ quan hệ lâu dài.',A:'Tự tin, tôn trọng',S:'Chuẩn bị BATNA, xử lý phản đối',K:'Giá, điều khoản hợp đồng',
  lv:['Trình bày phương án có sẵn','Đàm phán điều khoản tiêu chuẩn','Đàm phán hợp đồng giá trị lớn','Đàm phán đa bên, phức tạp','Đàm phán chiến lược cấp tập đoàn'],
  q:['Kể về thương vụ khó nhất bạn đã đàm phán thành công.','Chia sẻ lần đàm phán thất bại và bạn rút ra gì.'],bars:{1:'Nhượng bộ sớm, thiếu chuẩn bị',3:'Chuẩn bị kỹ, đạt thoả thuận đôi bên có lợi',5:'Tạo giá trị mới, quan hệ đối tác lâu dài'}},
 {id:'BIZ',tier:'func',n:'Phát triển kinh doanh',g8:7,d:'Tìm kiếm cơ hội, mở rộng khách hàng và doanh thu.',A:'Chủ động, kiên trì',S:'Tìm khách hàng, quản lý pipeline',K:'Thị trường B2B, CRM',
  lv:['Chăm sóc khách hàng có sẵn','Tìm khách hàng mới theo danh sách','Tự xây pipeline, đạt chỉ tiêu','Mở thị trường / ngành hàng mới','Định hình chiến lược tăng trưởng'],
  q:['Kể về khách hàng lớn nhất bạn tự tìm kiếm và chốt được.','Bạn làm gì khi chỉ đạt 60% chỉ tiêu giữa kỳ?'],bars:{1:'Chờ khách hàng tìm đến',3:'Pipeline đều, đạt chỉ tiêu',5:'Vượt chỉ tiêu bền vững, mở thị trường mới'}},
 {id:'CODE',tier:'func',n:'Kỹ thuật phần mềm',g8:5,d:'Thiết kế, viết và vận hành phần mềm tin cậy, an toàn.',A:'Tỉ mỉ, trách nhiệm',S:'Lập trình, kiểm thử, review code',K:'Kiến trúc, CSDL, bảo mật ứng dụng',
  lv:['Sửa lỗi theo hướng dẫn','Phát triển tính năng nhỏ độc lập','Thiết kế và phát triển module hoàn chỉnh','Thiết kế kiến trúc hệ thống','Định hướng công nghệ toàn tổ chức'],
  q:['Kể về sự cố production bạn từng xử lý. Nguyên nhân và cách khắc phục?','Mô tả một quyết định kỹ thuật bạn đưa ra và đánh đổi của nó.'],bars:{1:'Code chạy được nhưng thiếu kiểm thử',3:'Code sạch, có test, xử lý sự cố đúng quy trình',5:'Kiến trúc bền vững, nâng chuẩn kỹ thuật của nhóm'}},
 {id:'ANA',tier:'func',n:'Phân tích dữ liệu',g8:3,d:'Thu thập, phân tích dữ liệu để rút ra kết luận và đề xuất.',A:'Khách quan, kỹ lưỡng',S:'Excel/SQL, trực quan hoá, thống kê',K:'Chỉ số kinh doanh, phương pháp phân tích',
  lv:['Nhập và kiểm tra dữ liệu','Lập báo cáo theo mẫu','Phân tích nguyên nhân, đề xuất giải pháp','Xây mô hình phân tích, dự báo','Định hướng quản trị dựa trên dữ liệu'],
  q:['Kể về một phân tích của bạn làm thay đổi quyết định của quản lý.','Bạn xử lý thế nào khi dữ liệu không đầy đủ hoặc mâu thuẫn?'],bars:{1:'Báo cáo số liệu không kiểm chứng',3:'Phân tích đúng, có kết luận và đề xuất',5:'Mô hình hoá, tạo giá trị kinh doanh đo được'}},
 {id:'OPS',tier:'func',n:'Vận hành thiết bị & quy trình',g8:5,d:'Vận hành dây chuyền đúng quy trình, đạt năng suất và chất lượng.',A:'Kỷ luật, tập trung',S:'Vận hành, kiểm tra, xử lý bất thường',K:'SOP, thông số máy, tiêu chuẩn sản phẩm',
  lv:['Vận hành khi có giám sát','Vận hành độc lập công đoạn chính','Vận hành nhiều công đoạn, xử lý bất thường','Hướng dẫn tổ, tối ưu năng suất','Chuẩn hoá vận hành toàn nhà máy'],
  q:['Kể về lần máy móc gặp sự cố trong ca của bạn. Bạn đã làm gì?','Bạn đã làm gì để đạt sản lượng khi thiếu người trong ca?'],bars:{1:'Không tuân thủ SOP, xử lý sai cách',3:'Tuân thủ SOP, báo cáo bất thường kịp thời',5:'Cải tiến vận hành, giảm lỗi và thời gian dừng máy'}},
 {id:'LEAN',tier:'func',n:'Cải tiến liên tục (5S, Lean)',g8:4,d:'Phát hiện lãng phí và cải tiến quy trình.',A:'Chủ động, cầu tiến',S:'5S, Kaizen, PDCA, phân tích nguyên nhân gốc',K:'Lean, Six Sigma cơ bản',
  lv:['Thực hiện 5S tại vị trí','Đề xuất cải tiến nhỏ','Dẫn dắt dự án Kaizen','Triển khai Lean cho khu vực','Xây dựng hệ thống cải tiến toàn công ty'],
  q:['Kể về một cải tiến bạn đề xuất và kết quả đo được.','Bạn đã thuyết phục đồng nghiệp thay đổi cách làm cũ như thế nào?'],bars:{1:'Không đề xuất cải tiến',3:'Cải tiến có số liệu trước – sau',5:'Nhân rộng cải tiến, tiết kiệm đáng kể'}},
 {id:'MAINT',tier:'func',n:'Bảo trì & tự động hoá',g8:3,d:'Bảo trì phòng ngừa, xử lý sự cố, tự động hoá thiết bị.',A:'Cẩn trọng, trách nhiệm',S:'Đọc bản vẽ, PLC, xử lý sự cố',K:'Điện – cơ khí, TPM',
  lv:['Bảo trì theo checklist','Xử lý sự cố thường gặp','Lập kế hoạch bảo trì phòng ngừa','Thiết kế giải pháp tự động hoá','Chiến lược TPM toàn nhà máy'],
  q:['Kể về sự cố thiết bị phức tạp nhất bạn từng xử lý.','Bạn đã giảm thời gian dừng máy bằng cách nào?'],bars:{1:'Sửa chữa tạm thời, lỗi lặp lại',3:'Tìm đúng nguyên nhân, khắc phục dứt điểm',5:'Phòng ngừa chủ động, tăng OEE rõ rệt'}},
 {id:'QMS',tier:'func',n:'Hệ thống chất lượng & EHS',g8:5,d:'Duy trì hệ thống ISO, đánh giá và kiểm soát rủi ro EHS.',A:'Nguyên tắc, khách quan',S:'Đánh giá nội bộ, CAPA, đánh giá rủi ro',K:'ISO 9001/14001/45001, luật môi trường, ATVSLĐ',
  lv:['Thực hiện kiểm tra theo mẫu','Lập báo cáo không phù hợp','Dẫn dắt CAPA, đánh giá nội bộ','Quản lý hệ thống, làm việc với cơ quan quản lý','Chiến lược chất lượng – EHS tập đoàn'],
  q:['Kể về một sự không phù hợp nghiêm trọng bạn phát hiện và xử lý.','Bạn chuẩn bị cho một cuộc đánh giá chứng nhận như thế nào?'],bars:{1:'Ghi nhận nhưng không theo dõi khắc phục',3:'CAPA đúng hạn, có bằng chứng hiệu lực',5:'Phòng ngừa hệ thống, không phát sinh lỗi lặp'}},
 {id:'FINR',tier:'func',n:'Báo cáo tài chính & thuế',g8:3,d:'Hạch toán, lập báo cáo, tuân thủ chuẩn mực và thuế.',A:'Chính xác, bảo mật',S:'Hạch toán, đối chiếu, lập tờ khai',K:'VAS/IFRS, luật thuế',
  lv:['Hạch toán nghiệp vụ đơn giản','Lập tờ khai, đối chiếu định kỳ','Lập báo cáo tài chính, quyết toán','Tư vấn thuế, kiểm soát nội bộ','Chiến lược tài chính – thuế'],
  q:['Kể về sai lệch số liệu lớn bạn từng phát hiện khi đối chiếu.','Bạn cập nhật thay đổi chính sách thuế vào công việc thế nào?'],bars:{1:'Sai sót lặp lại',3:'Đúng hạn, đúng quy định, có đối chiếu',5:'Tối ưu thuế hợp pháp, kiểm soát rủi ro tốt'}},
 {id:'HRL',tier:'func',n:'Pháp luật lao động & C&B',g8:3,d:'Áp dụng đúng luật lao động, BHXH, thuế TNCN và chính sách đãi ngộ.',A:'Công bằng, bảo mật',S:'Tính lương, xử lý quan hệ lao động',K:'BLLĐ 2019, Luật BHXH 2024, Luật Việc làm 2025',
  lv:['Tra cứu quy định khi cần','Áp dụng quy định vào nghiệp vụ thường ngày','Xử lý tình huống quan hệ lao động phức tạp','Xây dựng chính sách nhân sự','Tư vấn chiến lược con người'],
  q:['Kể về tranh chấp lao động bạn đã tham gia giải quyết.','Bạn đã cập nhật quy định mới vào chính sách công ty như thế nào?'],bars:{1:'Áp dụng sai quy định',3:'Đúng luật, giải thích rõ cho người lao động',5:'Phòng ngừa rủi ro pháp lý, chính sách cạnh tranh'}},
 {id:'COMM',tier:'func',n:'Giao tiếp & trình bày',g8:2,d:'Truyền đạt rõ ràng, thuyết phục bằng lời nói và văn bản.',A:'Tự tin, cởi mở',S:'Trình bày, viết, lắng nghe',K:'Kỹ thuật trình bày, viết chuyên nghiệp',
  lv:['Truyền đạt thông tin đơn giản','Trình bày rõ trong nhóm','Thuyết phục nhiều bên liên quan','Truyền thông cho cấp quản lý cao','Đại diện tổ chức trước công chúng'],
  q:['Kể về lần bạn phải thuyết phục cấp trên thay đổi quyết định.','Bạn chuẩn bị cho một buổi trình bày quan trọng như thế nào?'],bars:{1:'Diễn đạt rời rạc, thiếu trọng tâm',3:'Rõ ràng, có cấu trúc, đúng đối tượng',5:'Truyền cảm hứng, thay đổi hành động người nghe'}},
 {id:'PLAN',tier:'func',n:'Hoạch định cung ứng',g8:5,d:'Lập kế hoạch mua hàng, tồn kho, giao vận tối ưu.',A:'Chủ động, cẩn thận',S:'Dự báo nhu cầu, quản lý tồn kho',K:'S&OP, Incoterms, ERP',
  lv:['Theo dõi đơn hàng','Lập kế hoạch nhập hàng định kỳ','Tối ưu tồn kho, đánh giá nhà cung cấp','Thiết kế mạng lưới cung ứng','Chiến lược chuỗi cung ứng'],
  q:['Kể về lần chuỗi cung ứng bị gián đoạn và bạn xử lý ra sao.','Bạn đã giảm tồn kho mà vẫn đảm bảo sản xuất như thế nào?'],bars:{1:'Thiếu/thừa hàng thường xuyên',3:'Kế hoạch chính xác, xử lý gián đoạn kịp thời',5:'Tối ưu chi phí toàn chuỗi, rủi ro thấp'}},
 {id:'DESIGN',tier:'func',n:'Thiết kế kỹ thuật',g8:4,d:'Thiết kế sản phẩm/mạch đáp ứng yêu cầu kỹ thuật và chi phí.',A:'Sáng tạo, chính xác',S:'CAD/EDA, mô phỏng, thử nghiệm',K:'Tiêu chuẩn kỹ thuật, vật liệu, linh kiện',
  lv:['Vẽ theo hướng dẫn','Thiết kế chi tiết độc lập','Thiết kế cụm/sản phẩm hoàn chỉnh','Dẫn dắt dự án R&D','Định hướng công nghệ sản phẩm'],
  q:['Kể về một thiết kế của bạn phải làm lại. Vì sao và bạn đã cải thiện thế nào?','Bạn cân bằng giữa chi phí và hiệu năng trong thiết kế ra sao?'],bars:{1:'Thiết kế thiếu kiểm chứng',3:'Đạt yêu cầu kỹ thuật, có thử nghiệm',5:'Đột phá, giảm chi phí, có sở hữu trí tuệ'}},
 {id:'LAW',tier:'func',n:'Pháp lý doanh nghiệp',g8:3,d:'Rà soát hợp đồng, tư vấn tuân thủ, quản trị rủi ro pháp lý.',A:'Thận trọng, độc lập',S:'Soạn thảo, rà soát hợp đồng',K:'Luật Doanh nghiệp, Dân sự, Thương mại, BVDLCN',
  lv:['Tra cứu văn bản','Rà soát hợp đồng mẫu','Tư vấn giao dịch phức tạp','Quản lý tranh chấp, làm việc với cơ quan','Chiến lược pháp lý tập đoàn'],
  q:['Kể về một rủi ro pháp lý bạn phát hiện kịp thời trong hợp đồng.','Bạn giải thích vấn đề pháp lý phức tạp cho người không chuyên thế nào?'],bars:{1:'Bỏ sót điều khoản rủi ro',3:'Nhận diện và đề xuất phương án an toàn',5:'Phòng ngừa chủ động, bảo vệ lợi ích tối đa'}},
];
const CP=Object.fromEntries(COMP.map(c=>[c.id,c]));
const FUNC={SAL:['NEG','BIZ'],MKT:['COMM','ANA'],IT:['CODE','ANA'],RND:['DESIGN','ANA'],PRD:['OPS','LEAN'],ENG:['MAINT','LEAN'],QA:['QMS','ANA'],FIN:['FINR','ANA'],HR:['HRL','COMM'],SCM:['PLAN','NEG'],LEG:['LAW','COMM'],BOD:['STRAT','BIZ']};
function roleProfile(r){
  const g=r.grade,out=[];
  const core=g<=3?2:g<=6?3:g<=8?3:4;
  ['INT','CUS','TEAM','LEARN','SAFE'].forEach(id=>out.push({id,req:id==='SAFE'&&['PRD','ENG','QA'].includes(r.dept)?core+1>5?5:core+1:core,w:id==='INT'?1.2:1}));
  if(g>=7)['LEAD','DEC','DEV','STRAT'].forEach(id=>out.push({id,req:g>=11?5:g>=9?4:3,w:g>=9?1.3:1}));
  (FUNC[r.dept]||['ANA','COMM']).forEach(id=>{if(!out.find(x=>x.id===id))out.push({id,req:g<=3?2:g<=5?3:4,w:1.5})});
  return out;
}
const interviewComps=r=>{const p=roleProfile(r);const pick=p.filter(x=>CP[x.id].tier==='func');const core=p.filter(x=>['INT','TEAM','CUS','SAFE','LEARN'].includes(x.id)).sort((a,b)=>b.w-a.w);const lead=p.filter(x=>CP[x.id].tier==='lead').slice(0,2);return[...pick,...lead,...core].slice(0,6)};

/* ---------- Phân tích công việc → JD (mô hình KSAO và ASK) ---------- */
const FAM={
 SAL:{p:'Phát triển doanh thu và quan hệ khách hàng doanh nghiệp tại khu vực được giao',t:['Tìm kiếm, tiếp cận và chuyển đổi khách hàng doanh nghiệp mới','Quản lý pipeline và cập nhật cơ hội trên CRM hằng tuần','Lập báo giá, đàm phán điều khoản và hợp đồng theo phân quyền','Phối hợp kỹ thuật, kho vận để giao hàng đúng hạn','Thu hồi công nợ và báo cáo doanh số định kỳ'],K:['Kiến thức thiết bị điện tử công nghiệp hoặc B2B','Quy trình bán hàng tư vấn','Điều khoản thanh toán, Incoterms cơ bản'],S:['Đàm phán, thuyết trình','Sử dụng CRM, Excel','Quản lý thời gian và khu vực'],O:['Sẵn sàng đi công tác','Có bằng lái xe là lợi thế']},
 MKT:{p:'Xây dựng thương hiệu và tạo nhu cầu cho sản phẩm, đồng thời hỗ trợ thương hiệu tuyển dụng',t:['Lập kế hoạch nội dung đa kênh theo tháng','Sản xuất nội dung bài viết, video ngắn, landing page','Theo dõi chỉ số chiến dịch và tối ưu ngân sách','Phối hợp HR triển khai chiến dịch thương hiệu tuyển dụng','Quản lý agency và nhà cung cấp sáng tạo'],K:['Marketing số, SEO, quảng cáo mạng xã hội','Luật Quảng cáo và quy định bảo vệ dữ liệu','Hành vi người dùng B2B'],S:['Viết, biên tập','Phân tích số liệu chiến dịch','Công cụ thiết kế cơ bản'],O:['Portfolio sản phẩm đã thực hiện']},
 IT:{p:'Phát triển, vận hành và bảo mật hệ thống công nghệ, dữ liệu phục vụ hoạt động kinh doanh',t:['Phân tích yêu cầu nghiệp vụ và thiết kế giải pháp','Phát triển, kiểm thử và triển khai tính năng','Giám sát, xử lý sự cố và bảo đảm an toàn thông tin','Viết tài liệu kỹ thuật, review code','Phối hợp người dùng để cải tiến hệ thống'],K:['Kiến trúc phần mềm, cơ sở dữ liệu','Bảo mật ứng dụng (OWASP), bảo vệ dữ liệu cá nhân','Quy trình Agile/Scrum'],S:['Lập trình (Java/Node/Python) hoặc SQL, BI','Git, CI/CD','Giải quyết vấn đề'],O:['Chứng chỉ chuyên môn là lợi thế']},
 RND:{p:'Nghiên cứu, thiết kế và thử nghiệm sản phẩm thiết bị điện tử công nghiệp mới',t:['Thiết kế mạch, cơ khí theo yêu cầu sản phẩm','Mô phỏng, chế thử và thử nghiệm mẫu','Lập hồ sơ kỹ thuật, BOM','Phối hợp sản xuất chuyển giao sản phẩm mới','Theo dõi công nghệ, đề xuất cải tiến'],K:['Điện tử, vi điều khiển, tiêu chuẩn IEC','Vật liệu, linh kiện','Quản lý vòng đời sản phẩm'],S:['Phần mềm EDA/CAD','Thử nghiệm và phân tích lỗi','Đọc tài liệu kỹ thuật tiếng Anh'],O:['Bằng kỹ sư điện – điện tử hoặc tương đương']},
 PRD:{p:'Vận hành dây chuyền sản xuất an toàn, đạt sản lượng và chất lượng theo kế hoạch',t:['Vận hành máy và công đoạn theo SOP','Kiểm tra chất lượng sản phẩm tại công đoạn','Thực hiện 5S, ghi chép sổ sách ca','Báo cáo bất thường máy móc, chất lượng','Tham gia đào tạo an toàn và cải tiến'],K:['Quy trình vận hành, tiêu chuẩn sản phẩm','Nội quy an toàn lao động'],S:['Thao tác chính xác, khéo léo','Đọc hiểu hướng dẫn công việc'],O:['Sẵn sàng làm việc theo ca','Đủ 18 tuổi trở lên']},
 ENG:{p:'Bảo đảm thiết bị nhà máy vận hành ổn định, an toàn và hiệu quả',t:['Bảo trì phòng ngừa theo kế hoạch TPM','Xử lý sự cố điện, cơ khí, PLC','Lắp đặt, chạy thử thiết bị mới','Quản lý phụ tùng, hồ sơ thiết bị','Đề xuất dự án tự động hoá'],K:['Điện công nghiệp, cơ khí, khí nén','PLC, HMI, cảm biến','Quy chuẩn an toàn thiết bị nghiêm ngặt'],S:['Đọc bản vẽ kỹ thuật','Chẩn đoán lỗi','Sử dụng dụng cụ đo'],O:['Chứng chỉ an toàn điện theo quy định']},
 QA:{p:'Duy trì hệ thống chất lượng và môi trường – an toàn – sức khoẻ (EHS) theo ISO và pháp luật',t:['Kiểm soát chất lượng đầu vào, quá trình, thành phẩm','Đánh giá nội bộ ISO 9001/14001/45001','Quản lý CAPA và khiếu nại khách hàng','Huấn luyện ATVSLĐ, quan trắc môi trường','Lập báo cáo với cơ quan quản lý'],K:['ISO 9001/14001/45001','Luật ATVSLĐ 2015, Luật Bảo vệ môi trường 2020','Công cụ thống kê chất lượng'],S:['Đánh giá, phân tích nguyên nhân gốc','Lập báo cáo','Huấn luyện'],O:['Chứng chỉ đánh giá viên nội bộ là lợi thế']},
 FIN:{p:'Bảo đảm số liệu tài chính chính xác, tuân thủ chuẩn mực kế toán và pháp luật thuế',t:['Hạch toán, đối chiếu công nợ, ngân hàng','Lập tờ khai thuế GTGT, TNCN, TNDN','Lập báo cáo tài chính, quản trị','Phối hợp kiểm toán','Kiểm soát chi phí, ngân sách'],K:['Chuẩn mực kế toán VAS, IFRS cơ bản','Luật thuế hiện hành','Kiểm soát nội bộ'],S:['Excel nâng cao, phần mềm kế toán/ERP','Phân tích số liệu'],O:['Chứng chỉ kế toán trưởng / ACCA là lợi thế']},
 HR:{p:'Thu hút, phát triển và giữ chân nhân tài, bảo đảm tuân thủ pháp luật lao động',t:['Tư vấn nhân sự cho khối kinh doanh','Triển khai tuyển dụng, onboarding','Quản lý C&B, BHXH, thuế TNCN','Xử lý quan hệ lao động, kỷ luật','Phân tích dữ liệu nhân sự'],K:['BLLĐ 2019, Luật BHXH 2024, Luật Việc làm 2025','Hệ thống lương 3P, khung năng lực','Luật Bảo vệ dữ liệu cá nhân 2025'],S:['Phỏng vấn hành vi, coaching','Phân tích dữ liệu nhân sự','Giao tiếp, thuyết phục'],O:['Chứng chỉ HR (SHRM/CIPD) là lợi thế']},
 SCM:{p:'Bảo đảm nguồn cung, tồn kho và giao vận tối ưu chi phí, đúng thời hạn',t:['Lập kế hoạch mua hàng, tồn kho','Đánh giá, đàm phán với nhà cung cấp','Theo dõi đơn hàng, thủ tục xuất nhập khẩu','Quản lý kho theo FIFO/FEFO','Báo cáo KPI chuỗi cung ứng'],K:['S&OP, Incoterms 2020','Thủ tục hải quan','Quản lý kho'],S:['ERP, Excel','Đàm phán','Phân tích chi phí'],O:['Sẵn sàng làm việc tại nhà máy Đồng Nai']},
 LEG:{p:'Quản trị rủi ro pháp lý, bảo đảm hoạt động tuân thủ pháp luật Việt Nam và quốc tế',t:['Soạn thảo, rà soát hợp đồng','Tư vấn tuân thủ cho các khối','Theo dõi thay đổi pháp luật','Quản lý giấy phép, sở hữu trí tuệ','Phối hợp luật sư bên ngoài khi tranh chấp'],K:['Luật Doanh nghiệp, Dân sự, Thương mại','Luật BVDLCN 2025, pháp luật cạnh tranh','Pháp luật lao động'],S:['Soạn thảo, lập luận','Tiếng Anh pháp lý'],O:['Cử nhân Luật trở lên']},
 BOD:{p:'Định hướng chiến lược và điều hành hoạt động của tập đoàn tại Việt Nam',t:['Xây dựng chiến lược và kế hoạch kinh doanh','Điều hành ngân sách, nguồn lực','Phát triển đội ngũ lãnh đạo kế cận','Đại diện công ty với đối tác, cơ quan quản lý','Quản trị rủi ro và tuân thủ'],K:['Quản trị doanh nghiệp đa quốc gia','Tài chính doanh nghiệp','Pháp luật kinh doanh'],S:['Lãnh đạo, ra quyết định','Đàm phán cấp cao'],O:['Tối thiểu 12 năm kinh nghiệm quản lý']},
};
const EDU_REQ=g=>g<=2?'Không yêu cầu bằng cấp (biết đọc, viết)':g===3?'Trung cấp/nghề trở lên':g<=5?'Cao đẳng trở lên':'Đại học trở lên';
const EXP_REQ=g=>g<=2?0:g===3?1:g<=5?1:g<=7?3:g<=9?6:10;
function salaryBand(g){const m=scaleMid(g);return{min:Math.round(m*.85/1e5)*1e5,mid:m,max:Math.round(m*1.2/1e5)*1e5}}
function jdFor(r){
  const f=FAM[r.dept]||FAM.HR,ov=S.col.jds[r.id]||{},g=r.grade,band=salaryBand(g),site=Object.keys((DEPT[r.dept]||{sites:{HCM:1}}).sites)[0];
  const prof=roleProfile(r);
  const lead=g>=7?['Quản lý, phát triển đội ngũ trực tiếp','Chịu trách nhiệm KPI của nhóm']:[];
  const jd={id:r.id,title:r.title,dept:r.dept,grade:g,site,purpose:f.p,
    tasks:[...f.t,...lead],K:f.K,S:f.S,A:prof.filter(x=>CP[x.id].tier==='core').map(x=>CP[x.id].A),O:f.O,
    edu:EDU_REQ(g),exp:EXP_REQ(g),band,report:g>=11?'Tổng Giám đốc':g>=9?'Giám đốc khối':g>=7?'Trưởng phòng':'Trưởng nhóm / Tổ trưởng',
    cond:r.dept==='PRD'||r.dept==='ENG'?'Làm việc theo ca 8 giờ tại nhà máy; có xe đưa đón; trang bị bảo hộ lao động đầy đủ':'Giờ hành chính thứ 2 – thứ 6; làm việc linh hoạt tối đa 2 ngày/tuần với vị trí văn phòng',
    prob:probDaysOf(g),extra:'',approved:true,...ov};
  jd.must=[jd.edu,jd.exp?`Tối thiểu ${jd.exp} năm kinh nghiệm liên quan`:'Không yêu cầu kinh nghiệm, được đào tạo',...(f.O||[]).filter(x=>/bằng|chứng chỉ|Cử nhân|18 tuổi/i.test(x))];
  jd.nice=(f.O||[]).filter(x=>!jd.must.includes(x));
  return jd;
}
function jdText(jd){
  const r=M.reqs.find(x=>x.id===jd.id)||{};
  return `MÔ TẢ CÔNG VIỆC – ${jd.title.toUpperCase()}
Mã yêu cầu: ${jd.id} · Khối: ${(DEPT[jd.dept]||{}).name||jd.dept} · Bậc: GS${z2(jd.grade)} · Nơi làm việc: ${(SITES[jd.site]||SITES.HCM).name}
Báo cáo cho: ${jd.report} · Số lượng: ${r.qty||1}

1. MỤC ĐÍCH CÔNG VIỆC
${jd.purpose}.

2. TRÁCH NHIỆM CHÍNH
${jd.tasks.map((t,i)=>`${i+1}. ${t}`).join('\n')}

3. YÊU CẦU (KSAO)
Kiến thức (K): ${jd.K.join('; ')}
Kỹ năng (S): ${jd.S.join('; ')}
Năng lực/thái độ (A): ${jd.A.join('; ')}
Yếu tố khác (O): ${(jd.O||[]).join('; ')||'—'}
Bắt buộc: ${jd.must.join('; ')}
Ưu tiên: ${jd.nice.join('; ')||'—'}

4. ĐIỀU KIỆN LÀM VIỆC
${jd.cond}.
Thời gian thử việc: tối đa ${jd.prob} ngày, lương thử việc ${P('probPay')}% lương chính thức (Điều 25–26 BLLĐ 2019).

5. THU NHẬP & PHÚC LỢI
Lương cơ bản (P1): ${fmtM(jd.band.min)} – ${fmtM(jd.band.max)}/tháng, cộng P2 năng lực và P3 thành tích; đóng BHXH, BHYT, BHTN đầy đủ; bảo hiểm sức khoẻ; ${P('leaveBase')} ngày phép năm; thưởng tháng 13; đào tạo theo lộ trình.
${jd.extra?'\n'+jd.extra+'\n':''}
AMG là nhà tuyển dụng bình đẳng: không phân biệt giới tính, tuổi, dân tộc, tôn giáo, tình trạng hôn nhân, khuyết tật hay xuất thân. AMG không thu bất kỳ khoản phí nào của ứng viên và không giữ bản chính giấy tờ tuỳ thân, văn bằng.`;
}
/* Kiểm tra ngôn từ phân biệt đối xử / vi phạm trong JD, tin đăng */
const BIAS=[
 [/\b(chỉ\s+)?(tuyển|ưu tiên)\s+(nam|nữ)\b|\bgiới tính\s*:\s*(nam|nữ)/i,'Yêu cầu giới tính không xuất phát từ tính chất công việc','Điều 8 khoản 1 BLLĐ 2019; Luật Bình đẳng giới 2006; ILO C111'],
 [/(dưới|không quá|tối đa|từ)\s*\d{2}\s*tuổi|độ tuổi\s*\d{2}\s*[-–]\s*\d{2}/i,'Giới hạn độ tuổi (chỉ được yêu cầu từ đủ 18 tuổi khi công việc đòi hỏi)','Điều 8 BLLĐ 2019; Luật Việc làm 2025 (không phân biệt đối xử)'],
 [/ngoại hình|chiều cao|cân nặng|ưa nhìn|xinh/i,'Yêu cầu ngoại hình không liên quan công việc','Điều 8 BLLĐ 2019'],
 [/độc thân|chưa (kết hôn|lập gia đình|có con)|kế hoạch (sinh con|mang thai)/i,'Phân biệt theo tình trạng hôn nhân, thai sản','Điều 8, Điều 137 BLLĐ 2019'],
 [/hộ khẩu|quê quán|người địa phương/i,'Phân biệt theo nơi cư trú/quê quán','Điều 8 BLLĐ 2019'],
 [/tôn giáo|dân tộc kinh|không theo đạo/i,'Phân biệt theo dân tộc, tôn giáo','Điều 8 BLLĐ 2019; ILO C111'],
 [/đặt cọc|ký quỹ|phí (hồ sơ|tuyển dụng|đào tạo trước)|nộp tiền/i,'Thu tiền của người lao động khi tuyển dụng','Điều 11 khoản 2 và Điều 17 BLLĐ 2019'],
 [/giữ bản (chính|gốc)|nộp bản gốc|giữ (bằng|CCCD|căn cước)/i,'Giữ bản chính giấy tờ tuỳ thân, văn bằng','Điều 17 BLLĐ 2019'],
 [/khuyết tật.*không|không nhận người khuyết tật/i,'Loại trừ người khuyết tật','Luật Người khuyết tật 2010; Điều 8 BLLĐ 2019'],
 [/không (nhận|tuyển) người (có HIV|nhiễm HIV)/i,'Phân biệt người có HIV','Luật Phòng, chống HIV/AIDS'],
];
function biasCheck(text){const out=[];for(const[re,msg,law]of BIAS){const m=String(text).match(re);if(m)out.push({hit:m[0],msg,law})}return out}

/* ---------- Thư viện câu hỏi trắc nghiệm (tự biên soạn) ---------- */
const TEST_SEC={V:'Ngôn ngữ',N:'Số học',L:'Logic',J:'Tình huống (SJT)'};
const QBANK=[
 {id:'V1',s:'V',q:'“Mọi phiếu đề xuất tuyển dụng phải được trưởng bộ phận và HRBP phê duyệt trước khi đăng tin.” Câu nào chắc chắn đúng?',o:['Có thể đăng tin khi chỉ trưởng bộ phận đã duyệt','Cần đủ hai người phê duyệt trước khi đăng tin','HRBP là người lập phiếu đề xuất','Quy định chỉ áp dụng cho vị trí quản lý'],a:1},
 {id:'V2',s:'V',q:'Từ nào gần nghĩa nhất với “minh bạch”?',o:['Rõ ràng, công khai','Nhanh chóng','Kín đáo','Linh hoạt'],a:0},
 {id:'V3',s:'V',q:'“Tất cả kỹ sư nhóm A đều có chứng chỉ an toàn điện. Lan là kỹ sư nhóm A.” Kết luận nào đúng?',o:['Lan có thể chưa có chứng chỉ','Lan có chứng chỉ an toàn điện','Chỉ nhóm A có chứng chỉ','Không kết luận được gì về Lan'],a:1},
 {id:'V4',s:'V',q:'Câu nào phù hợp nhất để mở đầu email mời phỏng vấn?',o:['Bạn phải có mặt lúc 9h, đến muộn sẽ bị loại.','Cảm ơn Anh/Chị đã quan tâm vị trí Kỹ sư quy trình; chúng tôi trân trọng mời Anh/Chị phỏng vấn lúc 9:00 ngày 20/11.','Lịch phỏng vấn đính kèm, tự xem.','Chúng tôi chưa chắc có tuyển nhưng bạn cứ đến.'],a:1},
 {id:'V5',s:'V',q:'“Nhà máy chạy 3 ca; ca đêm từ 22:00 đến 06:00.” Điều nào suy ra được?',o:['Ca đêm dài 8 giờ','Ca đêm không được trả phụ cấp','Nhà máy nghỉ chủ nhật','Mỗi ca có 50 người'],a:0},
 {id:'N1',s:'N',q:'Chiến dịch chi 24 triệu đồng, nhận 300 hồ sơ. Chi phí trung bình mỗi hồ sơ là bao nhiêu?',o:['8.000 đ','80.000 đ','800.000 đ','125.000 đ'],a:1},
 {id:'N2',s:'N',q:'Doanh số tăng từ 2,0 tỷ lên 2,5 tỷ đồng. Mức tăng là bao nhiêu phần trăm?',o:['20%','25%','50%','2,5%'],a:1},
 {id:'N3',s:'N',q:'Lương chính thức 20 triệu đồng, lương thử việc tối thiểu 85%. Lương thử việc tối thiểu là?',o:['15 triệu','17 triệu','18,5 triệu','19 triệu'],a:1},
 {id:'N4',s:'N',q:'400 người ứng tuyển, 120 đạt sàng lọc, 30 được phỏng vấn. Tỷ lệ phỏng vấn trên ứng tuyển là?',o:['25%','7,5%','30%','12%'],a:1},
 {id:'N5',s:'N',q:'Dây chuyền làm 450 sản phẩm/giờ, tỷ lệ lỗi 2%. Trong 8 giờ có bao nhiêu sản phẩm đạt?',o:['3.528','3.600','3.672','3.456'],a:0},
 {id:'L1',s:'L',q:'Số tiếp theo của dãy: 2, 6, 12, 20, 30, ?',o:['36','40','42','44'],a:2},
 {id:'L2',s:'L',q:'Số tiếp theo của dãy: 3, 9, 27, ?',o:['54','81','36','90'],a:1},
 {id:'L3',s:'L',q:'Mọi A là B; một số B là C. Kết luận nào chắc chắn đúng?',o:['Mọi A là C','Một số A là C','Không A nào là C','Không đủ căn cứ kết luận A có là C hay không'],a:3},
 {id:'L4',s:'L',q:'4 người xếp hàng: S đứng đầu; P đứng trước Q; R đứng sau Q. Ai đứng thứ hai?',o:['P','Q','R','S'],a:0},
 {id:'L5',s:'L',q:'Mã hoá: mỗi chữ cái dịch lên 1 (A→B). “DUNG” được mã hoá thành?',o:['EVOH','CTMF','EVNH','DVOH'],a:0},
 {id:'J1',s:'J',q:'Bạn phát hiện đồng nghiệp nhập sai số liệu trong báo cáo sắp gửi khách hàng. Cách làm tốt nhất?',o:['Im lặng vì không phải việc của mình','Báo ngay đồng nghiệp, cùng kiểm tra và sửa trước khi gửi','Báo cáo quản lý để đồng nghiệp bị kỷ luật','Tự sửa mà không cho ai biết'],a:1},
 {id:'J2',s:'J',q:'Trong buổi phỏng vấn, đồng nghiệp hỏi ứng viên nữ về kế hoạch kết hôn, sinh con. Bạn nên?',o:['Ghi nhận câu trả lời vào phiếu chấm','Nhắc nhẹ rằng câu hỏi không liên quan công việc và quay lại câu hỏi năng lực','Đồng tình vì cần biết để bố trí công việc','Kết thúc phỏng vấn ngay'],a:1},
 {id:'J3',s:'J',q:'Gần hết ca, máy báo lỗi cảm biến an toàn nhưng vẫn chạy được, đơn hàng đang gấp. Bạn sẽ?',o:['Tắt cảm biến để chạy tiếp','Dừng máy theo quy trình và báo tổ trưởng/EHS','Chạy tiếp rồi báo sau ca','Nhờ người khác vận hành thay'],a:1},
 {id:'J4',s:'J',q:'Khách hàng gọi điện phàn nàn gay gắt về giao hàng trễ. Phản hồi đầu tiên phù hợp nhất?',o:['Giải thích lỗi do bộ phận kho','Lắng nghe, xác nhận vấn đề, cam kết giải pháp và thời hạn cụ thể','Đề nghị khách gọi lại sau','Chuyển máy cho quản lý ngay'],a:1},
 {id:'J5',s:'J',q:'Sau khi chọn nhà cung cấp, bạn nhận được phong bì “cảm ơn”. Bạn sẽ?',o:['Nhận vì đã chọn xong','Từ chối và báo cáo theo quy tắc ứng xử','Nhận rồi chia cho nhóm','Gửi lại sau vài tháng'],a:1},
];
const TEST_MIN=15;

/* ---------- Ma trận sàng lọc CV & quyết định ---------- */
const CV_CRIT=[['exp','Kinh nghiệm liên quan',30],['skill','Kỹ năng chuyên môn khớp JD',30],['edu','Học vấn, chứng chỉ',15],['ach','Thành tích định lượng',15],['sal','Lương kỳ vọng trong khung',10]];
const KO=[['age','Đủ 18 tuổi (BLLĐ 2019, Điều 143 về lao động chưa thành niên)'],['consent','Đồng ý xử lý dữ liệu cá nhân (Luật BVDLCN 2025)'],['must','Đáp ứng yêu cầu bắt buộc của JD'],['wp','Có/được bảo lãnh giấy phép lao động (ứng viên nước ngoài)']];
const TA_DEF={wCv:20,wTest:25,wInt:40,wRef:15,cvCut:60,testCut:50,intCut:3,retention:12,referralBonus:4e6,headhuntFee:18,recruiterHour:180000,panelHour:350000};
const TS=k=>{const o=(S.col.taSettings.main||{})[k];return o===undefined||o===''?TA_DEF[k]:Number(o)};

/* ---------- Sinh ứng viên mô phỏng (khớp số liệu phễu của từng yêu cầu) ---------- */
const CITY=['TP.HCM','Hà Nội','Đồng Nai','Bình Dương','Đà Nẵng','Long An','Hải Phòng','Cần Thơ','Bắc Ninh','Khác'];
let TA_BASE=null;
function genCandidates(){
  const out=[],used=new Set(),T=ANCHOR;let n=0;
  const hires2026=S.base.filter(e=>e.hire>='2026-01-01');
  for(const r of S.reqBase){
    const done=r.status==='Hoàn tất',mix=sourceMix(r),open=parse(r.opened),end=done?parse(r.closed):T;
    const N=r.applied,reach=[N,r.screened,0,r.interviewed,0,r.offered,r.hired];
    reach[2]=Math.round(r.interviewed+(r.screened-r.interviewed)*.6);reach[4]=Math.round(r.offered+(r.interviewed-r.offered)*.55);
    for(let k=1;k<7;k++)reach[k]=Math.min(reach[k],reach[k-1]);
    const q=Array.from({length:N},()=>tg()).sort((a,b)=>b-a);
    const fem=(DEPT[r.dept]||{fem:.5}).fem,band=salaryBand(r.grade),prof=interviewComps(r);
    for(let i=0;i<N;i++){
      n++;let st=0;for(let k=6;k>=1;k--)if(i<reach[k]){st=k;break}
      const qi=q[i],f=RT()<fem,src=r.grade>=8&&RT()<.18&&String(r.channel).includes('Headhunt')?'headhunt':pickW(mix,RT());
      const applied=addDays(open,Math.floor(RT()*Math.max(3,days(open,end)-(st>=5?14:3))));
      const dt=[applied];for(let k=1;k<=6;k++)dt[k]=addDays(dt[k-1],k===6?tri(14,30):tri(2,7));
      const name=`${tp(SURN)} ${f?tp(MIDF):tp(MIDM)} ${f?tp(GIVF):tp(GIVM)}`;
      const exp=Math.max(0,Math.round(EXP_REQ(r.grade)+qi*1.6+tb(-1,2)));
      const cvParts={exp:clamp(Math.round(3+qi*.8+tb(-.8,.8)),1,5),skill:clamp(Math.round(3+qi*.9+tb(-.8,.8)),1,5),edu:clamp(Math.round(3+qi*.5+tb(-1,1)),1,5),ach:clamp(Math.round(2.8+qi*.8+tb(-1,1)),1,5),sal:clamp(Math.round(3.4+tb(-1.6,1.6)),1,5)};
      const c={id:'UV'+String(n).padStart(5,'0'),req:r.id,name,gender:f?'Nữ':'Nam',yob:2026-tri(19,24)-Math.min(30,exp)-tri(0,4),city:tp(CITY),src,edu:r.grade<=2?tp(['THPT','THPT','Trung cấp']):r.grade<=3?tp(['Trung cấp','Cao đẳng']):r.grade<=5?tp(['Cao đẳng','Đại học','Đại học']):tp(['Đại học','Đại học','Thạc sĩ']),
        exp,expect:Math.round(band.mid*clamp(1+qi*.06+tb(-.1,.2),.8,1.35)/1e5)*1e5,cvParts,ko:{age:true,consent:true,must:st>=1||RT()>.3,wp:true},
        test:null,ints:null,ref:null,st,status:'active',reason:'',dates:dt.slice(0,st+1).map(iso),consentAt:iso(applied),nps:clamp(Math.round(7+qi*1.2+tb(-2.5,2)),0,10),q:qi,emp:null,base:true,msg:tp(['brand','target','rjp'])};
      if(st>=2){const sc=()=>clamp(Math.round(58+qi*13+tb(-14,14)),5,100);c.test={V:sc(),N:sc(),L:sc(),J:sc(),at:c.dates[2]}}
      if(st>=3){c.ints={};for(const p of prof){const b=p.req+qi*.7+tb(-.7,.6);c.ints[p.id]=[clamp(Math.round(b),1,5),clamp(Math.round(b+tb(-.6,.6)),1,5)]}}
      if(st>=4)c.ref=RT()<.9?'ok':'note';
      // trạng thái cuối
      const last=parse(c.dates[st]);
      if(st===6)c.status='hired';
      else if(done){c.status=st===5?'declined':RT()<.06?'withdrawn':RT()<.1&&st>=3?'pool':'rejected'}
      else{const recent=days(last,T)<=(st===0?9:st>=5?20:16);c.status=recent?'active':st===5?'declined':RT()<.06?'withdrawn':RT()<.08&&st>=3?'pool':'rejected'}
      if(c.status==='rejected'||c.status==='declined'){const rs=REJ[Math.min(5,st)];c.reason=tp(rs)}
      if(c.status==='active')for(let k=0;k<=st;k++)if(parse(c.dates[k])>T)c.dates[k]=iso(addDays(T,-Math.max(0,st-k)));
      if(st===6){
        const tgt=addDays(parse(c.dates[5]),21);
        const e=hires2026.filter(x=>!used.has(x.id)&&x.dept===r.dept).sort((a,b)=>Math.abs(days(parse(a.hire),tgt))-Math.abs(days(parse(b.hire),tgt))+(Math.abs(a.grade-r.grade)-Math.abs(b.grade-r.grade))*20)[0];
        if(e&&Math.abs(days(parse(e.hire),tgt))<120){used.add(e.id);c.emp=e.id;c.name=e.name;c.gender=e.gender;c.dates[6]=e.hire;c.dates[5]=iso(addDays(parse(e.hire),-tri(14,25)))}
        for(let k=4;k>=0;k--)if(c.dates[k]>=c.dates[k+1])c.dates[k]=iso(addDays(parse(c.dates[k+1]),-tri(2,6)));
        c.consentAt=c.dates[0];
        c.offer={p1:Math.round(band.mid*clamp(1+qi*.05,.9,1.15)/1e5)*1e5,acceptedAt:c.dates[5]};
      }else if(st===5)c.offer={p1:Math.round(band.mid*clamp(1+qi*.05,.9,1.15)/1e5)*1e5,sentAt:c.dates[5]};
      out.push(c);
    }
  }
  return out;
}
function mergedCands(){
  if(!TA_BASE)TA_BASE=genCandidates();
  const ov=S.col.cands,out=[];
  for(const b of TA_BASE){const o=ov[b.id];out.push(o&&!o._new?{...b,...o}:{...b})}
  for(const[id,d]of Object.entries(ov))if(d&&d._new)out.push({...d,id});
  return out;
}
/* Điểm từng ứng viên */
function cvScore(c){return Math.round(sum(CV_CRIT,([k,,w])=>((c.cvParts||{})[k]||1)*w)/5)}
function testTotal(c){return c.test?Math.round(avg(['V','N','L','J'],k=>Number(c.test[k])||0)):null}
function intAvg(c){if(!c.ints)return null;const v=Object.values(c.ints).flat().map(Number).filter(x=>x>0);return v.length?r1(avg(v,x=>x)):null}
function compAvg(c,id){const a=c.ints&&c.ints[id];return a&&a.length?avg(a,x=>Number(x)):null}
function koPass(c){return Object.values(c.ko||{}).every(Boolean)}
function composite(c){
  const cv=cvScore(c),t=testTotal(c),ia=intAvg(c),rf=c.ref==='ok'?100:c.ref==='note'?60:c.ref==='fail'?0:null;
  const parts=[[TS('wCv'),cv],[TS('wTest'),t],[TS('wInt'),ia==null?null:(ia-1)/4*100],[TS('wRef'),rf]].filter(p=>p[1]!=null);
  const w=sum(parts,p=>p[0]);return w?Math.round(sum(parts,p=>p[0]*p[1])/w):0;
}
function hurdles(c){
  const t=testTotal(c),ia=intAvg(c),coreLow=c.ints?['INT','SAFE'].some(id=>{const v=compAvg(c,id);return v!=null&&v<2}):false;
  return[['Tiêu chí bắt buộc',koPass(c)],['CV ≥ '+TS('cvCut'),cvScore(c)>=TS('cvCut')],['Trắc nghiệm ≥ '+TS('testCut'),t==null?null:t>=TS('testCut')],['Phỏng vấn ≥ '+TS('intCut'),ia==null?null:ia>=TS('intCut')],['Không có giá trị cốt lõi < 2',c.ints?!coreLow:null],['Tham chiếu',c.ref==null?null:c.ref!=='fail']];
}
/* ---------- Mô hình TA tổng hợp ---------- */
function buildTA(m){
  const T=m.T,cands=mergedCands(),reqMap=Object.fromEntries(m.reqs.map(r=>[r.id,r]));
  for(const c of cands){c.r=reqMap[c.req]||{id:c.req,title:'(yêu cầu đã xoá)',dept:'HR',grade:4,status:'Hoàn tất'};c.cv=cvScore(c);c.tt=testTotal(c);c.ia=intAvg(c);c.comp=composite(c);c.lastAt=(c.dates||[])[c.st]||c.consentAt;c.age=c.yob?T.getFullYear()-c.yob:null}
  const tested=cands.filter(c=>c.tt!=null).map(c=>c.tt).sort((a,b)=>a-b);
  const pctl=v=>{if(v==null||!tested.length)return null;let lo=0;for(const x of tested)if(x<v)lo++;return Math.round(lo/tested.length*100)};
  for(const c of cands)c.pctl=pctl(c.tt);
  const byReq=groupBy(cands,c=>c.req);
  // nguồn, chi phí, chiến dịch
  const camps=buildCampaigns(m,byReq);
  const hired=cands.filter(c=>c.status==='hired'),hiredY=hired.filter(c=>(c.dates[5]||'')>=T.getFullYear()+'-01-01');
  const ttf=m.reqs.filter(r=>r.closed).map(r=>days(parse(r.opened),parse(r.closed)));
  const tth=hired.filter(c=>c.dates[5]).map(c=>days(parse(c.dates[0]),parse(c.dates[5])));
  const offers=cands.filter(c=>c.st>=5),offAcc=offers.filter(c=>c.status==='hired').length,offDec=offers.filter(c=>c.status==='declined').length;
  const ext=sum(camps,x=>x.spent),internal=sum(cands,c=>(c.st>=1?.5:.15)*TS('recruiterHour')+(c.st>=3?3*TS('panelHour'):0));
  const prob=m.working.filter(e=>e.contract===C_PROB);
  const probEval=probationList(m);
  const passRate=(()=>{const d=Object.values(S.col.probation).filter(p=>p.final);return d.length?d.filter(p=>p.final==='pass').length/d.length:.9})();
  const stageCount=STAGES.map((s,k)=>cands.filter(c=>c.st>=k).length);
  const active=cands.filter(c=>c.status==='active');
  const npsVals=cands.filter(c=>c.st>=1&&c.nps!=null).map(c=>c.nps);
  const nps=npsVals.length?Math.round((npsVals.filter(x=>x>=9).length-npsVals.filter(x=>x<=6).length)/npsVals.length*100):0;
  // bình đẳng: tỷ lệ chọn theo giới tính tại mỗi bước (quy tắc 4/5)
  const ai=[1,2,3,5,6].map(k=>{const prev=k===5?4:k===6?5:k-1;const g=['Nam','Nữ'].map(x=>{const at=cands.filter(c=>c.gender===x&&c.st>=prev&&(c.status!=='active'||c.st>prev)).length,adv=cands.filter(c=>c.gender===x&&c.st>=k).length;return{x,at,adv,rate:at?adv/at:0}});const mx=Math.max(...g.map(z=>z.rate)),mn=Math.min(...g.map(z=>z.rate));return{k,from:STAGES[prev].l,to:STAGES[k].l,g,ratio:mx?mn/mx:1}});
  const retention=TS('retention');
  const expiring=cands.filter(c=>c.status!=='hired'&&c.status!=='active'&&!c.anon&&days(parse(c.consentAt),T)>retention*30.4);
  return{T,cands,byReq,camps,hired,hiredY,ttf:ttf.length?avg(ttf,x=>x):0,tth:tth.length?avg(tth,x=>x):0,offers,offAcc,offDec,ext,internal,cph:(ext+internal)/Math.max(1,hired.length),
    prob,probEval,passRate,stageCount,active,nps,ai,expiring,pctl};
}
function buildCampaigns(m,byReq){
  const out=[];
  for(const r of m.reqs){
    const cs=byReq[r.id]||[];const bySrc=groupBy(cs,c=>c.src);const paid=Object.keys(bySrc).filter(s=>CH[s]&&CH[s].paid);
    const wt=Object.fromEntries(paid.map(s=>[s,bySrc[s].length]));const tw=sum(Object.values(wt))||1;
    for(const s of Object.keys(bySrc)){
      const ch=CH[s];if(!ch)continue;const list=bySrc[s],hires=list.filter(c=>c.status==='hired');
      let spent=0,budget=0;
      if(ch.paid){spent=r.spent*.8*wt[s]/tw;budget=r.budget*.8*wt[s]/tw}
      else if(s==='referral'){spent=hires.length*TS('referralBonus');budget=Math.max(spent,r.qty*TS('referralBonus')*.3)}
      else if(s==='headhunt'){spent=sum(hires,c=>(c.offer?c.offer.p1:scaleMid(r.grade))*12*TS('headhuntFee')/100);budget=Math.max(spent,scaleMid(r.grade)*12*TS('headhuntFee')/100)}
      else if(s==='campus'){spent=8e6;budget=1e7}
      else if(s==='career'){spent=r.spent*.2*list.length/Math.max(1,cs.length);budget=spent*1.1}
      const id='CP-'+r.id.slice(-2)+'-'+s,ov=S.col.campaigns[id]||{};
      const clicks=ch.paid?Math.round(spent/ch.cpc):Math.round(list.length*tb(2.5,4));
      const impr=ch.paid?Math.round(clicks/ch.ctr):Math.round(clicks*tb(8,15));
      out.push({id,req:r.id,r,src:s,ch,name:`${r.title} · ${ch.name}`,budget:ov.budget!=null?Number(ov.budget):Math.round(budget),spent:Math.round(spent),impr,clicks,applies:list.length,qual:list.filter(c=>c.st>=1).length,ints:list.filter(c=>c.st>=3).length,hires:hires.length,status:ov.status||(r.status==='Hoàn tất'?'Đã kết thúc':'Đang chạy'),msg:ov.msg||list[0].msg||'target',start:r.opened,end:r.closed||r.target});
    }
  }
  return out;
}
const BRAND=[
 {id:'BR-01',name:'AMG Engineers of Tomorrow 2026',ch:['tiktok','facebook','campus','linkedin'],evp:['Phát triển nghề nghiệp','Công nghệ & đổi mới'],target:'Sinh viên năm cuối kỹ thuật, điện – điện tử',budget:120e6,spent:86e6,reach:620000,eng:.046,leads:1480,ats:212},
 {id:'BR-02',name:'Nhà máy xanh Đồng Nai – Việc làm ổn định gần nhà',ch:['facebook','zalo','tiktok'],evp:['An toàn & phúc lợi','Đãi ngộ 3P minh bạch'],target:'Lao động phổ thông khu vực Đồng Nai, Bình Dương',budget:90e6,spent:71e6,reach:480000,eng:.058,leads:2350,ats:640},
 {id:'BR-03',name:'Tech@AMG – Build industrial IoT',ch:['linkedin','itviec','facebook'],evp:['Công nghệ & đổi mới','Làm việc linh hoạt'],target:'Kỹ sư phần mềm, dữ liệu 3–8 năm kinh nghiệm',budget:150e6,spent:98e6,reach:210000,eng:.031,leads:390,ats:118},
 {id:'BR-04',name:'Women in Engineering @AMG',ch:['linkedin','facebook','campus'],evp:['Đa dạng & hoà nhập','Phát triển nghề nghiệp'],target:'Nữ kỹ sư và sinh viên kỹ thuật',budget:60e6,spent:32e6,reach:150000,eng:.052,leads:260,ats:74},
];
const EVP=['Phát triển nghề nghiệp','Đãi ngộ 3P minh bạch','An toàn & phúc lợi','Đa dạng & hoà nhập','Công nghệ & đổi mới','Làm việc linh hoạt'];

/* ---------- Thử việc → chính thức ---------- */
const PROB_CRIT=[['goal','Mức hoàn thành mục tiêu thử việc',30],['quality','Chất lượng công việc',20],['core','Giá trị cốt lõi & tuân thủ',20],['learn','Tốc độ học hỏi, hội nhập',15],['team','Hợp tác, thái độ (A trong ASK)',15]];
function probationList(m){
  const T=m.T;
  return m.working.filter(e=>e.contract===C_PROB).map(e=>{
    const hire=parse(e.hire),end=parse(e.probEnd||iso(addDays(hire,probDaysOf(e.grade)))),len=Math.max(1,days(hire,end));
    const ov=S.col.probation[e.id]||{},r=mulberry32(hseed('prob'+e.id));
    const cps=[30,60,90].filter(d=>d<len).map(d=>({d,due:iso(addDays(hire,d))}));cps.push({d:len,due:iso(end),final:true});
    const elapsed=days(hire,T);
    const base={};PROB_CRIT.forEach(([k])=>base[k]=clamp(Math.round(3.3+r()*1.6-.3),1,5));
    const scores=ov.scores||(elapsed>=30?base:null);
    const total=scores?Math.round(sum(PROB_CRIT,([k,,w])=>(scores[k]||0)*w)/5):null;
    const cand=null;
    return{e,hire:iso(hire),end:iso(end),len,elapsed,left:days(T,end),cps,scores,total,final:ov.final||null,ov,rec:total==null?null:total>=70?'pass':total>=55?'watch':'fail'};
  }).sort((a,b)=>a.left-b.left);
}
const PRE=[['offer','Ứng viên ký xác nhận thư mời nhận việc'],['docs','Nhận bản sao CCCD, văn bằng (không giữ bản chính – Điều 17)'],['health','Giấy khám sức khoẻ (≤ 6 tháng)'],['bank','Tài khoản ngân hàng nhận lương, mã số thuế, số BHXH'],['contract','Soạn HĐ thử việc / HĐLĐ có điều khoản thử việc'],['it','Tạo email, tài khoản, quyền truy cập theo vai trò'],['seat','Chuẩn bị chỗ ngồi, thiết bị, bảo hộ lao động'],['buddy','Chỉ định người hướng dẫn (buddy)'],['welcome','Gửi thư chào mừng và lịch tuần đầu']];
