# Flex Cart Upsell — MVP

## Phạm vi

App có đúng hai campaign độc lập cho mỗi shop:

1. `CART_DRAWER` — upsell trong cart drawer.
2. `CART_PAGE` — upsell trên trang cart.

Dữ liệu được tách bằng `shop` trong mọi bảng, nên một app có thể cài cho Camo
Signal và Tee Blessed mà không dùng chung campaign, catalogue hay analytics.

## Logic đề xuất

- Smart weighted mix (mặc định)
- Chọn sản phẩm thủ công
- Sản phẩm bổ trợ theo cặp trigger → offer
- Cùng collection
- Cùng tag
- Cùng product type
- Cùng vendor
- Bán chạy theo tín hiệu add-to-cart do app thu thập
- Sản phẩm mới
- Khoảng giá gần với giá trung bình trong giỏ
- Tự phối trọng số

Pipeline chạy theo thứ tự:

`cart context → điều kiện campaign → tạo candidates → hard filters → chấm điểm → giới hạn lặp vendor → top N → fallback`

## Điều kiện và bộ lọc

Điều kiện campaign hỗ trợ `ALL` hoặc `ANY`:

- Tổng tiền giỏ
- Số lượng item
- Sản phẩm
- Collection
- Tag
- Vendor
- Product type

Hard filters:

- Chỉ sản phẩm còn hàng
- Loại sản phẩm đã trong giỏ / sản phẩm trigger / gift card
- Include/exclude product, collection, tag, vendor, product type
- Giá tối thiểu/tối đa
- Số sản phẩm hiển thị
- Số sản phẩm tối đa trên mỗi vendor

## Tùy biến giao diện

- Heading, subheading và nhãn nút
- Stacked, grid hoặc carousel
- Ảnh vuông, dọc hoặc ngang
- Bật/tắt vendor, compare price, variant picker và quick add
- Màu nền, viền, chữ, nút và accent
- Border radius, image radius và spacing
- Custom CSS được scope vào đúng instance; `@import` và `url()` bị chặn
- Live preview cập nhật ngay trong editor

## Chạy local

```powershell
npm run setup
npm test
npm run typecheck
npm run build
```

Route `/preview` dùng để QA giao diện mà không cần Shopify session.

## Liên kết Shopify

Source đã được liên kết với app `Selleasy version 2` trên Shopify Dev Dashboard.
Backend production chạy tại `https://flex-cart-upsell.vercel.app` với PostgreSQL
Neon tại Singapore. `shopify app dev` vẫn có thể tự cập nhật URL tunnel và callback
khi làm việc với development store.

1. Chạy `shopify app dev --store <development-store.myshopify.com>`.
2. Cài app từ URL mà Shopify CLI cung cấp.
3. Đồng bộ catalogue trong app.
4. Thêm block `Cart drawer upsell` vào header/cart drawer và block
   `Cart page upsell` vào cart template trong Theme Editor.

App yêu cầu hai scope tối thiểu: `read_products` để đồng bộ catalogue và
`write_app_proxy` để cấu hình proxy `/apps/flex-cart-upsell`.

Prisma dùng PostgreSQL cho mọi môi trường. Không lưu database SQLite trong source
hoặc filesystem tạm của hosting.
