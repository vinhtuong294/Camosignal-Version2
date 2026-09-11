# Camo Signal – Listing Rules

Đây là tài liệu quy tắc nghiệp vụ bắt buộc. Codex phải đọc file này trước khi thực hiện bất kỳ thao tác listing nào.

## 1. Nguồn dữ liệu

- Đọc sản phẩm từ Lark Base `CAMO SIGNAL`, view/tab `TƯỜNG - UPLOAD`.
- Chỉ xử lý những record người dùng chỉ định hoặc những record được người dùng yêu cầu xử lý.
- Không tự lấy sản phẩm từ các tab khác nếu người dùng chưa yêu cầu.
- Dùng `Design ID`, `Product name`, `Product type`, `Main Color`, `Colors`, `Weekly Design Plan` và `Assets` trong Lark.
- Sau khi tạo Shopify Draft thành công, ghi Shopify Admin URL và trạng thái listing về đúng record Lark.

## 2. An toàn thao tác

- Mặc định chỉ tạo sản phẩm ở trạng thái Shopify Draft; không publish nếu người dùng chưa yêu cầu rõ ràng.
- Không xóa hoặc sửa sản phẩm cũ ngoài phạm vi người dùng chỉ định.
- Không thay đổi sản phẩm cũ chỉ vì đang cùng design. Chỉ bổ sung design tag còn thiếu khi được yêu cầu và khi sản phẩm thực sự thuộc cùng design.
- Trước khi tạo, kiểm tra Shopify URL/trạng thái Lark để tránh tạo trùng.
- Nếu thiếu ảnh, thiếu màu, không xác định được collection, hoặc không xác định được template thì dừng và báo lỗi; không tự đoán dữ liệu quan trọng.
- Không in hoặc ghi App Secret, Client Secret, token hay nội dung `.env` vào tài liệu, log hoặc câu trả lời.

## 3. Tên sản phẩm và template

- Dùng tên sản phẩm trong Lark; không tự viết mô tả sản phẩm.
- Duplicate từ sản phẩm Shopify cũ gần nhất, ưu tiên đúng product type và cấu trúc variant.
- Các product type có thể gồm `T-shirt`, `Hoodie`, `Long-sleeve`, `Sweatshirt` và các dòng áo tương tự.
- Với UPF hoodie hoặc sản phẩm không có màu: giữ tên theo sản phẩm cũ, không tạo option màu; thay ảnh theo bộ ảnh mới.
- Nếu cùng design có nhiều dòng áo, tên chỉ khác phần product type ở cuối tên.

## 4. ZIP, ảnh và màu

- Giải nén ZIP từ attachment Lark trước khi listing.
- Đọc tên file ảnh để nhận diện màu theo danh sách màu Shopify/Lark.
- Dùng đúng tên màu đã tồn tại trong Shopify; không tự tạo tên màu gần giống.
- Nếu một màu có nhiều ảnh, ảnh đầu tiên của nhóm màu là ảnh chính của màu đó; các ảnh còn lại là ảnh bổ sung.
- Đưa `Main Color` lên đầu danh sách màu/variant và đặt toàn bộ nhóm ảnh của màu đó lên đầu media.
- Gắn ảnh đúng vào từng variant màu tương ứng.
- Nếu có hai mã/ảnh có thể là cùng màu, dùng màu đã có trong Shopify và báo lại nếu còn mơ hồ.
- Màu `Forest Green` có thể chọn một trong các entry Forest Green hợp lệ đã được người dùng thêm vào bộ lọc.
- Màu `Gold` phải dùng entry `GOLD` đã có trong Shopify.

## 5. Variant và tồn kho

- Tạo đầy đủ các màu trong cột `Colors`; `Main Color` là màu chính/fallback.
- Giữ các size theo template phù hợp với dòng áo.
- Với mọi sản phẩm có màu `Brown Savana`, chỉ tạo variant màu `Brown Savana` đến size `3XL` (S, M, L, XL, 2XL, 3XL). Các màu khác vẫn dùng dải size đầy đủ theo template.
- Mỗi variant phải được gán ảnh đúng màu.
- Tồn kho mặc định là **100 cho từng variant** đối với sản phẩm mới.
- Nếu Lark nhập một giá trị Inventory cụ thể, dùng giá trị đó; nếu để trống, dùng 100.
- Không tự động đổi tồn kho của sản phẩm cũ khi áp dụng quy tắc mới này.
- Luôn kiểm tra lại số variant và tồn kho sau khi tạo.

## 6. Giá, metafield và tag thường

- Nếu Lark có `Price`, áp dụng giá đó cho mọi variant; nếu trống, giữ giá template.
- Nếu checkbox `PRINT 2-SIDES` trong Lark được tick, sản phẩm là áo in hai mặt. Duplicate từ template một mặt cùng product type và cộng **$3 cho từng size ở cả giá bán (`price`) lẫn giá so sánh (`compare-at price`)**. Nếu không tick thì giữ bảng giá template như bình thường.
- Với áo hai mặt, phải tải đủ ảnh mặt trước và mặt sau từ ZIP; vẫn sắp xếp media và gắn ảnh variant theo màu như quy tắc ảnh/màu hiện hành.
- Không thêm mô tả sản phẩm.
- Ở metafield chỉ điền `Sold Count Base`, random số nguyên từ 50 đến 70.
- Không tự thêm các metafield khác nếu Lark không yêu cầu.
- Các tag thường lấy từ Lark nếu có; không tự xóa tag template ngoài phạm vi đã thống nhất.

## 7. Design tag

- Bỏ product type khỏi tên trước khi xác định design:
  `T-shirt`, `T-Shirt`, `hoodie`, `Hoodie`, `sweatshirt`, `long-sleeve`, `Long-sleeve`.
- Chuẩn hóa phần tên design: bỏ khoảng trắng thừa, thay mỗi khoảng trắng bằng dấu `-`, giữ một tag duy nhất dạng:
  `design:Trout-Trifecta`
- Ví dụ `Trout Trifecta Long-sleeve` và `Trout Trifecta T-Shirt` dùng tag `design:Trout-Trifecta`.
- Một sản phẩm chỉ có tối đa một design tag.
- Nếu design mới chỉ có một dòng áo duy nhất thì chưa thêm design tag.
- Chỉ thêm design tag khi design đó có ít nhất hai dòng áo khác nhau, hoặc khi sản phẩm cũ cùng design đã có biến thể dòng áo tương ứng.
- Không sửa design tag của sản phẩm cũ đúng tag.
- Nếu sản phẩm cũ cùng bộ design chưa có tag và đủ điều kiện, bổ sung đúng một design tag cho sản phẩm đó.
- Mỗi design tag mới phải được kiểm tra trùng trước khi thêm vào bảng `TAG DESIGN` trong Lark.
- Nếu đã có tag trùng hoặc tên design xung đột, dùng tag canonical phù hợp với bộ áo hiện có.

## 8. Collection

- Cập nhật collection cho sản phẩm mới dựa trên `Weekly Design Plan` và tên sản phẩm.
- Nếu Weekly Design Plan không đủ thông tin, dùng product name và product type để suy luận.
- Không để sản phẩm mới thiếu collection nếu có thể xác định chắc chắn.
- Nếu có nhiều collection phù hợp, ưu tiên collection đang được dùng bởi sản phẩm template cùng dòng áo/design.

## 9. Quy trình listing bắt buộc

1. Xác nhận đúng record trong view `TƯỜNG - UPLOAD`.
2. Đọc tên, product type, màu, weekly plan và attachment.
3. Kiểm tra sản phẩm cùng design/dòng áo trên Shopify để tránh duplicate.
4. Chọn template gần nhất.
5. Giải nén và kiểm tra toàn bộ ảnh; đối chiếu ảnh với màu.
6. Xác định collection và design tag theo các quy tắc trên.
7. Tạo hoặc duplicate Shopify Draft.
8. Cập nhật title, giá, variant, màu, media, collection, tag và metafield.
9. Gán stock 100 cho từng variant nếu Lark không nhập Inventory.
10. Kiểm tra lại media theo màu, số variant, stock, collection và tag.
11. Ghi Shopify URL/trạng thái về đúng record Lark.
12. Báo cáo kết quả, các cảnh báo và các mục chưa chắc chắn.

## 10. Sản phẩm Combo (Vest + Long-Sleeve)

- Mỗi listing combo chỉ đại diện cho **một mẫu/một màu**. Không thêm `Color` làm option thứ ba.
- Bắt buộc đặt Product Type là `Combo`, thêm tag `combo-builder`, để description trống và dùng template sản phẩm mặc định.
- Ưu tiên duplicate từ sản phẩm combo đã được duyệt để giữ category, collection và bảng giá theo size.
- Thứ tự option bắt buộc:
  1. `Your choice`
  2. `Size`
- `Your choice` có đúng ba giá trị theo thứ tự:
  1. `Combo (Vest + Long-Sleeve)`
  2. `Quarter-Zipper Fleece Vest`
  3. `Full-Zipper Long-Sleeve`
- `Size` có đúng chín giá trị theo thứ tự:
  `S`, `M`, `L`, `XL`, `2XL`, `3XL`, `4XL`, `5XL`, `6XL`.
- Tổng cộng phải có đúng **27 variants**. Trường Shopify **Available tại location bán hàng phải bằng 100 cho từng variant** (không phải chỉ đặt tổng inventory của sản phẩm) nếu Lark không nhập tồn kho khác; sau khi lưu phải đọc lại location inventory và xác minh đủ 27/27 variants đều bằng 100.
- Với lựa chọn Combo, variant Shopify dùng size Vest; size Long-Sleeve được storefront lưu vào line item property `Long-Sleeve Size`. Size Vest được lưu ở `Vest Size`.
- Ảnh phải chia thành ba nhóm:
  - Combo: ảnh có cả Vest và Long-Sleeve.
  - Vest: ảnh chỉ Vest.
  - Long-Sleeve: ảnh chỉ Long-Sleeve.
- Đưa ảnh chính Combo lên đầu media, sau đó ảnh Combo bổ sung, nhóm Vest và cuối cùng nhóm Long-Sleeve.
- Gắn ảnh chính đúng nhóm cho **tất cả chín variants** của mỗi lựa chọn; alt ảnh Vest phải chứa `Vest`, alt ảnh Long-Sleeve phải chứa `Long-Sleeve` để gallery storefront lọc đúng.
- Giá của ba nhóm và các bậc tăng giá theo size phải giữ theo sản phẩm combo template được duyệt, trừ khi Lark cung cấp bảng giá mới rõ ràng.
- Chỉ điền metafield `Sold Count Base`, random số nguyên 50–70.
- Order note là tùy chọn. Hai bảng size Vest và Long-Sleeve dùng cấu hình cố định của `combo-builder`; chỉ áp dụng quy tắc này cho sản phẩm dùng đúng hai bảng thông số đó.
- Shopify luôn giữ Draft nếu người dùng không yêu cầu publish. Lark `Current stage` vẫn giữ `Upload`; chỉ ghi Shopify URL về đúng record.

## 11. Mẫu lệnh từ người dùng

Khi người dùng yêu cầu listing, hãy đọc file này trước rồi xác nhận ngắn gọn record/design sẽ xử lý. Chỉ hỏi lại khi có dữ liệu thiếu hoặc mâu thuẫn; không hỏi lại những quy tắc đã có trong tài liệu.

## 12. UPF Hoodie kèm Face Mask/Gaiter

- Nếu `Product type` có cả `UPF Hoodie` và `Face Mask`, duplicate từ template UPF Hoodie có option `CHOOSE YOUR SET` và `Size`.
- Giữ đúng hai lựa chọn `Hoodie Only` và `Hoodie + Gaiter` trong option `CHOOSE YOUR SET`, cùng dải size của template (hiện tại S–5XL).
- Không tạo option màu cho UPF Hoodie; ảnh mask/gaiter và hoodie đưa vào gallery theo bộ ZIP, nhưng không gán ảnh theo màu/variant như áo có màu.
- Tồn kho mặc định là 100 cho mọi variant; giữ Draft, không publish và ghi URL về Lark.
- Nếu chỉ có `UPF Hoodie` không kèm `Face Mask`, tiếp tục dùng cấu trúc UPF size-only theo mục 3/5.
