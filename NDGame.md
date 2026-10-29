# NDGame — Tổng quan nội dung và cấu trúc game

Cập nhật: **29/10/2026**, đối chiếu mã nguồn hiện có.

Tài liệu dành cho người mới tiếp nhận dự án, người muốn chỉnh sửa game hoặc AI cần hiểu nhanh game đang có gì. Thông số cân bằng chi tiết nằm trong mã nguồn; thiết kế chi tiết của đợt làm lại Phòng Thí Nghiệm Z (Lab Z Rework) nằm ở `THIẾT KẾ.md`.

## 1. Game này là gì?

**Zombie Survival PC & Mobile** là game hành động sinh tồn 2D nhìn từ trên xuống, chạy trên trình duyệt. Người chơi di chuyển, nhặt vũ khí, tiêu diệt zombie/cướp, hoàn thành nhiệm vụ, chiến đấu với boss và phát triển căn cứ qua nhiều chiến dịch.

Game có lựa chọn thẻ nâng cấp và các hệ **Tag/Link** để xây dựng lối chơi như Kiếm Sư, Drone, Điện, Triệu Hồi, Chiến Xa, Hút Máu và Phòng Thủ. Ngoài các màn chiến đấu thông thường, game có chuỗi cốt truyện, hang nhiều tầng, hầm mỏ, phòng thí nghiệm và màn chạy thoát trên tàu.

### Chế độ chơi và điều khiển

- **1 người PC:** bàn phím và chuột.
- **1 người Mobile:** joystick và nút cảm ứng.
- **2 người chung máy:** điều khiển cảm ứng trên cùng màn hình.
- **Online co-op 2–4 người:** chủ phòng tạo mã, người khác nhập mã tham gia.
- Có chọn độ khó, hướng dẫn trong game, tạm dừng và bật/tắt âm thanh.

| Điều khiển PC | Chức năng |
| --- | --- |
| WASD hoặc phím mũi tên | Di chuyển |
| Chuột | Ngắm |
| Chuột trái / Space | Bắn, chém hoặc hành động A |
| Chuột phải / E | Ném hoặc hành động B |
| Q | Kỹ năng C của vũ khí |
| R | Kỹ năng D / Nộ khi đủ điều kiện |
| P / Esc | Tạm dừng, tiếp tục |
| M | Bật/tắt âm thanh |

Trong một số tình huống đặc biệt như trên tàu hoặc điều khiển xe, chức năng A/B/C/D thay đổi theo ngữ cảnh. Đọc nhãn kỹ năng trên HUD.

## 2. Vòng chơi chính

1. Bắt đầu lượt chơi hoặc tải bản lưu.
2. Vào bản đồ, tìm trang bị và hoàn thành mục tiêu đang hiển thị.
3. Hạ địch để nhận kinh nghiệm, tăng cấp và tích lượt chọn thẻ nâng cấp; thu thập chiến lợi phẩm/phế liệu.
4. Hoàn thành nhiệm vụ và rút lui theo cơ chế của màn, thường có trực thăng đón.
5. Về **Khu Sống Sót**: nghỉ bên lửa trại, mua tiếp tế, phát triển căn cứ và chọn chiến dịch tiếp theo.
6. Cứ đến màn chiến dịch chia hết cho 5, game có nhánh **Phòng thủ Nhà Chính**; các chuỗi nhiệm vụ đặc biệt cũng có luật điều hướng riêng.

Lượt chơi có cấp màn, điểm, số mạng hạ, thời gian sống, độ khó và tiến trình cốt truyện. Càng đi xa, địch và môi trường càng nguy hiểm; sức mạnh boss còn điều chỉnh theo quân số.

## 3. Sinh tồn và chiến đấu

- Nhân vật có **máu, máu tối đa, đói, tốc độ, sát thương, giáp, kinh nghiệm, cấp độ**.
- Có **chí mạng, headshot, xuyên mục tiêu, xuyên giáp, đẩy lùi**, kỹ năng diện rộng và sát thương theo thời gian.
- Vũ khí dùng **đạn hoặc độ bền**. Có vũ khí tích lực, vũ khí ném và vũ khí đặc biệt.
- Vật phẩm gồm thức ăn, hộp cứu thương, hộp mù, hòm thính/vũ khí và vật phẩm nhiệm vụ.
- Đồng đội có thể bị hạ, chờ cứu; trạng thái bị hạ khác với mất kết nối/rời phòng.
- Hiệu ứng gồm **Thiêu Đốt, Nhiễm Điện, Quá Tải, Ăn Mòn, Sợ Hãi**, cùng choáng, làm chậm, câm lặng và các hiệu ứng riêng của boss.
- Có khiên chặn đòn và **Máu Ảo** hấp thụ sát thương trước máu thật. Đây là hai cơ chế khác nhau.
- Acid của địch có luật riêng trong `20-queen.js`: giới hạn việc rút máu người chơi xuống ngưỡng 50%; không áp dụng suy luận này cho mọi loại sát thương khác.

## 4. Vũ khí và kỹ năng

| Nhóm | Ví dụ đang có |
| --- | --- |
| Súng thường | Lục, SMG, súng trường, súng săn, súng ngắm |
| Hỏa lực đặc biệt | Minigun, phóng lựu, phun lửa, phun acid |
| Cận chiến | Katana, song kiếm, rìu, búa, dao quân sự, giáo, gậy bóng chày, gậy sắt, kiếm laser, Liềm |
| Huyền thoại | Katana Huyền Thoại, Song Katana Huyền Thoại |
| Điện | Roi Điện, Pháo Điện Năng, Lục Điện, Plasma Rapid-Pulser, Electron Flux, Tesla Carbine |
| Tích lực / ném / đặc biệt | Cung, phi tiêu, lựu đạn, bom lửa, bộ đàm gọi xe |

Các vũ khí có kỹ năng C riêng: ví dụ dao lướt đâm, katana chém rộng, rìu ném xoáy, song kiếm lướt chém, Liềm hút quái rồi gặt vòng tròn. Nhiều vũ khí còn có kỹ năng Nộ D; các nhánh Nộ có điều kiện mở khóa riêng.

Một số cơ chế nổi bật: Minigun có nhiệt/kẹt nòng; Cung có ghim và phân rã mũi tên; Búa/Rìu có sóng âm; súng ngắm có vết rách không gian; phun lửa tạo vùng cháy. Lò Rèn tại căn cứ nâng sức mạnh vũ khí theo loại.

### Liềm, hút máu và Tế Phẩm

- Hạ boss **The Dead** mở Liềm và các nâng cấp liên quan theo cơ chế mở khóa của game.
- Liềm có hút máu mặc định trên đòn trúng địch; hạ địch hồi thêm máu.
- Mạng hạ bằng Liềm có **tỉ lệ** tạo Tế Phẩm: mặc định 6%, thẻ Gặt Hồn tăng lên 16%, mốc Liềm 3 cộng thêm 4 điểm phần trăm.
- Tạo Tế Phẩm cấp Máu Ảo cho chủ nhân. Tế Phẩm chạy tới địch và nổ, không làm hại phe ta.
- Có giới hạn lượng Máu Ảo và tối đa 12 Tế Phẩm đồng thời. Boss/Tế Phẩm địch không tạo Tế Phẩm mới theo nội tại này.
- Nội tại hút máu của đòn trực tiếp tính theo sát thương thực, không tính phần sát thương vượt quá máu còn lại của mục tiêu.

## 5. Thẻ nâng cấp, Tag/Link và Bức Phá

Thẻ có ID, tên, mô tả, loại và danh sách tag. Chọn thẻ vừa cấp hiệu ứng riêng vừa tăng các tag tương ứng. Đủ mốc tag sẽ kích hoạt thưởng bổ sung. Có đổi bộ thẻ bằng phế liệu; một số thẻ có điều kiện mở khóa hoặc được phép cộng dồn.

| Nhóm lối chơi | Các hệ tiêu biểu |
| --- | --- |
| Sinh tồn / hỗ trợ | Trợ Giúp, Hồi Máu, Phòng Thủ, Vật Phẩm, May Mắn |
| Sát thương / chỉ số | Tiến Công, Chỉ Số, Chuẩn Xác, Xạ Thủ, Sniper, Đạn, Tăng Tiến |
| Vũ khí / hiệu ứng | Cận Chiến, Kiếm Sư, Liềm, Hút Máu, Ném, Nổ, Điện, Độc Tố, Thời Không |
| Đội hình / máy móc | Drone, Triệu Hồi, Quân Đội, Đồng Minh, Chiến Xa, Trực Thăng, Tấn Công Tự Động |
| Mốc đặc biệt | Bậc Thầy, Nhất Kiếm và các liên kết khác trong `TAG_DEFS` |

**Mảnh Bức Phá** dùng để vượt các mốc hệ. Bốn đại hệ **Kiếm Sư, Drone, Điện, Triệu Hồi** áp dụng luật Độc Tôn: cả đội chỉ chọn một hệ Độc Tôn khi vượt mốc tương ứng. Các hệ không độc tôn có thể phát triển song song. Một số điều kiện tính theo cả đội, một số hiệu ứng tính trên từng người; cần đọc hàm xử lý cụ thể khi sửa.

### Hai nhánh đang được hoàn thiện gần đây

- **Hút Máu:** Nanh Huyết, Huyết Giáp, Khát Máu, Huyết Tế, Huyết Ma Thức Tỉnh. Tag mốc 2/4/5 hỗ trợ hút máu, chuyển hút dư thành Máu Ảo và thưởng khi có Máu Ảo/hạ địch.
- **Phòng Thủ:** Giáp Hợp Kim, Giáp Gai Phản Chấn, Thành Lũy Kiên Cố, Lá Chắn Tái Tạo, Pháo Đài Bất Khuất. Tag mốc 2/4/5 giảm sát thương 12%/24%/35%, có tăng máu, kháng choáng, tái tạo Máu Ảo và phản chấn theo mốc.

## 6. Bản đồ, nhiệm vụ và cốt truyện

Game có **16 mã loại bản đồ**, không phải chỉ có 16 màn chơi. `currentLevel` là số màn trong lượt chơi; `currentMapType` là loại bản đồ. Riêng loại 16 dùng cho cả trại nghỉ và trận phòng thủ, phân biệt bằng `objState`.

| Loại bản đồ | Nội dung |
| --- | --- |
| 1–5 | Khu Phố Bỏ Hoang, Rừng, Sông Lớn, Thành Trì, Thị Trấn Cướp |
| 6–9 | Nhà Máy Điện, Rừng Đêm, Thành Phố Tàn Phá, Rừng Mưa / Rừng Sét theo cốt truyện |
| 10–14 | Hang Z, Rừng Cây Cao, Vườn Thực Vật, Thành Phố N, Hầm Mỏ |
| 15 | Phòng Thí Nghiệm Z & Nhà Ga X |
| 16 | Khu Sống Sót / Phòng thủ Nhà Chính |

Nhiệm vụ gồm chiếm tháp tín hiệu, thu thập, diệt mục tiêu, đánh boss, giải cứu, hộ tống, nạp điện/phá khóa điện, tử thủ, thiêu thực vật đột biến, đột kích sào huyệt cướp và bảo vệ căn cứ. Tuyến đi được chọn ở Bàn Chiến Dịch; nhiều tuyến đặc biệt cần bản đồ hoặc điều kiện mở khóa.

Các chuỗi nội dung lớn:

- **Chớp và Sét:** Lõi Quá Tải → Tiến sĩ Aegis → Rừng Sét và Tàn Vết Chớp → trở lại Nhà Máy Điện → ZAP-1624 “Kình Lôi”.
- **Hang Z:** nhiều tầng, hộ tống Tiến Sĩ đặt C4 và chạy thoát; có mở khóa Hầm Mỏ.
- **Hầm Mỏ:** tổ kiến, TNT, lõi tổ và Kiến Chúa. Khi boss còn 22% máu, chuyển sang xe goòng 3 làn: 1–2 người dùng một xe, 3–4 người chia hai xe. Người lái né bẫy bằng A/D; người dẫn đường dùng radar, Q/W/E báo làn, Space bắn kiến và B kích TNT. Chơi một người có cả hai vai. Đường chạy dài 52 giây khi không bị chậm; xe có máu, choáng, giảm tốc và khoảng cách với boss. Thoát thành công kích nổ chôn boss, nhận phần thưởng/mở khóa.
- **Phòng Thí Nghiệm Z:** bảo vệ C4 25 giây, tập trung người còn sống tại cửa rồi xuống khu nghiên cứu. Mỗi lượt sinh mạng 9 phòng kết nối với hành lang và cửa hỏng/cửa thường/cửa bảo mật. Hack có ba dạng: nối mạch, căn nhịp và mã Hex; người hack bất động, bị quái đánh hoặc giải sai phải dọn phục kích rồi tiếp tục từ bước cũ. Có thẻ từ mở cửa, phòng phục kích thưởng đồ, 2 tài liệu, 2 nhà khoa học trong boongke và 3 máy khử độc. Sau 180 giây khí độc rút 1,2% máu tối đa mỗi giây, giảm tốc/sát thương 15%; bật đủ máy sẽ khử khí. Scientist gây độc, Acider để lại axit 6 giây, Chemist bắn axit và nổ lớn khi chết. Hoàn thành mục tiêu gây báo động; về sảnh giữ cạnh bảng điều khiển 3 giây để đến nhà ga, cầm cự The Hucker 50 giây rồi lên tàu theo cơ chế cũ.
- **Nhà Ga X / tàu hỏa:** tử thủ trước The Hucker rồi chiến đấu trên nóc tàu; phá móc xích, ra lệnh pháo, tăng tốc và chuyển ray.
- **The Dead:** boss ẩn có điều kiện xuất hiện, kỹ năng hiến tế/hút Tế Phẩm và phần thưởng mở Liềm.

## 7. Kẻ địch, boss và môi trường

Địch không chỉ là zombie thường: có quái chạy nhanh, giáp sắt, phun độc, triệu hồi, tự nổ, hồi sinh, lẩn trốn, điện, Witch, cướp dùng súng, cận vệ và hệ sinh thái kiến. Có quái biến dị và mức tăng sức mạnh theo tiến độ.

Boss tiêu biểu: **Khổng Lồ, Lõi Quá Tải, The Leader, Tàn Vết Chớp, ZAP-1624, The Hucker, Kiến Chúa, The Dead**. Boss có các pha/kỹ năng riêng, cảnh giới thiệu, thanh máu và hiệu ứng chiến thắng. Một số chiêu boss còn gây hại cho zombie.

Boss thường đến hạn ở map **8, 16, 24…**. Nếu đang ở map đặc biệt/nhiệm vụ cốt truyện, lượt boss được hoãn đến map thường tiếp theo: ví dụ map 8–9 đặc biệt, map 10 thường sẽ gặp boss. Thành phố tàn phá dùng The Leader; các map thường khác dùng Khổng Lồ. Hạ boss nhiệm vụ đặc biệt không tiêu thụ lượt boss thường. Nếu ở chuỗi đặc biệt qua nhiều mốc, một trận boss thường xử lý các mốc đang chờ, không dồn nhiều boss liên tiếp.

Máu boss nhân theo quân số còn kết nối (người gục vẫn tính): boss thường/cốt truyện/The Dead **×1 / 1,42 / 1,84 / 2,26** cho 1–4 người; Kiến Chúa **×1 / 1,52 / 2,04 / 2,56**. Chiêu thức/triệu hồi của từng boss cũng có điều chỉnh theo đội. Toàn bộ boss và Xúc Tu được thêm hệ số thời lượng run **×(1 + số giây / 1800)**: 10 phút ×1,33, 30 phút ×2; giáp ZAP cũng tăng tương ứng. Hệ số được chốt lúc sinh boss, không tự hồi máu giữa trận. `runElapsed` cộng thời gian chơi qua các map, có tính xe goòng/tàu, không tính trại/menu/chọn thẻ/hội thoại; được lưu và đồng bộ online. `survivalTime` vẫn là thời gian riêng của map. Bản lưu cũ thiếu thời lượng bắt đầu bộ đếm mới từ 0.

Môi trường có chướng ngại và tìm đường, vùng độc/cháy/điện, bóng tối, sụp đổ và thời tiết. Các kiểu thời tiết được đặt tên gồm trời đẹp, mưa, gió, nhiều mây, sương mù, nắng nóng, bão sét, bão tuyết, mưa acid, bóng tối, bão điện từ và mưa đá.

## 8. Căn cứ, cư dân và phòng thủ

**Khu Sống Sót** có lửa trại hồi phục, Quầy Tiếp Tế, Bàn Chiến Dịch và Xưởng Căn Cứ. Có Nhà Chính, nhà ở, nông trại, cư dân, vật liệu, lính gác, bẫy gai và ụ súng.

- Người giải cứu được đưa về căn cứ; số người ở lại phụ thuộc chỗ ở/lương thực, người chưa đủ chỗ có thể chờ.
- Ụ súng cần cư dân vận hành; thiếu người thì một số ụ không bắn.
- Cư dân còn lại làm thợ, tạo vật liệu sau chiến dịch và hỗ trợ sửa Nhà Chính.
- Có 5 loại ụ: **Súng Máy, Bắn Tỉa, Phun Lửa, Pháo Cối, Tesla**.
- Có thuê lính gác, nâng công trình, huấn luyện và Lò Rèn nâng vũ khí.
- Trong phòng thủ, địch tới theo nhiều đợt; giữ được nhà nhận thưởng, thất thủ mất tài nguyên và một phần phát triển căn cứ.

### Cửa chắn và hồi Nhà Chính

- Số cổng chốt theo quân số đầu trận: **1 hoặc 2 người → 2 cổng; 3 người → 3 cổng; 4 người → 4 cổng**.
- Cửa có **5 cấp**: Gỗ → Bọc Sắt → Thép Gai → Hợp Kim → Từ Trường.
- Nâng cửa tăng máu, giảm sát thương; cấp cao có gai phản đòn, tự sửa và điện.
- Cửa chặn zombie mặt đất và đạn địch; người chơi, đồng minh và đạn phe ta đi xuyên. Cửa đã vỡ không tự phục hồi trong cùng trận.
- Nhà Chính chỉ tự hồi sau **5 giây không nhận sát thương**. Tốc độ nền 0,07% máu tối đa/giây, cộng 0,08% mỗi thợ, tối đa 8 thợ.
- Cấp cửa và phát triển căn cứ được giữ qua màn; trạng thái cửa và máu nhà được đồng bộ tới máy khách.

## 9. Đồng minh, Drone và Chiến Xa

- Có lính bắn súng, Tiên Phong, cứu thương; lính gác được bố trí giữ cổng.
- Thẻ có thể tăng sức mạnh đội hình, chia sẻ sát thương, triệu hồi thêm quân, phối hợp bắn và nâng lính tinh nhuệ.
- Drone có nhiều vai trò: bắn phụ, hồi phục/cứu đồng đội, cảm tử, trinh sát, cận chiến, pháo, laser và tăng sức mạnh.
- Bộ đàm/nhánh Chiến Xa liên quan gọi và điều khiển xe tăng, nâng cấp, kỹ năng và tiến hóa xe.
- Trực thăng phục vụ rút lui, tiếp tế và yểm trợ; có các thẻ cải thiện cơ chế này.

## 10. Lưu game và mở khóa

- Bản lưu dùng **`localStorage`**, một ô lưu với khóa `zs_save_v1`.
- Tự lưu đầu màn và khi về trại; tải lại là tiếp tục từ checkpoint, không khôi phục mọi viên đạn/quái của khung hình vừa thoát.
- Lưu các chế độ chơi tại máy; `saveCheckpoint()` bỏ qua phiên online.
- Bản lưu chứa nhân vật, thẻ/tag, vũ khí, máu ảo, tài nguyên, căn cứ, tuyến đi và tiến độ nhiệm vụ dài.
- Có mở khóa lâu dài trên trình duyệt như Hầm Mỏ, hạ The Dead, hạ Kiến Chúa và các phần thưởng tương ứng.
- Hạ Kiến Chúa mở súng Acid cải tiến, cơ chế cánh bay và 5 thẻ Acid mới; một số phần thưởng được đưa về trại.

## 11. Kiến trúc và bản đồ mã nguồn

Game dùng **HTML + CSS + JavaScript thuần và Canvas 2D**. Không có `package.json` hoặc bước build ứng dụng trong thư mục hiện tại. `index.html` tải 20 file JavaScript theo thứ tự; chúng dùng chung phạm vi toàn cục, không phải ES modules.

| File / thư mục | Trách nhiệm chính |
| --- | --- |
| `index.html` | Điểm vào, menu, các bảng giao diện, hướng dẫn, thứ tự nạp script |
| `css/zombie.css` | CSS giao diện, bố cục và hiệu ứng |
| `js/01-core.js` | Canvas, đầu vào nền tảng, âm thanh/nhạc và các thành phần lõi |
| `js/02-data.js` | Trạng thái toàn cục, vũ khí, thẻ, tag, hằng số |
| `js/03-world.js` | Trạng thái hiệu ứng, sinh bản đồ/nhiệm vụ, va chạm, vùng nguy hiểm và tiện ích thế giới |
| `js/04-entities.js` | Player, Zombie, đạn, chém, vật ném, xe, đồng minh, NPC; xử lý chiến đấu |
| `js/05-input.js` | Ánh xạ phím/chuột, điều khiển PC và cảm ứng |
| `js/06-game.js` | Vòng lặp, bắt đầu/chuyển màn, nâng cấp, cửa hàng, lựa chọn tuyến |
| `js/07-render.js` | Vẽ thế giới/nhân vật/hiệu ứng/HUD, thanh máu và chỉ dẫn |
| `js/08-net.js` | Phòng online, PeerJS/WebRTC, gửi đầu vào, đồng bộ trạng thái/sự kiện |
| `js/09-cave.js` | Hang Z, Hầm Mỏ, tổ kiến, Kiến Chúa, vật thể và nhiệm vụ hang |
| `js/10-thedead.js` | The Dead, Liềm tạo Tế Phẩm, hiệu ứng/kỹ năng liên quan |
| `js/11-arsenal.js` | Nội tại vũ khí, Nộ, đổi thẻ, lưu/tải lượt chơi |
| `js/12-story.js` | Cốt truyện, hội thoại, đấu trường, chương điện, StoryNPC và đồng bộ truyện |
| `js/13-labz.js` | Phòng Thí Nghiệm Z, Nhà Ga X, The Hucker, màn tàu hỏa |
| `js/14-hub.js` | Khu Sống Sót, đi lại trong trại, mở các quầy/bảng |
| `js/15-ops.js` | Xưởng căn cứ, cửa chắn, ụ súng, phòng thủ nhà, đột kích và tiền tuyến |
| `js/16-skills.js` | Độ khó, kỹ năng vũ khí, điều kiện mở tuyến, nội dung wiki/hướng dẫn |
| `js/17-bosses.js` | Biến dị, thời tiết nâng cao, chiêu boss, chiến thắng và HUD boss |
| `js/18-colony.js` | Cư dân, nhà ở/nông trại, vật liệu, Lò Rèn, hướng dẫn người mới và mở rộng căn cứ |
| `js/19-admin.js` | Công cụ quản trị/thử nghiệm: nhảy màn, cấp đồ, triệu hồi, bất tử và debug |
| `js/20-queen.js` | Mở khóa Kiến Chúa, nâng cấp Acid, cánh bay và kiến hỗ trợ |
| `js/21-lab-rework.js` | Sinh Lab, cửa/hack, khí độc, phòng/NPC, quái riêng và đồng bộ Lab |
| `js/22-minecart.js` | Xe goòng, chia vai 1–4 người, radar/ping/bẫy/TNT và đồng bộ xe |
| `Audio-SoundEffect/` | Nhạc và hiệu ứng âm thanh chia theo nhóm |
| `tests/defense-lifesteal.test.cjs` | Kiểm thử hồi quy cơ chế phòng thủ và hút máu |
| `tests/browser-smoke.cjs` | Kiểm tra tích hợp trên Edge qua Playwright: trận phòng thủ, mua cửa, hướng dẫn |
| `THIẾT KẾ.md` | Thiết kế chi tiết đợt làm lại Phòng Thí Nghiệm Z (Lab Z) & Xe Goòng Hầm Mỏ |

Phụ thuộc bên ngoài hiện có: Tailwind tải từ CDN để dựng giao diện; PeerJS được tải khi dùng online. Logic trận online chủ yếu do **chủ phòng** quyết định, máy khách gửi đầu vào và nhận trạng thái.

## 12. Hướng dẫn nhanh cho người sửa / AI tiếp quản

- Đọc `NDGame.md` để định vị tính năng, đọc `THIẾT KẾ.md` khi triển khai nhánh làm lại Phòng Thí Nghiệm Z (Lab Z) và Xe Goòng Hầm Mỏ, rồi kiểm tra mã thực tế.
- Giữ thứ tự script trong `index.html`. Một số file sau **bọc lại hàm/prototype đã khai báo ở file trước**; tìm toàn bộ nơi gán và gọi hàm trước khi sửa.
- Thêm thẻ cần kiểm tra đủ: dữ liệu `UPGRADES`, perk thật sự được áp dụng, tag/mốc, điều kiện chọn thẻ, mô tả và wiki. Một số thẻ được thêm bằng `UPGRADES.push()` ở file sau.
- Thêm vũ khí cần kiểm tra key/ID, bảng kỹ năng, nhặt đồ, hình vẽ và mạng. Không chỉ thêm dòng vào bảng dữ liệu.
- Dùng `zombieDown()` để ghi nhận mạng hạ và xử lý hồi sinh, tránh cộng thưởng hai lần. Thận trọng với hiệu ứng dây chuyền khi hạ địch.
- Phân biệt `hp`, `vHp` và `tempShield`; phân biệt `isDowned` với `netLeft`.
- Khi đổi trạng thái cần lưu hoặc gửi mạng, xem cả `savePlayer`/`baseSave`/`baseLoad`, `08-net.js`, `storyNetState`/`storyNetApply` và hàm vẽ phía khách.
- Khi thêm nội dung, kiểm tra một người, hai người chung máy và chủ phòng/máy khách; không dùng quân số cố định là 2.
- Không lấy comment cũ làm nguồn duy nhất: ví dụ một số chú thích thứ tự nạp hoặc số cổng có thể thuộc phiên bản trước. Ưu tiên mã đang chạy.

### Chạy và kiểm tra

Mở `index.html` bằng trình duyệt; để phát triển có thể phục vụ thư mục này bằng một HTTP server tĩnh. Chế độ online và tài nguyên CDN cần kết nối mạng.

Kiểm thử tự động hiện có, yêu cầu Node.js:

```sh
node --test tests/expeditions.test.cjs tests/upgrade-recovery.test.cjs
node --test tests/boss-progression.test.cjs
```

Bộ kiểm thử tải cả 22 script theo thứ tự HTML, giả lập DOM/âm thanh. Bao gồm 12 nhóm phòng thủ/hút máu, 3 nhóm phục hồi nâng cấp và 11 nhóm Lab/xe goòng. Hai file kiểm thử trên cùng nạp 12 nhóm nền nên Node báo tổng 38 lượt. Kiểm thử mạng mô phỏng lệnh và trạng thái chủ phòng/máy khách; chưa xác nhận kết nối WebRTC thực tế trên nhiều thiết bị.

## 13. Trạng thái công việc gần nhất

Đợt mới nhất: triển khai **Lab Z và Xe Goòng** theo `THIẾT KẾ.md` cập nhật 29/10/2026. Hai module mới nạp sau module 20 và bọc hàm cũ; giữ màn tàu hỏa trước đó. Logic và lệnh tương tác do chủ phòng xử lý, máy khách nhận trạng thái.

Đã sửa lỗi khách P3/P4 giữ trạng thái chọn thẻ của vòng trước bằng mã vòng nâng cấp. Nút **Fix Nhanh** ở màn nâng cấp/chờ cho phép bỏ các lựa chọn còn thiếu, đánh dấu cả đội sẵn sàng và chuyển tiếp một lần; lệnh thuộc vòng cũ bị từ chối. Bản sửa đã đẩy lên `origin/main`, commit `d3b1091`.

Sau khi hoàn thành tài liệu, đã tiếp tục kiểm tra trực tiếp trên Edge: khởi động game, vào màn phòng thủ 2 cổng, mô phỏng 15 giây chiến đấu, vẽ cửa/nhà/HUD, mua đủ 5 cấp cửa và mở hướng dẫn đều qua kiểm tra, không ghi nhận lỗi JavaScript vòng lặp. Hướng dẫn đã bổ sung danh sách thẻ Liềm, Hút Máu và Phòng Thủ lấy trực tiếp từ dữ liệu game. Kiểm thử logic 12/12 nhóm vẫn đạt.

Kiểm thử trình duyệt tùy chọn: cài/định vị module `playwright`, có Microsoft Edge, rồi chạy `node tests/browser-smoke.cjs` và `node tests/expeditions-browser.cjs`. Bộ thứ hai kiểm tra chuyển từ C4 sang Lab, hack, nhà ga, chuyển hầm sang xe goòng 4 người và vẽ ở kích thước desktop/điện thoại. Chưa kiểm tra kết nối online thực tế trên nhiều máy; kiểm thử hiện tại mới xác minh dữ liệu/lệnh đồng bộ của các cơ chế mới. Mic trong thiết kế là giao tiếp thoại bên ngoài; game có Quick Ping, chưa tích hợp voice chat.
