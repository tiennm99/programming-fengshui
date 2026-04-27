# programming-fengshui

Trang phân loại ngôn ngữ lập trình theo Ngũ Hành (Kim, Mộc, Thuỷ, Hoả, Thổ) dựa trên màu sắc của GitHub Linguist / GitLab Linguist, tập trung TIOBE Top 20.

## Chạy thử

Chạy qua HTTP server (cần thiết để `fetch` dữ liệu JSON):

```bash
python3 -m http.server 8080
```

rồi truy cập http://localhost:8080.

## Cấu trúc

```
.
├── index.html
├── style.css
├── js/
│   ├── main.js
│   ├── classify-element.js
│   ├── render-elements.js
│   └── tiobe-top.js
├── data/
│   ├── github-colors.json
│   └── gitlab-colors.json
└── assets/
    └── ngon-ngu-lap-trinh-phong-thuy.png
```

## Credit

- Bài viết gốc: [Top 5 ngôn ngữ lập trình đáng học cho năm 2018](https://toidicodedao.com/2018/01/02/top-5-ngon-ngu-lap-trinh-dang-hoc-cho-nam-2018/) — Phạm Huy Hoàng (Tôi đi code dạo).
- Ảnh: [ngon-ngu-lap-trinh-phong-thuy.png](https://toidicodedao.com/wp-content/uploads/2017/12/ngon-ngu-lap-trinh-phong-thuy.png).

Trang chỉ dùng để trình bày lại nội dung, mọi quyền thuộc tác giả gốc.
