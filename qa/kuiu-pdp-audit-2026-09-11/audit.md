# Đánh giá trang sản phẩm: Camo Signal và KUIU

Ngày: 11/09/2026. Bằng chứng: ảnh chụp mới và DOM giao diện trong lần đánh giá này.

## Phạm vi

- Camo Signal: [Let Us Thank Him For Our Food T-shirt](https://camosignal.com/collections/best-sellers/products/let-us-thank-him-for-our-food-t-shirt). Trình duyệt hiển thị theme **Development / Draft**; báo cáo đánh giá bản preview đó, không xác nhận theme đang publish. Thanh preview đã được ẩn bằng nút Hide bar.
- KUIU: [Proximity Hooded Insulated Jacket](https://www.kuiu.com/products/kuiu-proximity-hooded-insulated-jacket-veros-camouflage?variant=46720440369310). Có thông báo không giao đến quốc gia hiện tại; đã đóng modal chọn quốc gia, không đổi thị trường.
- Hai ảnh desktop tổng quan: viewport 1440 × 1000. Mobile: 390 × 844. Ảnh bổ sung khu vực upsell Camo chụp ở viewport 1280 × 720.
- Hai sản phẩm khác phân khúc; so sánh cách tổ chức giao diện, không suy ra chất lượng hàng hóa, doanh thu hoặc conversion.
- Không thực hiện thêm hàng vào giỏ hay checkout. Giỏ Camo có sẵn 4 sản phẩm trong phiên.

## Nhận định chính

KUIU nhìn clean hơn chủ yếu nhờ phân cấp thị giác và thứ tự thông tin. Camo có nền trắng, ảnh lớn, bộ chọn màu và size rõ, nhưng đang cộng nhiều điểm nhấn vào cùng trải nghiệm: chữ đậm lớn, giá đỏ, sao vàng, thanh vàng, mục Halloween riêng kiểu chữ, badge sale và nhiều khối bán thêm.

Giảm padding toàn trang sẽ không giải quyết gốc vấn đề. Cần giảm sự cạnh tranh giữa các khối, thống nhất kiểu chữ và đưa thông tin phục vụ quyết định mua lên trước bán thêm.

## Bước 1 — Xem sản phẩm trên desktop

Tình trạng: KUIU có phân cấp tốt; Camo có nền tảng tốt nhưng phần chữ nặng.

![Camo desktop](E:/PROJECTS/CAMOSINGAL-ver2/qa/kuiu-pdp-audit-2026-09-11/01-camo-desktop.png)

![KUIU desktop](E:/PROJECTS/CAMOSINGAL-ver2/qa/kuiu-pdp-audit-2026-09-11/02-kuiu-desktop.png)

### Typography

Trong DOM desktop được đo, tiêu đề sản phẩm Camo khoảng 38.06px, line-height 48.08px, font-weight 900, dùng poster-gothic-atf / Archivo Black và hiển thị chữ hoa. KUIU dùng RobotoCondensed-SemiBold, 28px/28px, tiêu đề viết hoa đầu từ. Không đối chiếu số weight máy móc vì KUIU dùng font semibold riêng với CSS weight 400.

KUIU vẫn có tiêu đề đậm, nhưng diện tích nét chữ và chiều cao dòng tiết chế hơn. Camo dùng chữ có cá tính mạnh cả ở navigation và tiêu đề, trong khi hình in trên áo vốn đã nhiều nét và chữ. Tổng thể vì thế nặng hơn.

Đề xuất: thử tiêu đề desktop 28–32px, line-height 1.15–1.25; mobile 22–24px. Dùng font giao diện dễ đọc cho tên sản phẩm, nhãn, giá và mô tả; giữ font thương hiệu cho những điểm nhấn thật sự cần thiết. Đây là kích thước thử nghiệm, không phải tiêu chuẩn bắt buộc.

### Bố cục và khoảng trắng

KUIU dành gần hai phần ba vùng chính cho lưới ảnh, cột mua hàng hẹp và có trục trái rõ. Camo chia gần một nửa cho gallery và một nửa cho form; form rộng khiến tiêu đề và các khoảng trống trải ngang, nhãn Size guide nằm xa nhãn Size.

KUIU có nhiều ảnh và nhiều khoảng trắng, thậm chí khoảng trống trước CTA khá lớn. Điểm hay nằm ở sự gom nhóm nhất quán, không phải cứ ít khoảng trắng là gọn.

Đề xuất cho Camo: thử tỷ lệ gallery/form khoảng 58–62% / phần còn lại; giới hạn chiều rộng form khoảng 420–480px khi màn hình cho phép. Gom title/review/price thành một nhóm, màu/size thành nhóm thứ hai, CTA và thông tin giao hàng thành nhóm thứ ba. Dùng khoảng cách nhỏ trong nhóm và lớn hơn giữa nhóm.

### Màu sắc và header

Camo đồng thời có thanh vàng, sao vàng, giá đỏ, badge đỏ, chữ và CTA xanh đậm, mục Halloween màu cam. KUIU chủ yếu dùng đen, xám và olive; badge và rating hòa vào bảng màu hơn.

KUIU còn có nhiều mục navigation hơn Camo, nhưng kiểu chữ nhẹ và đồng nhất nên ít ồn hơn. Như vậy số lượng menu không phải nguyên nhân duy nhất. Mục Halloween của Camo tạo một điểm hút mắt không trực tiếp phục vụ việc mua sản phẩm đang xem.

Đề xuất: giữ xanh rừng làm màu thương hiệu; giảm diện tích màu promotion; giá có thể dùng màu chữ chính và chỉ dùng một tín hiệu sale nổi bật. Không cần loại bỏ thông tin ưu đãi hoặc màu sắc thật của swatch.

### Nội dung và hình ảnh

KUIU có câu ngắn ngay dưới tên giải thích sản phẩm phù hợp với ai và điều kiện nào. Camo chuyển từ tên/review/giá sang lựa chọn màu mà chưa có câu tóm tắt chất liệu, fit hoặc vị trí in ở khu vực này.

Gallery Camo đã có ảnh sản phẩm, chi tiết và người mặc — đây là điểm nên giữ. Tuy nhiên ảnh đầu là mặt lưng, chưa được ghi rõ là Back print trong vùng thông tin chính. KUIU đặt ảnh toàn sản phẩm cạnh ảnh chú thích chức năng, giúp ảnh làm nhiệm vụ giải thích.

Đề xuất: thêm một dòng thông tin đã được xác minh về fit/chất liệu/vị trí in; ưu tiên chuỗi ảnh mặt trước, mặt sau, cận hình in và người mặc. Không cần sao chép lưới ảnh kỹ thuật của KUIU cho mọi áo graphic tee.

## Bước 2 — Chọn size và chuẩn bị mua trên mobile

Tình trạng: thao tác chính rõ ở cả hai; Camo có rủi ro chọn mặc định và nhiều lớp giao diện nổi.

![Camo mobile đầu trang](E:/PROJECTS/CAMOSINGAL-ver2/qa/kuiu-pdp-audit-2026-09-11/04-camo-mobile-top.png)

![KUIU mobile đầu trang](E:/PROJECTS/CAMOSINGAL-ver2/qa/kuiu-pdp-audit-2026-09-11/08-kuiu-mobile-top.png)

![Camo mobile mua hàng](E:/PROJECTS/CAMOSINGAL-ver2/qa/kuiu-pdp-audit-2026-09-11/05-camo-mobile-purchase.png)

![KUIU mobile sau khi chọn M](E:/PROJECTS/CAMOSINGAL-ver2/qa/kuiu-pdp-audit-2026-09-11/09-kuiu-mobile-purchase.png)

Camo hiển thị sẵn size S và shipping protection $1.99 được chọn trong phiên quan sát. Đây là rủi ro: người mua có thể thêm hàng với size chưa cân nhắc hoặc không nhận ra khoản phụ thu. Cần kiểm tra thêm ở phiên mới trước khi kết luận mọi khách hàng đều thấy mặc định này.

KUIU ban đầu yêu cầu Select Options. Khi chọn M, nhãn Size cập nhật và nút mua hiển thị Add to Cart – $299. Thanh mua cố định còn giữ tên sản phẩm và giá khi cuộn. Đây là thông tin trực tiếp hỗ trợ hành động đang làm.

Camo có biểu tượng giỏ nổi với số 4 và nút Chat, ngoài giỏ trong header. Trong ảnh mobile, các nút nổi che một phần thumbnails và thẻ sản phẩm. Nút giỏ chung cũng không diễn đạt rõ thao tác mua biến thể đang xem như thanh mua của KUIU.

Đề xuất: yêu cầu lựa chọn size có chủ đích; làm rõ tính tùy chọn của protection; cân nhắc để khoản này ở giỏ hàng. Chỉ giữ một lớp hành động nổi chính trên PDP, thu gọn chat và tránh che nội dung. Nếu dùng sticky CTA, cần giữ trạng thái màu/size và yêu cầu chọn size trước khi thêm hàng.

Công bằng với KUIU: trên mobile, người dùng cũng phải cuộn qua ảnh để đến giá và lựa chọn; khoảng trống trước CTA vẫn lớn. Không nên lấy việc đưa tất cả lên màn hình đầu làm thước đo duy nhất của giao diện clean.

## Bước 3 — Tìm thông tin trước khi quyết định mua

Tình trạng: đây là điểm cần ưu tiên sửa nhất ở Camo.

![Hai khối bán thêm Camo trước Product details](E:/PROJECTS/CAMOSINGAL-ver2/qa/kuiu-pdp-audit-2026-09-11/07-camo-recommendations.png)

Camo đặt Also available as, rồi People also bought, rồi mới đến Product details / Shipping & delivery / Care instructions / Reviews. Hoodie và pocket tee xuất hiện ở cả hai khối đầu. Cùng một hoodie còn hiện From $46.95 ở khối trên và $42.26 ở khối dưới; có thể là ưu đãi hợp lệ nhưng quan hệ giữa hai giá chưa được giải thích ngay cạnh hai cách trình bày.

Khối trên dùng thẻ ảnh lớn, khối dưới dùng hàng bo góc, dropdown biến thể và nút Add nhỏ. Tên sản phẩm lặp dài và kiểu chữ khác nhau tạo cảm giác nhiều module được ghép lại.

KUIU đặt delivery, warranty, size exchanges và mô tả/chi tiết trước các khu vực Customers Also Bought / Customers Also Viewed phía dưới. Họ vẫn bán thêm, nhưng không chen hai danh sách vào giữa quyết định mua và thông tin về món đang xem.

Đề xuất: đưa Product details, Shipping & returns và Reviews lên ngay sau CTA cùng các thông tin cam kết ngắn. Chỉ giữ một cơ chế bán thêm tại vùng này. Nếu Also available as là đổi kiểu áo cùng artwork, dùng nhãn ngắn như Hoodie / Pocket tee / Long sleeve và bộ chọn gọn. Chuyển danh sách khuyến nghị dài xuống sau thông tin hoặc sang giỏ hàng. Tránh lặp lại cùng sản phẩm ở hai module liền nhau.

## Bước 4 — Mở bảng size trên mobile

Tình trạng: mở được, bảng đọc được; nội dung dài và có che phủ.

![Camo size guide](E:/PROJECTS/CAMOSINGAL-ver2/qa/kuiu-pdp-audit-2026-09-11/06-camo-size-guide.png)

Điểm tốt: có nút đóng rõ, đơn vị In/Cm, đường phân hàng và các cột số đo.

Điểm cần sửa: trang sản phẩm áo người lớn vẫn hiển thị cả bảng trẻ em; phần giải thích đơn vị lặp lại; header bảng dùng chữ display nhỏ, hẹp; Chat vẫn nổi trên modal và che một phần bảng trẻ em.

Đề xuất: hiển thị bảng đúng loại sản phẩm, rút gọn phần giới thiệu, dùng font giao diện cho tiêu đề cột và ẩn/đặt lớp chat dưới modal. Có nút In/Cm nhưng lần này chưa kiểm tra chuyển đổi số liệu.

## Mức ưu tiên

| Ưu tiên | Thay đổi | Lý do |
|---|---|---|
| 1 | Gom/di chuyển các khối bán thêm, đưa thông tin sản phẩm lên trước | Giảm độ dài và số lựa chọn không cần thiết tại điểm quyết định |
| 1 | Giảm độ nặng title, thống nhất typography | Tác động trực tiếp tới cảm giác gọn trên toàn PDP |
| 1 | Xem lại size mặc định, protection được chọn sẵn | Giúp người mua nhận thức rõ sản phẩm và tổng chi phí |
| 2 | Giảm điểm nhấn promotion, chuẩn hóa header | Hình sản phẩm và CTA được ưu tiên hơn |
| 2 | Điều chỉnh tỷ lệ cột và spacing theo nhóm | Giúp mắt đọc theo một trật tự rõ |
| 2 | Dọn giỏ/chat nổi trên mobile và modal | Tránh che nội dung và thêm thao tác thừa |
| 2 | Một câu thông tin cốt lõi, ảnh trước/sau/chi tiết | Tăng hiểu sản phẩm trước khi mở accordion |
| 3 | Bảng size đúng loại, nhãn và kiểu thẻ nhất quán | Hoàn thiện độ chỉn chu |

## Giới hạn và accessibility

Đây là đánh giá UX/UI của hai trang mẫu, không phải kết luận toàn bộ hai website. Không có dữ liệu conversion, heatmap hoặc kiểm thử người dùng; tác động doanh thu cần A/B test.

Quan sát được rủi ro chữ phụ nhỏ, chữ giá gạch ngang nhạt, chat che nội dung, lựa chọn size cần nhận biết rõ. Chưa đo đầy đủ contrast, kích thước vùng bấm, focus trap, điều hướng bàn phím, screen reader hoặc zoom 200%; không tuyên bố đạt/không đạt WCAG từ ảnh.

Tại viewport 1280 × 720, Camo có scrollWidth 1355px và thanh cuộn ngang; ở 1440 và 390 không thấy tràn tương tự. Cần tái hiện và xác định phần tử gây tràn, chưa kết luận là lỗi trên mọi thiết bị.

Trong lần audit có nội dung tải muộn và ảnh chụp chuyển trạng thái chưa ổn định; các ảnh đó đã được chụp lại trước khi đưa vào báo cáo. Không dùng những trạng thái chuyển tiếp làm bằng chứng lỗi hiệu năng.

Chỉ tạo báo cáo và ảnh audit; không chỉnh sửa theme.
