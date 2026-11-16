# HR Talent Studio

HR Analytics + quy trình **Talent Acquisition đầu–cuối** cho tập đoàn giả định *Aurora Meridian Group Việt Nam (AMG)*, dữ liệu mô phỏng 11/2026.

- **Ứng dụng:** https://levitri2711-glitch.github.io/hr-talent-studio/
- **Chi phí:** 0 đ, hiện tại và về sau: GitHub Pages + Google Apps Script + Google Sheets + Gmail của Owner. Không có thư viện, phông chữ, phân tích hay AI trả phí.

## Mô-đun tuyển dụng
| Bước | Màn hình | Nội dung chính |
|---|---|---|
| Hoạch định | Hoạch định & yêu cầu | Định biên, nhu cầu thay thế, phê duyệt yêu cầu 4 cấp, nội bộ và bên ngoài |
| Phân tích công việc | JD | Phân tích nhiệm vụ (quan trọng × tần suất), KSAO ↔ ASK, trình soạn JD, kiểm tra ngôn từ phân biệt đối xử |
| Năng lực | Khung năng lực ASK | 3 tầng (cốt lõi, lãnh đạo, chuyên môn), 22 năng lực, thang hành vi 5 cấp, Great Eight, STAR, BARS, ma trận theo chức danh |
| Thu hút | Thương hiệu & chiến dịch, Kênh MXH | EVP, 4 chiến dịch thương hiệu, chiến dịch theo kênh (CTR, CPA, cost-per-hire), A/B thông điệp, bài đăng mô phỏng LinkedIn, Facebook, TikTok, Zalo, TopCV, VietnamWorks, ITviec |
| Tuyển chọn | Pipeline, Sàng lọc, Trắc nghiệm, Phỏng vấn, Quyết định | ATS dạng Kanban, loại trừ + ma trận CV, bài test 20 câu có giờ, phiếu chấm BARS, mô hình bù trừ + rào cản nhiều lớp, tham chiếu |
| Offer | Offer & phúc lợi | Bảng tính lương 3P, thực lĩnh, chi phí, thử việc theo Điều 25–26, chính sách phúc lợi |
| Hội nhập | Onboarding & thử việc | Pre-onboarding → tạo hồ sơ nhân viên (nối sang HR) → onboarding → đánh giá 30/60/90 → HĐLĐ chính thức + báo tăng BHXH |
| Tuân thủ | Pháp lý & dữ liệu ứng viên | BLLĐ 2019, Luật Việc làm 2025, Luật BVDLCN 2025, NĐ 219/2025, ILO C111, GDPR, quy tắc 4/5 |
| Vận hành | Tự động hoá, Bộ biểu mẫu Excel | 7 tác vụ tự động, gói cập nhật quy định có hoàn tác, xuất 14 ma trận/biểu mẫu .xlsx |

## Phân quyền
Viewer → Commenter → Contributor → Editor → Owner. Đăng nhập bằng link email, không dùng mật khẩu. Mặc định chỉ người được mời mới đăng nhập. Máy chủ kiểm tra quyền ở mọi thao tác. Xem `docs/SOP_OWNER.md`.

## Cấu trúc
- `frontend/`: trang tĩnh, được đưa lên GitHub Pages.
- `apps-script/`: máy chủ. Đưa lên bằng `clasp push`; không public trên GitHub.
- `tools/`: dev server (`npm run dev` → http://localhost:8788/dev) và trình tách mã HR.
- `tests/`: `npm test`.

## Chạy thử trên máy
```bash
npm test
npm run dev
```
