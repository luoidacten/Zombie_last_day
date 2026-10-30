# NDGame — Tổng quan nội dung và cấu trúc game

Cập nhật: **31/10/2026**, đối chiếu mã nguồn hiện có.

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
- Cả đội gục ở màn đi cảnh được trực thăng cứu về trại sau cảnh cứu hộ 4 giây: mất 50% phế liệu kiếm trong màn (không tính tiền mang từ trại), mất 25% đạn/độ bền đang cầm, tỉnh dậy với 50% máu và 0 Máu Ảo. Bộ đếm chiến dịch tăng 1 ngay khi rút lui; cờ màn chờ giúp lần xuất phát sau không tăng lần nữa hoặc bỏ qua map phòng thủ. Trong trận thủ nhà, mỗi người gục tự hồi sinh sau 12 giây nếu Nhà Chính còn sống. Chỉ Nhà Chính bị phá mới kết thúc lượt chơi và xóa checkpoint của lượt đó.
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
- **Phòng Thủ:** Giáp Hợp Kim, Giáp Gai Phản Chấn, Thành Lũy Kiên Cố, Lá Chắn Tái Tạo, Pháo Đài Bất Khuất. Tag mốc 2/4/5 giảm sát thương 8%/16%/22%, có tăng máu, kháng choáng, tái tạo Máu Ảo và phản chấn theo mốc.

## 6. Bản đồ, nhiệm vụ và cốt truyện

Game có **17 mã loại bản đồ**, không phải chỉ có 17 màn chơi. `currentLevel` là số màn trong lượt chơi; `currentMapType` là loại bản đồ. Riêng loại 16 dùng cho cả trại nghỉ và trận phòng thủ, phân biệt bằng `objState`.

| Loại bản đồ | Nội dung |
| --- | --- |
| 1–5 | Khu Phố Bỏ Hoang, Rừng, Sông Lớn, Thành Trì, Thị Trấn Cướp |
| 6–9 | Nhà Máy Điện, Rừng Đêm, Thành Phố Tàn Phá, Rừng Mưa / Rừng Sét theo cốt truyện |
| 10–14 | Hang Z, Rừng Cây Cao, Vườn Thực Vật, Thành Phố N, Hầm Mỏ |
| 15 | Phòng Thí Nghiệm Z & Nhà Ga X |
| 16 | Khu Sống Sót / Phòng thủ Nhà Chính |
| 17 | Rừng Tuyết: lạnh tích lũy, lửa sưởi và ba biến thể zombie băng |

Nhiệm vụ gồm chiếm tháp tín hiệu, thu thập, diệt mục tiêu, đánh boss, giải cứu, hộ tống, nạp điện/phá khóa điện, tử thủ, thiêu thực vật đột biến, đột kích sào huyệt cướp và bảo vệ căn cứ. Tuyến đi được chọn ở Bàn Chiến Dịch; nhiều tuyến đặc biệt cần bản đồ hoặc điều kiện mở khóa.

**Map thám hiểm thường:** loại 1/2/3/7/8/9/11/12/13/17 với nhiệm vụ TOWERS/COLLECT/KILL/RESCUE/BURN_PLANTS/SURVIVAL dùng vùng chơi 8.000 × 8.000 (gấp đôi mỗi chiều trước đây), viền tự nhiên và các chunk 1.000. Chỉ dựng địa hình quanh đội khi khám phá; các điểm nhiệm vụ được đặt trước để giữ đủ mục tiêu. Vách núi, cụm rừng lớn và sông chặn di chuyển; luôn chừa lối đến mục tiêu và điểm rút lui. Sông thám hiểm có 4 cầu, sông trong map kịch bản có 3 cầu; không thể bước/lướt từ cầu xuống nước. Các màn hang, phòng thủ, nhà ga, boss và sự kiện vẫn dùng bố cục riêng.

Tháp tín hiệu ngẫu nhiên và cách nhau ít nhất 1.450 đơn vị trong map thám hiểm. Dễ cần 1–2 tháp, Thường 2–4, Khó 3–5, Địa Ngục 4–6. Tháp chỉ hiện khi đội đến gần 650 đơn vị; sau 90 giây không tiến triển, bộ đàm chỉ một tháp chưa tìm thấy và tăng áp lực zombie. Map thường giảm mật độ zombie; nhiệm vụ mới **SURVIVAL / Sinh Tồn Bầy Đàn** có mật độ cao nhất trong các map thường, cầm cự 30/60/90/120 giây theo độ khó rồi gọi trực thăng. Điểm đáp chọn ngẫu nhiên ở vùng đi được; có cảnh báo và dấu chỉ dẫn trước khi đáp tối thiểu 15 giây.

**Rừng Tuyết** vào vòng bản đồ từ màn 3, cũng chọn được tại Bàn Chiến Dịch. Lạnh tăng khi ở ngoài trời, giảm khi gần lửa sưởi; đầy lạnh gây đóng băng ngắn. Xác Băng (55) đánh cận chiến, Phun Băng (56) bắn mảnh băng, Khổng Lồ Băng (57) có đòn vùng báo trước. Rét cộng dồn làm chậm, đủ 5 tầng đóng băng 1,1 giây rồi có khoảng chống đóng băng liên tiếp. Lửa sưởi trong vùng 240 đơn vị giảm lạnh và xóa trạng thái băng.

Các chuỗi nội dung lớn:

- **Chớp và Sét:** Lõi Quá Tải → Tiến sĩ Aegis → Rừng Sét và Tàn Vết Chớp → trở lại Nhà Máy Điện → ZAP-1624 “Kình Lôi”.
- **Hang Z:** nhiều tầng, hộ tống Tiến Sĩ đặt C4 và chạy thoát; có mở khóa Hầm Mỏ.
- **Hầm Mỏ:** đẩy xe bom theo đường dài hoặc nhánh Acid → phá mạch phụ (không bắt buộc) → vào đấu trường hạ Kiến Chúa → nhặt lõi → chạy qua hành lang sập → lên xe goòng 3 làn. 1–2 người một xe, 3–4 người hai xe. Người lái A/D né bẫy, Shift/C tăng tốc; người dẫn đường Q/W/E báo làn, Space bắn kiến, B dùng TNT. Chơi một người có cả hai vai. Đá/vật rơi được báo trước, luôn chừa làn thoát. Khoảng cách bị rút liên tục; né đúng tích nhiên liệu, TNT có giới hạn. Chạy thẳng bỏ mặc bẫy sẽ mất xe và gọi cứu hộ. Không tạo thêm Kiến Chúa hoặc thưởng hạ boss lần hai khi lên xe.
- **Phòng Thí Nghiệm Z:** bảo vệ C4 25 giây, tập trung người còn sống tại cửa rồi xuống khu nghiên cứu. Mỗi lượt sinh mạng 9 phòng kết nối với hành lang và cửa hỏng/cửa thường/cửa bảo mật. Hack có ba dạng: nối mạch, căn nhịp và mã Hex; người hack bất động, bị quái đánh hoặc giải sai phải dọn phục kích rồi tiếp tục từ bước cũ. Có thẻ từ mở cửa, phòng phục kích thưởng đồ, 2 tài liệu, 2 nhà khoa học trong boongke và 3 máy khử độc. Sau 180 giây khí độc rút 1,2% máu tối đa mỗi giây, giảm tốc/sát thương 15%; bật đủ máy sẽ khử khí. Scientist gây độc, Acider để lại axit 6 giây, Chemist bắn axit và nổ lớn khi chết. Hoàn thành mục tiêu gây báo động; về sảnh giữ cạnh bảng điều khiển 3 giây để đến nhà ga, cầm cự The Hucker 50 giây rồi lên tàu theo cơ chế cũ.
- **Nhà Ga X / tàu hỏa:** tử thủ trước The Hucker rồi chiến đấu trên nóc tàu; phá móc xích, ra lệnh pháo, tăng tốc và chuyển ray.
- **The Dead:** boss ẩn có điều kiện xuất hiện, kỹ năng hiến tế/hút Tế Phẩm và phần thưởng mở Liềm.

## 7. Kẻ địch, boss và môi trường

Địch không chỉ là zombie thường: có quái chạy nhanh, giáp sắt, phun độc, triệu hồi, tự nổ, hồi sinh, lẩn trốn, điện, Witch, cướp dùng súng, cận vệ và hệ sinh thái kiến. Có quái biến dị và mức tăng sức mạnh theo tiến độ.

Boss tiêu biểu: **Khổng Lồ, Lõi Quá Tải, The Leader, Tàn Vết Chớp, ZAP-1624, The Hucker, Kiến Chúa, The Dead**. Boss có các pha/kỹ năng riêng, cảnh giới thiệu, thanh máu và hiệu ứng chiến thắng. Một số chiêu boss còn gây hại cho zombie.

Kiến Chúa pha 1 bất tử khi bay: đòn trúng làm mất giáp bay và rút ngắn thời gian trên không. Tự đáp sau tối đa 14 giây, mở cửa sổ tấn công 4 giây; phá hết giáp buộc đáp và suy yếu 7 giây, nhận sát thương ×2. Cất cánh hồi nửa giáp. Hầm mỏ chuyển pha ở 45% máu; bản Kiến Chúa cũ ở 68%; các pha tiếp theo giữ luật riêng. Tăng nhẹ số kiến hỗ trợ. Sân The Hucker có bán kính tối thiểu 1.350 thay vì khoảng 640.

Zombie/cướp đã dính lửa hoặc axit mang dấu chặn hồi sinh suốt đời thực thể: zombie hồi sinh chết hẳn, cướp không được quân y dựng dậy khi đã gục và không hóa zombie. Dấu vẫn còn sau khi trạng thái cháy/ăn mòn hết.

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
- Trong phòng thủ, địch tới theo nhiều đợt; giữ được nhà nhận thưởng. Nhà Chính bị phá là thua hoàn toàn; cả đội gục khi nhà còn sống vẫn được hồi sinh để tiếp tục thủ.

### Cửa chắn và hồi Nhà Chính

- Số cổng chốt theo quân số đầu trận: **1 hoặc 2 người → 2 cổng; 3 người → 3 cổng; 4 người → 4 cổng**.
- Cửa có **5 cấp**: Gỗ → Bọc Sắt → Thép Gai → Hợp Kim → Từ Trường.
- Nâng cửa tăng máu, giảm sát thương; cấp cao có gai phản đòn, tự sửa và điện.
- Cửa chặn zombie mặt đất và đạn địch; người chơi, đồng minh và đạn phe ta đi xuyên. Cửa đã vỡ không tự phục hồi trong cùng trận.
- Nhà Chính chỉ tự hồi sau **5 giây không nhận sát thương**. Tốc độ nền 0,07% máu tối đa/giây, cộng 0,08% mỗi thợ, tối đa 8 thợ.
- Cấp cửa và phát triển căn cứ được giữ qua màn; trạng thái cửa và máu nhà được đồng bộ tới máy khách.

### Nâng ụ súng theo ba nhánh

Cả 5 ụ Súng Máy/Bắn Tỉa/Phun Lửa/Pháo Cối/Tesla có ba nhánh A/B/C, mỗi nhánh 4 bậc: tổng **60 lựa chọn nâng**. Chỉ dùng tối đa hai nhánh, một nhánh vượt bậc 2; tổ hợp cao nhất 4–2–0. Bậc 3 mở kỹ năng, bậc 4 có hình Canvas riêng và cần 2 cư dân vận hành. Thiếu cư dân thì ụ không bắn; các cư dân còn lại làm thợ sửa nhà. Phun Acid C3 cần mở khóa hạ Kiến Chúa.

Các dạng bậc 4 gồm Gatling Plasma / Pháo 30mm / Bão Đạn 360°, Railgun / Xạ Thủ Tinh Nhuệ / Trạm Tiếp Tế, Lò Nhiệt Hạch / Napalm / Sương Bào Tử, Siêu Pháo Nhiệt Áp / Katyusha / EMP, Kình Lôi / Trạm Phát Xung / Lõi Hút. Có xuyên hàng, đẩy lùi/choáng boss, đánh dấu tăng sát thương, thưởng phế liệu, thả đạn/máu, vùng cháy/ăn mòn, xác nổ dây chuyền, bức xạ, phá tàng hình, tê liệt xe cướp/khóa kỹ năng boss 3 giây, hàng rào điện, tăng 35% tốc bắn, giáp năng lượng cho nhà/cửa và gom quái. Giáp năng lượng không dựng lại cửa đã vỡ; sửa nhà/cửa vẫn cần 5 giây không bị đánh. Bản lưu ụ cấp 1–5 cũ chuyển thành A0–A4, giữ loại ụ và tiến trình.

## 9. Đồng minh, Drone và Chiến Xa

- Có lính bắn súng, Tiên Phong, cứu thương; lính gác được bố trí giữ cổng.
- Thẻ có thể tăng sức mạnh đội hình, chia sẻ sát thương, triệu hồi thêm quân, phối hợp bắn và nâng lính tinh nhuệ.
- Drone có nhiều vai trò: bắn phụ, hồi phục/cứu đồng đội, cảm tử, trinh sát, cận chiến, pháo, laser và tăng sức mạnh.
- Bộ đàm/nhánh Chiến Xa liên quan gọi và điều khiển xe tăng, nâng cấp, kỹ năng và tiến hóa xe.
- Trực thăng phục vụ rút lui, tiếp tế và yểm trợ; có các thẻ cải thiện cơ chế này.

## 10. Lưu game và mở khóa

- Bản lưu dùng **`localStorage`**, một ô lưu với khóa `zs_save_v1`.
- Tự lưu đầu màn và khi về trại; tải lại là tiếp tục từ checkpoint, không khôi phục mọi viên đạn/quái của khung hình vừa thoát.
- Chơi tại máy tự lưu như cũ; online chỉ **chủ phòng** ghi bản lưu chính. Nhập tên trước khi tạo/vào phòng. Trình duyệt giữ `playerUUID` cố định riêng với tên; reconnect đối chiếu UUID để trả đúng nhân vật, kể cả khi vị trí P2/P3/P4 thay đổi.
- `partyRoster` giữ tối đa 4 hồ sơ đội hình; `partyArchive` giữ hồ sơ đang nghỉ, tránh mất người cũ khi người mới thay chỗ. Chủ phòng chọn nhân vật mới hoặc cho mượn hồ sơ đang nghỉ ở sảnh/Xưởng Căn Cứ. Người mượn không đổi chủ sở hữu; tiến triển của nhân vật mượn được trả về hồ sơ gốc.
- Nếu tất cả khách mất mạng, chủ phòng vẫn chơi và giữ phòng mở. Người cũ vào lại ngay giữa màn; người mới vào khi đội ở căn cứ. Khi tải checkpoint online, chủ phòng tạo mã mới bằng **CHƠI TIẾP** hoặc **TIẾP TỤC ĐỘI ĐÃ LƯU**; có thể bắt đầu một mình rồi đợi bạn bè. Không có tự chuyển quyền chủ phòng khi host mất kết nối.
- Bản lưu chứa nhân vật, thẻ/tag, vũ khí, máu ảo, tài nguyên, căn cứ, tuyến đi và tiến độ nhiệm vụ dài.
- Có mở khóa lâu dài trên trình duyệt như Hầm Mỏ, hạ The Dead, hạ Kiến Chúa và các phần thưởng tương ứng.
- Hạ Kiến Chúa mở súng Acid cải tiến, cơ chế cánh bay và 5 thẻ Acid mới; một số phần thưởng được đưa về trại.

## 11. Kiến trúc và bản đồ mã nguồn

Game dùng **HTML + CSS + JavaScript thuần và Canvas 2D**. Không có `package.json` hoặc bước build ứng dụng trong thư mục hiện tại. `index.html` tải 39 file JavaScript theo thứ tự; chúng dùng chung phạm vi toàn cục, không phải ES modules.

| File / thư mục | Trách nhiệm chính |
| --- | --- |
| `index.html` | Điểm vào, menu, các bảng giao diện, hướng dẫn, thứ tự nạp script |
| `css/zombie.css` | CSS giao diện, bố cục và hiệu ứng |
| `css/presentation.css` | Giao diện mới: menu, bảng/nút, thẻ nâng cấp, bố cục điện thoại, focus và giảm chuyển động |
| `assets/survivor-outpost.svg` | Minh họa menu, vẽ vector nội bộ không phụ thuộc ảnh ngoài |
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
| `js/23-supplies-training.js` | Thực phẩm, tập luyện theo cấp Nhà Chính, nội tại, băng đạn/nạp, thùng tiếp tế, toàn màn hình |
| `js/24-bandits.js` | Ba phe, tám lớp cướp, hồi sinh/hóa zombie, morale, Scout và xe tải |
| `js/25-chainsaw.js` | Cưa Máy, vòng tua, lao, Nộ, perk và tag Tiến Công |
| `js/26-world-biome.js` | POI theo biome, tháp tín hiệu, vật thể tương tác, vùng dị biến |
| `js/27-cave-expansion.js` | Công trình hang, xe bom hai nhánh ray, phá mạch, Kiến Chúa mới, thoát bộ rồi xe goòng |
| `js/28-world-art.js` | Đồ họa cướp theo vai trò, chiến xa, tiền đồn, POI, vật thể hang và thùng tiếp tế |
| `js/29-character-art.js` | Người chơi, zombie, boss, kiến, xúc tu, thương điện và đồng minh |
| `js/30-environment-art.js` | Nền biome, kiến trúc/vật cản, căn cứ/cửa chắn, NPC/cư dân, xe tăng, Lab và xe goòng |
| `js/31-interface.js` | HUD, chất lượng chi tiết, tương tác bàn phím/ARIA, focus hộp thoại và bố cục nâng cấp |
| `js/32-resilience.js` | Sáu perk Máu Ảo/giảm sát thương, cooldown và nâng sức chứa súng từ bản lưu cũ |
| `js/33-expeditions.js` | Map thường lớn, chunk, sông/cầu, rừng/vách chặn, tháp ẩn, đường đến mục tiêu, điểm đáp và đồng bộ địa hình |
| `js/34-snow-bosses.js` | Rừng Tuyết, lạnh/rét/đóng băng, quái băng, giáp bay Kiến Chúa, HUD và dữ liệu online |
| `js/35-coop-save.js` | Tên/UUID, checkpoint co-op, kho hồ sơ, nối lại phòng và cho mượn nhân vật |
| `js/36-recovery.js` | Cứu hộ khẩn cấp, hình phạt, màn chờ, hồi sinh thủ nhà và True Game Over |
| `js/37-turret-paths.js` | 60 bậc nâng ụ, luật 4–2–0, nhân lực, chiến đấu, hình Canvas và đồng bộ hiệu ứng |
| `js/38-cave-reliability.js` | Va chạm đường đi hang, cache dẫn đường, chỉ dẫn mục tiêu, thời gian thoát theo tuyến, hành lang sập và cột chống |
| `js/39-sustain-balance.js` | Giới hạn hồi phục chung, suy giảm hồi sau trúng đòn, ngữ cảnh sát thương boss, trần Máu Ảo, mô tả và migration |
| `docs/update-implementation.md` | Hành vi thực tế, thông số và giới hạn đợt cập nhật 30/10/2026 |
| `Audio-SoundEffect/` | Nhạc và hiệu ứng âm thanh chia theo nhóm |
| `tests/defense-lifesteal.test.cjs` | Kiểm thử hồi quy cơ chế phòng thủ và hút máu |
| `tests/browser-smoke.cjs` | Kiểm tra tích hợp trên Edge qua Playwright: trận phòng thủ, mua cửa, hướng dẫn |
| `THIẾT KẾ.md` | Tài liệu thiết kế tổng thể: Lab Z, Xe Goòng Hầm Mỏ, Băng Cướp Utility AI, Trang Bị 6 Món, Base-Building & Hệ Thống Bản Đồ 16 Map Biome/POI |

Phụ thuộc bên ngoài hiện có: Tailwind tải từ CDN để dựng giao diện; PeerJS được tải khi dùng online. Logic trận online chủ yếu do **chủ phòng** quyết định, máy khách gửi đầu vào và nhận trạng thái.

## 12. Hướng dẫn nhanh cho người sửa / AI tiếp quản

- Đọc `NDGame.md` để định vị tính năng, đọc `THIẾT KẾ.md` khi triển khai các nhánh cập nhật lớn (Lab Z, Xe Goòng, Băng Cướp, Trang Bị, Base-Building, Bản Đồ 16 Map), rồi kiểm tra mã thực tế.
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
node --test tests/bandit-encounters.test.cjs tests/modern-update.test.cjs tests/boss-progression.test.cjs tests/expeditions.test.cjs tests/upgrade-recovery.test.cjs tests/resilience.test.cjs
node tests/presentation-browser.cjs
node tests/horror-browser.cjs
```

Bộ kiểm thử logic tải cả 32 script theo thứ tự HTML, giả lập DOM/âm thanh. Lệnh trên báo 127 lượt đạt (mỗi file cùng nạp 12 nhóm nền). Kiểm thử trình duyệt cần Playwright và Edge: mở menu, chọn thẻ/tuyến bằng bàn phím, 16 map, căn cứ/cửa hàng, các loại quái và bố cục PC/điện thoại. Có kiểm tra màn nâng cấp hai người chung máy và khách P3. Kiểm thử mạng mô phỏng lệnh và trạng thái chủ phòng/máy khách; chưa xác nhận kết nối WebRTC thực tế trên nhiều thiết bị.

## 13. Trạng thái công việc gần nhất

**Cưa Máy:** có hiệu ứng cắt riêng, mạt/bụi máu khi chạm địch, tia lửa khi chạm giáp/kim loại, mạt gỗ khi phá vật thể, vệt lao và vòng quá tải. Xích/răng cưa chạy theo trạng thái, thân máy rung; hiệu ứng và trạng thái vòng tua/Nộ/đang lao gửi tới máy khách.

**Cân bằng hiện tại (31/10):** Huyết Nang +15% trần Máu Ảo; Thu Gom Sinh Lực +1% mỗi mạng, hồi 1s; Màng Máu Tái Sinh đợi 6s, hồi 1%/s tới 15%; Da Kết Huyết giảm 6%; Cầm Cự giảm 10%; Dư Chấn Huyết Giáp giảm 10% trong 4s, hồi 12s. Máu Ảo nền 25%, tối đa 80% máu tối đa khi đủ toàn bộ nhánh. Hồi phục lặp lại dùng chung ngân sách 6% máu tối đa/giây (hút máu riêng tối đa 4%); trúng đòn giảm tốc hồi 75% trong 4s. Đợi 6s an toàn mới tự hồi, chỉ dùng nguồn tái tạo Máu Ảo mạnh nhất. Tổng giảm sát thương tối đa 60%, với boss 45%, chiêu nặng 30%; chiêu nặng xuyên 40% lớp Máu Ảo và không bị phản đòn/né ngẫu nhiên. Vật phẩm tiêu hao vẫn có thể hồi ngay. Lục/Tiểu Liên/AR/Súng Săn/Ngắm/Phóng Lựu giữ sát thương 175/28/80/240/440/155, tổng đạn 84/360/200/72/35/14 và băng 12/30/25/6/5/1.

**30/10/2026 — làm mới hình ảnh và UI/UX:** dùng tông than đen, xám ngà và điểm nhấn đỏ sẫm; giảm màu cạnh tranh trong thẻ/wiki. Hình cũ được bỏ ở tháp tín hiệu, NPC, nhà dân, máy Lab, tổ kiến và xe mỏ. Zombie đánh xa có dáng phun axit, cung, súng và điện riêng, thêm chuyển động thở/đi/tấn công; người chơi có động tác nạp, vật thể có quạt, đèn, sóng, cây/ruộng đung đưa và khói. Người chơi có giáp/mũ/ba lô và dấu màu đội; zombie, boss, kiến, xúc tu, thương điện và các lớp cướp có hình dáng/trang bị riêng. Cập nhật nền 16 map theo nhóm biome, cây/đá/nhà/tường, Lab, tàu/xe goòng, xe tăng, quầy căn cứ, nhà dân/nông trại/tháp canh, NPC và cư dân. Menu có minh họa riêng, lựa chọn chế độ rõ ràng, cài đặt thu gọn. HUD, hội thoại, cửa hàng và thẻ nâng cấp cùng phong cách; thẻ/tuyến hỗ trợ Enter/Space, hộp thoại hỗ trợ focus và bàn phím. Có tùy chọn chi tiết **Tự động / Cao / Thấp** lưu theo trình duyệt; Tự động giảm mật độ nền/tán cây dưới 900px. Chi tiết này không đổi chỉ số hoặc va chạm. Bản hiện tại nạp **32 script**; xem `tests/presentation-browser.cjs`.

**30/10/2026 — cập nhật mới:** Nhà Chính cấp 2 mở Khu Tập Luyện dùng thực phẩm (mỗi cư dân tạo 3 thực phẩm/chiến dịch). Nhà cấp 2/3/4/5 có giới hạn 2/4/7/10 lần mỗi nhánh Máu/Tốc độ/Sát thương; Nhà cao tăng lượng chỉ số mỗi lần, tập đủ mở nội tại. Có thùng đạn/thùng máu; súng thường dùng băng riêng, Tiểu Liên 30 và AR 25 viên. Hết băng tự nạp hoặc nạp bằng **F/nút NẠP**; **R** dùng Nộ. Thêm tag và 5 perk Nạp Đạn, nút toàn màn hình và gợi ý xoay ngang khi online.

Đã triển khai nội dung từ `docs/Cập nhâtz.txt` qua module 24–27: tám lớp cướp/ba phe và vòng đời chống thưởng lặp, xe tải, Cưa Máy, POI theo biome, công trình hang và chuỗi Kiến Chúa mới. Xem `docs/update-implementation.md` để biết hành vi và thông số thực tế. Chạy kiểm thử phần mới bằng `node --test tests/modern-update.test.cjs`; kiểm tra giao diện bằng `node tests/modern-browser.cjs` (cần Playwright + Edge).

**Điều chỉnh cướp và hình ảnh:** cướp chỉ xuất hiện từ map thứ 8 của run. Map thường không có cướp trong vòng spawn ngẫu nhiên; chúng là nhóm gác cố định (tiền đồn 3, tháp 2) hoặc tối đa 4 lính từ một xe. Map thường có ngân sách tổng 10 cướp/1 xe; map 4/5/16 có 24 cướp/2 xe. Chốt bị dọn không sinh lại; xe rời đi/bị phá không được bổ sung. Module 28 vẽ lại nhân vật theo vai, chiến xa, công trình và tiếp tế. Kiểm tra bằng `tests/bandit-encounters.test.cjs` và `tests/world-art-browser.cjs`.

Các đoạn bên dưới ghi lịch sử đợt trước; luồng Kiến Chúa mới ở module 27 thay thế việc lên xe khi boss còn 22% máu.

Lịch sử đợt 29/10: triển khai **Lab Z và Xe Goòng** theo `THIẾT KẾ.md` cập nhật 29/10/2026. Hai module mới nạp sau module 20 và bọc hàm cũ; giữ màn tàu hỏa trước đó. Logic và lệnh tương tác do chủ phòng xử lý, máy khách nhận trạng thái.

Đã sửa lỗi khách P3/P4 giữ trạng thái chọn thẻ của vòng trước bằng mã vòng nâng cấp. Nút **Fix Nhanh** ở màn nâng cấp/chờ cho phép bỏ các lựa chọn còn thiếu, đánh dấu cả đội sẵn sàng và chuyển tiếp một lần; lệnh thuộc vòng cũ bị từ chối. Bản sửa đã đẩy lên `origin/main`, commit `d3b1091`.

Sau khi hoàn thành tài liệu, đã tiếp tục kiểm tra trực tiếp trên Edge: khởi động game, vào màn phòng thủ 2 cổng, mô phỏng 15 giây chiến đấu, vẽ cửa/nhà/HUD, mua đủ 5 cấp cửa và mở hướng dẫn đều qua kiểm tra, không ghi nhận lỗi JavaScript vòng lặp. Hướng dẫn đã bổ sung danh sách thẻ Liềm, Hút Máu và Phòng Thủ lấy trực tiếp từ dữ liệu game. Kiểm thử logic 12/12 nhóm vẫn đạt.

Kiểm thử trình duyệt tùy chọn: cài/định vị module `playwright`, có Microsoft Edge, rồi chạy `node tests/browser-smoke.cjs` và `node tests/expeditions-browser.cjs`. Bộ thứ hai kiểm tra chuyển từ C4 sang Lab, hack, nhà ga, chuyển hầm sang xe goòng 4 người và vẽ ở kích thước desktop/điện thoại. Chưa kiểm tra kết nối online thực tế trên nhiều máy; kiểm thử hiện tại mới xác minh dữ liệu/lệnh đồng bộ của các cơ chế mới. Mic trong thiết kế là giao tiếp thoại bên ngoài; game có Quick Ping, chưa tích hợp voice chat.


### 31/10/2026 — sửa hang/hầm và giảm khả năng đứng chịu đòn boss

- Tiến Sĩ và kiến dùng phép kiểm tra đường đi có bán kính, không cắt góc tường; dựng lại bản đồ/vách đá làm mới cache dẫn đường. C4 chỉ được gài khi còn người hộ tống gần. Đồng hồ chạy thoát dựa trên độ dài tuyến tới cửa; chỉ dẫn xe bom/lõi thưởng/cổng/đường thoát theo đúng giai đoạn. Bỏ cầu đá/cầu gỗ trang trí gây nguy hiểm trên nền hang không có vực tương ứng.
- Xe bom đường dài tăng tốc, giới hạn lợi ích đẩy nhiều người. Kiến Chúa pha tối vẫn thả Acid khi máy phát tắt; TNT chạm được boss đang bay và chỉ tiêu thụ một lần. Hành lang cuối có vách đổ xen kẽ nhưng còn đường đi, đá rơi báo 1,4s, đàn kiến và mép sập đuổi sát; bắn cột làm chậm mép sập. Xe goòng có tăng tốc hữu hạn, TNT hữu hạn, bẫy 1–2 làn luôn có lối né, bạn trở lại được nhận lại vai radar. HUD/điều khiển xe hỗ trợ màn ngang điện thoại, không chồng nút nạp đạn; bỏ bảng giới thiệu/chiến thắng boss cũ lúc bắt đầu chạy thoát.
- Xem `docs/cave-sustain-balance.md` cho luật cân bằng chính xác. `tests/cave-balance.test.cjs` kiểm tra đường đi Tiến Sĩ trên 8 seed, áp lực chạy thoát, lái xe có/không phản ứng ở bốn độ khó, giới hạn hồi phục, chiêu nặng/Acid boss, đồng bộ và bản lưu cũ. `tests/cave-browser.cjs` kiểm tra chuỗi màn và bấm bàn phím/cảm ứng trên Edge. Co-op kiểm thử qua transport PeerJS mô phỏng, chưa kiểm tra mạng Internet nhiều máy thật.
