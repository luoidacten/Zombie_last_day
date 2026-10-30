# Cập nhật 30/10/2026

Nguồn yêu cầu: tin nhắn người dùng, `Cập nhâtz.txt` và GDD hiện tại. Các phần dưới mô tả hành vi đã triển khai trong mã để người tiếp quản phân biệt với mức chi tiết mong muốn của đặc tả.

## Khu tập luyện và thực phẩm

- Mỗi cư dân đang ở căn cứ tạo 3 thực phẩm khi về từ một chiến dịch, một lần cho mỗi map. Không sản xuất bằng cách mở lại bảng.
- Nhà Chính cấp 2/3/4/5 mở giới hạn 2/4/7/10 lần tập cho **từng nhánh**, tăng cho cả đội trong run. Chi phí lần kế tiếp: `12 × (cấp tập + 1)` thực phẩm.
- Mỗi lần tập ở Nhà cấp 2/3/4/5 lần lượt cho: máu +30/35/40/45; tốc chạy +12/14/16/18; sát thương cơ bản +8/10/12/14 điểm phần trăm. Không thay đổi ngược các lần đã mua.
- Thể lực đạt 4/7: hồi 1/2% máu tối đa mỗi 10 giây. Tốc độ đạt 4/7: giảm tác động hiệu ứng chậm 20/40%. Sức mạnh đạt 4/7: sát thương thêm 5/10%. Cả ba nhánh đạt 10: đầu map có thêm 10% Máu Ảo.

## Băng đạn và điều khiển

- Lục 12, Tiểu Liên 30, AR 25, Shotgun 6, Sniper 5, Phóng Lựu 1 viên mỗi băng. `ammo` vẫn là **tổng đạn còn lại, gồm cả băng**; dự trữ hiển thị bằng `ammo - mag`.
- Hết băng tự nạp từ dự trữ. Phím **F** hoặc nút **NẠP** nạp chủ động; **R** tiếp tục dùng kỹ năng Nộ. Đang nạp không bắn/kích kỹ năng súng; đổi vũ khí/gục sẽ hủy nạp. Hết tổng đạn vẫn giữ súng để nhặt tiếp tế.
- Thùng đạn hồi 50% sức chứa, perk Tiếp Tế tăng thành 75%; thùng máu hồi 50% máu tối đa. Tag NẠP ĐẠN có mốc 2/3/5, năm perk liên quan được thêm vào pool và wiki.
- Nút toàn màn hình gọi API trình duyệt từ thao tác người dùng, thử khóa ngang nếu thiết bị hỗ trợ; có chỉ dẫn xoay ngang khi online trên màn hình dọc. Khả năng khóa xoay phụ thuộc trình duyệt/thiết bị.

## Nội dung từ tệp cập nhật

- Module 24: tám lớp cướp, chọn mục tiêu theo phe và khoảng cách, chạy/giữ cự ly/hỗ trợ/hoảng loạn; Scout lấy đồ, Medic cứu một lần, xác chết có thể hóa zombie. Nấc gục không nhận thưởng; xác nhiễm chỉ nhận nửa XP và không rơi đồ lần nữa. Xe tải đổ quân, yểm trợ, nhận sát thương và rời đi; Leader gọi thêm xe theo máu. Vùng ngầm, Lab bên trong và tàu loại trừ cướp.
- Module 25: Cưa Máy trong pool vũ khí, nhịp cưa 0,12s, phá khiên, chảy máu, vòng tua, kháng chậm, lao Q và Nộ R, ba perk riêng, tag Tiến Công và hình vẽ riêng.
- Module 26: POI theo nhóm bản đồ, nhà có lối mở, tháp tín hiệu giữ 5s gọi đồ/địch, bồn nhiên liệu nổ/cháy, còi xe thu hút địch, chuồng thả zombie, nấm gây sợ, vùng dị biến 450px với thưởng sau khi dọn nhóm canh. Không trộn các POI này vào map 10/14/15/16.
- Module 27: trạm khảo cổ, nấm/giật lan điện, cầu/cột phá được, tời tiếp tế; xe bom theo lộ trình mê cung, chọn chế độ nhánh ngắn có Acid/nhánh dài an toàn, ba mạch làm yếu boss, máy nghiền, lò rèn giữ 30s, cứu thợ mỏ từ kén. Đấu trường Kiến Chúa có xe TNT, máy phát và thạch nhũ. Boss xuống 45% kích tối; nhặt lõi sau khi hạ boss mới chạy bộ phá cột rồi tới xe goòng. Phần xe goòng tiếp tục dùng cơ chế ba làn/chia vai đã có.

Các mô phỏng AI và POI là quy tắc chạy được trên hệ canvas hiện tại. Nhánh ray có lối tắt Acid được đục riêng qua mê cung và đường dài quanh co; chọn ở điểm xuất phát trước khi xe đi qua ngã rẽ. Những chi tiết trình diễn như mái có hình kiến trúc theo từng loại cao ốc, animation hồi sinh/đổ quân, hoặc nhân vật Anthony không được khai báo trong game hiện tại cần nội dung riêng; không coi các chi tiết đó là đã hoàn thành chỉ vì có trong đặc tả.

## Kiểm tra

`node --test tests/modern-update.test.cjs` kiểm tra tập luyện, tiếp tế, băng đạn, vòng đời ba phe, Cưa Máy, POI và chuỗi Kiến Chúa. `node tests/modern-browser.cjs` (Playwright + Edge) bấm nút nạp/tập thật, mô phỏng chín map, chuyển tới boss mới và vẽ ở kích thước ngang điện thoại. Đây chưa phải kiểm tra WebRTC trên bốn máy thật.
