# Co-op, cứu hộ và ụ rẽ nhánh — 30/10/2026

## Lưu đội hình và kết nối lại

`saveCheckpoint()` vẫn dùng `zs_save_v1`, tương thích bản lưu cũ. Máy khách không ghi checkpoint chính. Chủ phòng tự lưu trước `startLevel()`, khi về trại và sau khi đổi nâng cấp/hồ sơ ở trại. Bản lưu là checkpoint đầu màn hoặc trại; không lưu lại từng viên đạn/quái đang bay. Các trường cũ `pl`, `base`, `story`, tuyến/floor, tài nguyên, thời lượng run vẫn được giữ.

Trường mới: `online`, `hostUUID`, `partyRoster` (tối đa 4 hồ sơ đội), `partyArchive` (kho hồ sơ nghỉ), `recovery.queued` và loại `checkpoint`. `savePlayer` lưu UUID người kết nối, tên, UUID hồ sơ nhân vật, vũ khí/băng đạn, perk/tag, level/xp, Máu Ảo và trạng thái gục. `baseSave` cũng chứa roster/kho hồ sơ. `restorePlayer` là hàm dùng chung khi tải tại máy, tải co-op hoặc reconnect.

Tên bắt buộc trước khi tạo/vào phòng, tối đa 24 ký tự; được làm sạch khi nhận và escape khi đưa vào HTML. UUID sinh ở trình duyệt và giữ trong `zs_player_uuid_v1`; tên giữ riêng ở `zs_player_name_v1`. PeerJS gửi định danh qua metadata, chủ phòng gắn quyền điều khiển vào entry kết nối, không lấy pid/hồ sơ do lệnh đầu vào tự khai.

Người cũ nối lại nhận nhân vật theo UUID dù đổi thứ tự P2/P3/P4. Đóng kết nối lưu hồ sơ **trước** khi đánh dấu placeholder `netLeft`; không ghi đè máu/trang bị bằng trạng thái placeholder chết. Kể cả mọi khách rời đi, host vẫn giữ phòng. Người cũ có thể về giữa màn; người mới vào tại trại. Tải checkpoint online mở sảnh mới, tạo mã mới; host có thể tiếp tục một mình với các hồ sơ còn lại đang nghỉ. Không tự chuyển host.

Host cho mượn hồ sơ ở sảnh/Xưởng Căn Cứ. UUID người kết nối khác UUID hồ sơ nên người mượn không chiếm quyền sở hữu; lưu tiến triển vào hồ sơ gốc, giữ hồ sơ riêng của người mượn. Hồ sơ đã được sử dụng không được gán cho hai người cùng lúc. `partyArchive` giữ người vắng mặt kể cả khi đội đã thay bằng 4 người khác; danh sách đang tham gia vẫn tối đa 4. Giữ nguyên dữ liệu trình duyệt để tự nhận đúng UUID.

## Rút lui và thất thủ

- Mọi người đang kết nối đều gục ở màn đi cảnh: cảnh trực thăng 4 giây, dừng giao tranh rồi về lửa trại. Thất bại Lab/tàu hoặc xe goòng cũng dùng cơ chế này.
- Thu nhập phế liệu được cộng qua `grantScrap`, tách khỏi tiền mang từ trại và tiền đã chi. Rút lui trừ `floor(thu nhập màn × 0,5)`, tối đa số đang có. Đạn/độ bền đang cầm còn `floor(hiện có × 0,75)`; băng không vượt tổng đạn còn lại. Người đang kết nối hồi 50% máu, xóa Máu Ảo/trạng thái/nạp đạn.
- `currentLevel` tăng ngay 1; `campaignQueued` chỉ ra số đó là màn sắp đi. `advanceCampaignLevel` tiêu thụ cờ thay vì tăng tiếp. Cờ lưu qua checkpoint. Nếu màn chờ chia hết cho 5, trận thủ nhà được ưu tiên cả khi tuyến truyện đang ép hướng đi.
- Thủ nhà tiếp diễn khi đội gục. Mỗi người gục chờ 12 giây rồi xuất hiện tại cửa nhà với 50% máu, 0 Máu Ảo và 3 giây bảo vệ. Hồi sinh không sửa lại cửa vỡ.
- Nhà hết máu: cảnh sụp đổ 2,5 giây, True Game Over, xóa checkpoint lượt chơi. Thoát menu chủ động không được tính là căn cứ thất thủ.

## Ụ súng A/B/C

Nguồn dữ liệu 60 bậc: `TURRET_PATHS` trong module 37. Mỗi ụ có `p:[A,B,C]`, mỗi giá trị 0–4. Tối đa hai nhánh khác 0 và tối đa một nhánh >2; cấp tối đa 4–2–0. Bộ nạp chuẩn hóa dữ liệu, bản cũ `l:1..5` sang A0..A4. Chi phí từng bậc 1/2/3/4 bằng giá mua loại ụ ×1/1,8/3,8/8,5; bậc 3 cần thêm 3 vật liệu, bậc 4 thêm 6. Bán hoàn 50% tiền đã đầu tư ở bản mới.

Ụ bậc 4 cần 2 cư dân, các ụ khác cần 1. Cấp cư dân cho ụ theo thứ tự ô và bỏ qua ụ không đủ đội vận hành; cư dân còn lại làm thợ. Flame C3 cần cờ đã hạ Kiến Chúa. Bậc 3–4 có thân/nòng/nguồn năng lượng và chuyển động Canvas theo nhánh; bậc 4 có nền lớn và hai vị trí vận hành.

| Loại | A3 → A4 | B3 → B4 | C3 → C4 |
|---|---|---|---|
| Súng Máy | Minigun sáu nòng → tia Plasma xuyên 24 mục tiêu | Đạn mảnh phá khiên → 30mm choáng/đẩy quái lớn | Hai mục tiêu độc lập → bắn vòng 360° |
| Bắn Tỉa | Giam boss 2s → Railgun +1,5% máu tối đa/vết rách DOT | Cửa mất máu tăng tốc 6s → liên thanh và nổ tại điểm nảy | Hạ bằng ụ thêm 2 phế liệu → thả đạn/máu mỗi 25s |
| Phun Lửa | Lửa xanh xuyên giáp → hào quang và cầu lửa | Nhựa đường chậm 60% → Napalm thiêu đạn cướp | Chuyển sang Acid → Sợ Hãi và xác nổ dây chuyền |
| Pháo Cối | Sóng chấn động → nhiệt áp lớn + bức xạ | Ba quả/loạt → 12 tên lửa bám mục tiêu | Phá tàng hình → EMP tước cuồng nộ, tê liệt xe/khóa kỹ năng boss 3s |
| Tesla | Cầu sét dọc cổng → sét trời/Quá Tải | Nối hàng rào điện → ụ khác +35% tốc bắn, người trong 600 cũng hưởng | Sửa/giáp năng lượng → hố đen gom quái, boss chịu 20% lực hút |

Hào quang, loạt pháo, bom con, bào tử và hiệu ứng được chủ phòng mô phỏng. `storyNetState` gửi paths, góc nòng, vùng và đạn đặc biệt cho khách vẽ. Nhà/cửa có giáp năng lượng tối đa 12% máu tối đa; sửa/regen giáp cần 5 giây không bị tấn công, kể cả đòn được giáp hấp thụ. Không hồi sinh cửa đã vỡ. Điều khiển mạnh không ép Kiến Chúa đáp bằng choáng khi nó đang bay ở pha 1; cơ chế phá giáp bay cũ vẫn quyết định.

## Kiểm tra

`node --test tests/coop-recovery.test.cjs tests/turret-paths.test.cjs` kiểm tra quyền lưu/UUID/loans, profile thiếu người, tải solo, quy tắc rút lui, 12s hồi sinh, game over, toàn bộ 30 tổ hợp nhánh bậc 3–4, crosspath, nhân lực, migration, sát thương và đồng bộ.

`tests/coop-browser.cjs` dùng ba browser context tách localStorage và một transport mô phỏng để chạy các hàm PeerJS thực tế: tên, tạo/vào phòng, rời hết/vào lại, host tải save và tạo mã mới, đổi slot vẫn đúng đồ, nút nâng 4–2–0, mobile và 15 thân ụ tối thượng. Không thay thế kiểm tra signaling/TURN/WebRTC qua Internet thật. `tests/recovery-browser.cjs` chạy vòng game thật qua cứu hộ, hình phạt, thủ nhà đúng map 5, 12s hồi sinh và Nhà Chính sụp đổ. Bộ cũ vẫn được chạy để kiểm tra hồi quy.
