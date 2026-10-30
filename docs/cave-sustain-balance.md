# Hang Z, Hầm Mỏ và cân bằng hồi phục — 31/10/2026

## Hang và luồng nhiệm vụ

`09-cave.js` dùng `navigationWalkClear()` từ module 38 để kiểm tra cả bán kính nhân vật khi đi qua vách. Phép slab xử lý cả đoạn thẳng đứng/ngang, tránh chia cho 0 trong kiểm tra đường thẳng cũ. Khi đổi hướng trên lưới, nhân vật đi tới tâm ô an toàn trước khi rẽ. `NAV.epoch` đổi mỗi lần dựng lại lưới, làm mới trường đường đi riêng của NPC.

Tiến Sĩ đi 145 đơn vị/s khi hộ tống và 200 khi thoát. Gài mỗi C4 vẫn mất 10s nhưng dừng nếu không có người còn sống trong 460 đơn vị. Sau C4 thứ ba, thời gian thoát bằng độ dài tuyến lưới ×80×1,15 /200 +10s, tối thiểu 30s. Cache mũi tên được xóa khi sinh lại hang; chỉ dẫn thường hiện sau 12s, chỉ dẫn nhiệm vụ mỏ/chạy thoát hiện ngay.

Hầm Mỏ hiện dùng tuyến **xe bom → chuẩn bị/phá mạch phụ → đấu trường → nhặt lõi → chạy bộ → xe goòng**. Không còn dùng số tổ kiến làm mục tiêu bắt buộc trong tuyến xe bom. Đường dài xe bom tăng từ 96 lên 132 đơn vị/s; người đẩy thêm tối đa +40%. Các mạch phụ vẫn cần cưa/rìu/búa/vũ khí nổ, hiện lời nhắc khi dùng sai công cụ.

Kiến Chúa pha 2 tiếp tục thả Acid khi máy phát tắt. Xe TNT có thể đánh rơi boss đang bay; kiểm tra HP ngăn xác xe kích choáng vô hạn. Khi bắt đầu chạy thoát, xóa bảng giới thiệu/chiến thắng boss cũ. Không sinh Kiến Chúa giả ở xe goòng: tuyến mới đã hạ boss, tuyến cũ chỉ giữ lại chính boss còn sống nếu có.

## Rượt đuổi

Hành lang có năm vách đổ xen kẽ, mỗi vách chừa ít nhất 500 đơn vị ngang để đi. Mép sập đuổi với tốc độ 165 lên 185 đơn vị/s; người chạm vùng sập chịu DOT. Ba cột chống có 60 HP, phá bằng bất kỳ vũ khí nào để lùi mép sập 150 đơn vị. Đá rơi báo trước 1,4s và không tạo vách mới chặn đường. Tối đa 24 kiến đuổi; cả đội còn sống phải tới điểm lên xe.

Xe goòng bắt đầu cách nguy hiểm 55m, khoảng cách luôn giảm và giảm nhanh khi bị chậm/choáng. Bẫy xuất hiện theo hàng, 1–2 làn bị chặn và luôn còn làn an toàn. Báo trước 2,8/2,6/2,4s tùy độ khó; người lái cùng radar thấy toàn bộ cảnh báo, người lái có đồng đội radar vẫn nhìn trực tiếp bẫy trong 1,25s cuối. Hàng bẫy chỉ gây một lần thiệt hại.

- A/D hoặc mũi tên: đổi làn, hồi 0,2s. Radar dùng Q/W/E chỉ làn, Space bắn kiến bám.
- Shift/C (hoặc nút tăng tốc): tốn 45 nhiên liệu, tăng tốc 1,8s, hồi 7s. Có 60 nhiên liệu đầu màn; né đúng +8, mỗi trạm tiếp tế +15.
- B: dùng một TNT, hồi 12s; đẩy xa nguy hiểm 10m, diệt kiến bám và dọn bẫy sắp va trên làn hiện tại. Có một quả đầu màn và thêm một ở mốc 18/36, giữ tối đa hai.
- Va bẫy mất máu xe, khoảng cách và khả năng di chuyển. Bị đuổi kịp mất 35% máu xe, không thể bù bằng hút máu của nhân vật.
- Người dẫn đường ngắt kết nối/gục: người lái nhận radar. Người lái mất kết nối: người còn sống nhận tay lái. Người dẫn đường trở lại nhận đúng vai.

## Hồi máu, giáp và boss

Các nguồn lặp lại (đòn đánh, hạ địch, Tế Phẩm, cứu thương, chia hồi máu, hồi tự động, Máu Ảo) dùng ngân sách trên từng nhân vật: **tổng 6% máu tối đa/s**, mỗi nhóm hút máu/hồi máu/Máu Ảo tối đa 4%. Ngân sách tích tối đa một giây, dùng thời gian mô phỏng chủ phòng. Trúng đòn hoặc DOT tạo suy giảm hồi phục 4s: cả tốc độ nạp và sức chứa ngân sách giảm 75%. HUD hiển thị trạng thái này. Vật phẩm FOOD/MEDKIT không chịu ngân sách nhưng vẫn dùng hệ số hồi phục; HEALTHBOX giữ hồi tức thì 50% như trước. Nguồn hữu hạn mua nâng máu hoặc hồi ở trại giữ luật riêng.

Hút máu giờ chịu hệ số `HEALING_MULT=0.55`. Liềm hút 2,5% sát thương thực nhận, tối đa 6 thô/mục tiêu; các mục tiêu tiếp theo cùng nhát chỉ nhận 25%. Nanh Huyết và Tag thêm hút có hồi nội bộ 0,15s cận chiến /0,18s tầm xa. Hút dư chuyển 35% với Huyết Giáp, 25% ở Tag 4. Hạ quái/Tế Phẩm giảm lượng hồi và chịu cùng ngân sách, không thể nhân số mục tiêu để vượt trần.

Máu Ảo nền 25% máu tối đa; Huyết Giáp +15%, Hút Máu 5 +15%, Phòng Thủ 4 +10%, Huyết Nang +15%: tối đa 80%. Bản lưu cũ bị hạ về trần mới khi khôi phục. Sau 6s không bị đánh, chỉ lấy nguồn tái tạo mạnh nhất: Lá Chắn 1,5%/s tới 20%, Màng Máu 1%/s tới 15%, Tag 4 0,6%/s tới 10%. Hồi Máu 4 chỉ tự hồi sau 6s an toàn.

Tổng giảm sát thương có sàn nhận 40% với quái thường, 55% với boss, 70% với chiêu nặng có báo trước. Chiêu nặng gây tối thiểu 28% máu tối đa thô trước hệ số độ khó; 40% sát thương sau giảm xuyên Máu Ảo. Khiên điện tối đa hai lớp, chặn đòn thường nhưng chỉ giảm 40% một chiêu nặng. Phản đòn/né ngẫu nhiên không chặn chiêu nặng; phản đòn boss thường tối đa 15%, né boss thường 8%. Pháo Đài Bất Khuất chỉ giới hạn đòn ngoài boss ở 45% máu tối đa. Kỹ năng bất tử chủ động vẫn hoạt động.

Sát thương boss được giữ qua AI → đạn/vùng nguy hiểm/trạng thái → các hàm bọc admin/cánh bay/hack Lab → Player. Acid boss có thể kết liễu; Acid môi trường/quái thường vẫn giữ sàn 50% như trước. Mô tả thẻ/wiki được đồng bộ trong module 39. Trạng thái suy giảm hồi được thêm vào slot 33 snapshot; không lưu ngân sách tạm vào checkpoint.

## Kiểm chứng

`node --test tests/cave-balance.test.cjs tests/resilience.test.cjs tests/expeditions.test.cjs tests/boss-progression.test.cjs` kiểm tra điều kiện và mô phỏng đường đi, ngân sách hồi, phối hợp nhiều nguồn, sát thương xuyên qua các hàm bọc, bản lưu/đồng bộ, xe và vai co-op. Có 8 seed mê cung để NPC đi qua đủ C4/cửa; 20 lượt lái có phản ứng trên bốn độ khó và đội 1–4 người, cùng lượt bỏ lái phải thất bại.

`node tests/cave-browser.cjs` cần Playwright và Edge. Kiểm tra ba tầng Hang Z, gài C4/thoát, xe bom/cổng/pha tối Kiến Chúa/nhặt lõi, hành lang và xe. Bấm bàn phím/nút cảm ứng thật ở 1280×800, 844×390, 390×844 và render khách P3. Ảnh lưu vào thư mục tạm `zombie-cave-*.png`. Kiểm tra này và transport mô phỏng trong `coop-browser.cjs` chưa thay thế thử WebRTC qua Internet trên nhiều máy thật.
