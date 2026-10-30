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

## Chỉnh sửa hình ảnh, animation và cân bằng tiếp theo

- Sửa gốc lỗi vẽ chồng: tháp tín hiệu gọi một renderer; máy Lab, bản thiết kế, tổ kiến, TNT/xe mỏ được xử lý một lần rồi bỏ qua hình cũ. NPC/đồng minh và nhà dân/nông trại thay body cũ trực tiếp. Bản thiết kế đã thu không còn xuất hiện; xe bom chỉ vẽ trong map mỏ ở bước hộ tống/chuẩn bị, không lạc sang map khác hoặc đấu trường boss.
- Zombie thường có da tái, áo rách, xương sườn và hàm; nhóm đánh xa tách túi axit/yết hầu chảy dịch, cung và dây cung, súng hai nòng cầm bên thân, điện cực. Animation gồm bước chân, thở, co giật và tư thế phun/bắn; người chơi có tay nạp và giật vai khi bắn; NPC, cây, ruộng, quạt máy, đèn/sóng tháp, thùng đồ và khói căn cứ có chuyển động nhẹ. Các hiệu ứng chỉ đọc trạng thái; ưu tiên giảm chuyển động của hệ thống được cập nhật trực tiếp.
- UI chuyển sang nền than đen, chữ xám ngà, đỏ gỉ cho hành động/cảnh báo. Giảm nhiều màu cạnh tranh trên thẻ và wiki; thanh máu/máu ảo/no/XP vẫn có màu chức năng riêng.
- Module 32 thêm sáu perk, dùng cờ và cooldown số trong payload perk lưu/đồng bộ sẵn có. `vh_reservoir`: trần Máu Ảo +35% máu tối đa. `vh_harvest`: mỗi mạng hạ nhận 2% máu tối đa thành Máu Ảo, hồi 0,4s, loại trừ Tế Phẩm. `vh_recovery`: sau 5s không nhận sát thương, hồi 3%/s tới 25%; cộng trần/tốc với Lá Chắn Tái Tạo và tag Phòng Thủ, vẫn bị giới hạn Máu Ảo chung.
- `dr_veil`: còn Máu Ảo giảm thêm 12% sát thương. `dr_laststand`: máu thật ≤35% giảm thêm 20%. `dr_aftershock`: khi Máu Ảo vừa vỡ mà người chơi còn sống, giảm 20% trong 4s tiếp theo, hồi 12s; đòn phá vỡ không được giảm ngược. Các hệ số nhân với phòng thủ sẵn có và áp dụng cả sát thương theo thời gian. Né, phản đòn hoặc khiên chặn trọn đòn không kích hoạt vỡ Máu Ảo.

| Súng nạp | Sát thương cũ → mới | Tổng đạn cũ → mới | Viên/băng |
| --- | --- | --- | --- |
| Lục | 140 → 175 | 50 → 84 | 12 |
| Tiểu Liên | 20 → 28 | 240 → 360 | 30 |
| AR | 60 → 80 | 120 → 200 | 25 |
| Súng Săn | 200 → 240 | 50 → 72 | 6 |
| Ngắm | 350 → 440 | 20 → 35 | 5 |
| Phóng Lựu | 120 → 155 | 8 → 14 | 1 |

Bản lưu đánh dấu cân bằng súng `bv:2`. Khi đọc bản cũ, sức chứa được đổi theo tỷ lệ nền mới/cũ để giữ bonus đã mua; số đạn còn lại không được tự hồi khi tải. Wiki lấy số súng và mô tả perk trực tiếp từ dữ liệu.

## Nội dung từ tệp cập nhật

- Module 24: tám lớp cướp, chọn mục tiêu theo phe và khoảng cách, chạy/giữ cự ly/hỗ trợ/hoảng loạn; Scout lấy đồ, Medic cứu một lần, xác chết có thể hóa zombie. Nấc gục không nhận thưởng; xác nhiễm chỉ nhận nửa XP và không rơi đồ lần nữa. Xe tải đổ quân, yểm trợ, nhận sát thương và rời đi. **Điều chỉnh theo yêu cầu mới: chỉ có cướp từ map thứ 8 của run.** Vòng spawn thường chỉ sinh zombie, kể cả Thị Trấn Cướp. Tiền đồn có 3 lính, tháp tín hiệu có 2 lính; mỗi chốt chỉ sinh nhóm gác một lần, không bổ sung sau khi chết. Lính gác hoạt động quanh chốt, quay lại khi mục tiêu đi xa.
- Map thường giới hạn **10 cướp và 1 xe** tổng cộng; map Thành Trì/Thị Trấn Cướp/Phòng Thủ giới hạn **24 cướp và 2 xe**. Một xe chỉ đổ tối đa 4 lính một lần. Xe tự tới có đúng một lịch hẹn, không lặp. Xe do tháp/Leader/pháo hiệu gọi cùng tiêu ngân sách xe này; xe rút đi hoặc bị phá không trả ngân sách. Vùng ngầm, Lab bên trong và tàu loại trừ cướp. Các giới hạn này thay thế bảng mật độ cũ trong tệp thiết kế gốc.
- Module 25: Cưa Máy trong pool vũ khí, nhịp cưa 0,12s, phá khiên, chảy máu, vòng tua, kháng chậm, lao Q và Nộ R, ba perk riêng, tag Tiến Công và hình vẽ riêng.
- Module 26: POI theo nhóm bản đồ, nhà có lối mở, tháp tín hiệu giữ 5s gọi đồ/địch, bồn nhiên liệu nổ/cháy, còi xe thu hút địch, chuồng thả zombie, nấm gây sợ, vùng dị biến 450px với thưởng sau khi dọn nhóm canh. Không trộn các POI này vào map 10/14/15/16.
- Module 27: trạm khảo cổ, nấm/giật lan điện, cầu/cột phá được, tời tiếp tế; xe bom theo lộ trình mê cung, chọn chế độ nhánh ngắn có Acid/nhánh dài an toàn, ba mạch làm yếu boss, máy nghiền, lò rèn giữ 30s, cứu thợ mỏ từ kén. Đấu trường Kiến Chúa có xe TNT, máy phát và thạch nhũ. Boss xuống 45% kích tối; nhặt lõi sau khi hạ boss mới chạy bộ phá cột rồi tới xe goòng. Phần xe goòng tiếp tục dùng cơ chế ba làn/chia vai đã có.
- Module 28: đồ họa Canvas cho đủ tám vai cướp (trang phục, vũ khí/khiên/túi cứu thương/loa), chiến xa có giáp–bánh–kính–ụ súng–đèn, tiền đồn, tháp tín hiệu, siêu thị, nhà kính, vật thể hang và hai thùng tiếp tế. Dùng hình khối vẽ trực tiếp với vật liệu, bóng đổ, animation nhẹ và nhãn theo khoảng cách; không cần tải ảnh hoặc thư viện đồ họa mới.

Các mô phỏng AI và POI là quy tắc chạy được trên hệ canvas hiện tại. Nhánh ray có lối tắt Acid được đục riêng qua mê cung và đường dài quanh co; chọn ở điểm xuất phát trước khi xe đi qua ngã rẽ. Những chi tiết trình diễn như mái có hình kiến trúc theo từng loại cao ốc, animation hồi sinh/đổ quân, hoặc nhân vật Anthony không được khai báo trong game hiện tại cần nội dung riêng; không coi các chi tiết đó là đã hoàn thành chỉ vì có trong đặc tả.

## Kiểm tra

### Đợt hình ảnh và UI/UX toàn game

- Module 29 vẽ lại người chơi (mũ, giáp, ba lô, màu đội, dáng đi/gục), zombie thường/đặc biệt, tám boss, kiến, thương điện, xúc tu và đồng minh. Sửa chỉ số vai hiển thị cướp từ ID 60–67 sang vị trí 0–7 để khiên, cứu thương, loa, dao và súng xuất hiện đúng lớp. Giữ dấu hiệu lá chắn, giáp vỡ, thời gian quét và vòng nguy hiểm của boss.
- Module 30 thêm chất liệu nền theo biome, đường đô thị, cây, vách đá, mái nhà, máy móc Lab, tháp nhiệm vụ, tàu/xe goòng/xe tăng; dựng lại Nhà Chính theo cấp, cửa chắn, khu trại, quầy tương tác, nhà ở, ruộng, tháp canh, NPC và cư dân. Hình ảnh mới giữ nguyên vùng va chạm và khoảng cách tương tác.
- `css/presentation.css` và minh họa vector `assets/survivor-outpost.svg` dựng menu hai cột trên PC, cuộn dọc trên điện thoại. Chọn chế độ, bản lưu, cài đặt âm thanh/độ khó, wiki/phòng online đều giữ hành vi hiện có. Cửa hàng, xưởng, bảng nhiệm vụ, tạm dừng, xác nhận và nâng cấp dùng cùng bảng màu, độ tương phản và nút bấm.
- Module 31 thống nhất thanh thể lực, máu ảo, no/XP, tài nguyên, nhiệm vụ, bộ đàm, trạng thái boss và bảng nhiệm vụ trại. Thẻ đọc đủ mô tả, hiển thị thứ tự và phân biệt mốc Độc Tôn/Bứt Phá. Thẻ và tuyến có thao tác Enter/Space; hộp thoại giữ focus bên trong và trả focus khi đóng. Hai người chung máy giữ bố cục đối diện; online P3/P4 dùng một khung chọn riêng. Nút Fix Nhanh giữ nguyên.
- Chất lượng **Tự động / Cao / Thấp** chỉ thay mật độ chi tiết nền và tán cây. Tự động dùng mức nhẹ dưới chiều rộng 900px; lựa chọn được lưu bằng `zs_visual_quality`. CSS tôn trọng thiết lập giảm chuyển động. Không thay chỉ số, AI, lịch spawn hoặc cơ chế lưu/đồng bộ.
- Đồ họa vẽ bằng Canvas/SVG/CSS, không cần tải ảnh mới hoặc thư viện đồ họa. Đây là phong cách minh họa nhìn từ trên xuống; hiệu ứng cảnh báo và các lớp thời tiết đã có được giữ để trận đánh dễ đọc.

`node tests/presentation-browser.cjs` kiểm tra menu/cài đặt, hộp thoại, chọn thẻ/tuyến bằng bàn phím, 16 map, căn cứ/xưởng, các loại boss/zombie/cướp, hai người chung máy và màn nâng cấp khách P3, bố cục desktop/dọc/ngang điện thoại. Ảnh kiểm tra xuất vào thư mục tạm `zombie-presentation-*.png`. Kiểm tra logic tổng hợp bằng lệnh 6 file trong `NDGame.md`: **127/127 lượt đạt**. Mạng ở đây vẫn là trạng thái/lệnh mô phỏng, chưa phải bốn máy WebRTC thực tế.

`node --test tests/modern-update.test.cjs` kiểm tra tập luyện, tiếp tế, băng đạn, vòng đời ba phe, Cưa Máy, POI và chuỗi Kiến Chúa. `node tests/modern-browser.cjs` (Playwright + Edge) bấm nút nạp/tập thật, mô phỏng chín map, chuyển tới boss mới và vẽ ở kích thước ngang điện thoại. Đây chưa phải kiểm tra WebRTC trên bốn máy thật.

`node --test tests/bandit-encounters.test.cjs` kiểm tra mốc map 8, chốt không sinh lại, vòng spawn thường, ngân sách xe/quân và mô phỏng 10 phút không bổ sung cướp. `node tests/world-art-browser.cjs` kiểm tra bằng Edge và xuất ảnh các nhân vật/công trình ở desktop và màn hình ngang điện thoại.

`node tests/horror-browser.cjs` kiểm tra không còn body cũ của tháp/NPC, mỗi prop chỉ vẽ một lần, xe bom đúng giai đoạn, animation thay đổi pixel nhưng giữ nguyên dữ liệu chiến đấu, và chế độ giảm chuyển động. Xuất ảnh `zombie-horror-ranged.png`, `zombie-horror-towers.png` trong thư mục tạm. `node --test tests/resilience.test.cjs` kiểm tra trần/hồi Máu Ảo, giảm sát thương/cooldown, lựa chọn perk, đồng bộ và nâng sức chứa bản lưu.

## Hiệu ứng đòn đánh Cưa Máy

- Slash Cưa Máy dùng `saw_swing` riêng thay vệt kiếm/fan trắng cũ; vệt cắt mảnh và dư ảnh theo hướng đánh. Chạm địch có vết cắt, mạt đỏ; chạm giáp/kim loại có tia lửa và tiếng kim loại; vật thể gỗ có mạt gỗ. Hiệu ứng va đập giới hạn một lần mỗi 65ms/người và không tạo thêm sát thương.
- Lao cưa để lại vệt tốc độ mỗi 70ms, chạm mục tiêu dùng hiệu ứng vật liệu; kích Nộ có vòng quá tải, xích nóng và thân máy rung. Răng cưa chạy khi máy hoạt động.
- VFX sống 0,18–0,5s, dùng hàng đợi mạng hiện có; không sinh thêm khi hàng đợi đạt 220. Chất lượng thấp giảm số mạt; giảm chuyển động tắt rung máy và rung màn hình của va đập. Snapshot thêm slot 31 cho vòng tua/tiếp xúc/Nộ/lao và cờ Slash cưa; khách cũ thiếu trường nhận mặc định 0.
- `tests/resilience.test.cjs` kiểm tra vệt cưa không bị lẫn vệt kiếm, không gây sát thương hai lần, giới hạn/thu hồi VFX và gửi trạng thái/hiệu ứng sang khách. `tests/horror-browser.cjs` xuất thêm ảnh `zombie-horror-chainsaw.png`.
