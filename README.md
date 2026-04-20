# fb-skills

Bộ **Claude Code Skills** tái sử dụng cho mọi công cụ Facebook — từ extension MV3
đến Puppeteer/Playwright script. Skill dạy Claude pattern chuẩn (extract
credentials, gọi Graph API, xử lý throttle) để mỗi lần làm tool FB mới, không
phải giải thích lại từ đầu.

## Skills có sẵn

| Skill | Trạng thái | Mô tả |
|---|---|---|
| [`get-via-access`](skills/get-via-access/) | ✅ v0.2.0 | Lấy full bundle credentials qua **background-fetch** (user không cần mở tab FB) |
| `fb-get-ads-data` | 🚧 Đang thiết kế | Fetch TKQC, billing, insights, BM qua Graph API + internal |

## Cài đặt — Windows

### 1. Clone repo

```cmd
cd D:\minhhaucode
git clone https://github.com/hautran2602/fb-skills.git
```

### 2. Tạo junction vào Claude global skills

Mở **Command Prompt as Administrator** (hoặc bật Developer Mode trong Settings):

```cmd
mklink /J "%USERPROFILE%\.claude\skills\get-via-access" ^
          "D:\minhhaucode\fb-skills\skills\get-via-access"
```

Nếu chưa có folder `%USERPROFILE%\.claude\skills\`, tạo trước:

```cmd
mkdir "%USERPROFILE%\.claude\skills"
```

### 3. Verify

Mở 1 session Claude Code mới, gõ: `lấy token FB`

Claude sẽ tự nhận ra skill `get-via-access` và trả lời theo pattern trong
`SKILL.md`. Nếu không, kiểm tra junction đã đúng chưa:

```cmd
dir "%USERPROFILE%\.claude\skills\get-via-access"
```

## Cài đặt — macOS/Linux

```bash
cd ~/dev
git clone https://github.com/hautran2602/fb-skills.git
mkdir -p ~/.claude/skills
ln -s "$(pwd)/fb-skills/skills/get-via-access" ~/.claude/skills/get-via-access
```

## Cấu trúc repo

```
fb-skills/
├── README.md                         ← File này
├── .gitignore
└── skills/
    └── get-via-access/               ← Skill 1
        ├── SKILL.md                  ← Main instructions cho Claude
        ├── reference/                ← Knowledge base
        │   ├── credentials-overview.md
        │   ├── extraction-strategies.md  ← BG-fetch (primary) vs MAIN-world (fallback)
        │   ├── use-case-matrix.md
        │   └── error-codes.md
        └── templates/                ← Code sẵn copy-paste vào project
            ├── bg-fetch-credentials.js   ← ⭐ PRIMARY — background fetch + extract
            ├── manifest-template.json    ← MV3 manifest chuẩn (permissions, DNR)
            ├── dnr-rules.json            ← Spoof headers origin/referer
            ├── compute-jazoest.js        ← Derive jazoest từ fb_dtsg
            ├── validate-token.js         ← Check token live qua /me
            └── build-internal-headers.js ← Headers cho /api/graphql/
```

## Cách dùng trong session Claude

Sau khi cài skill, các câu hỏi sau sẽ tự trigger skill:

- "Lấy token FB từ trang đang login"
- "Làm tool check token FB còn sống không"
- "Tạo extension MV3 gọi Graph API FB"
- "Extract fb_dtsg + jazoest để gọi GraphQL"
- "Setup Puppeteer lấy credentials FB"
- "Spoof header để gọi graph.facebook.com"
- "Token FB báo lỗi 190/102, xử lý sao?"

Claude sẽ:
1. Đọc `SKILL.md` để hiểu flow
2. Đọc file `reference/*.md` khi cần chi tiết kỹ thuật
3. Copy template từ `templates/` vào project của anh
4. Điều chỉnh theo context cụ thể

## Update skills

Khi FB đổi API/endpoint (thường xuyên xảy ra):

```cmd
cd D:\minhhaucode\fb-skills
git pull origin main
```

Junction tự động thấy file mới — không cần reload Claude.

## Changelog

### v0.2.0 — 2026-04-21
- **Breaking:** Đổi default architecture sang **background-fetch** — user không cần mở tab FB
- Thêm `templates/bg-fetch-credentials.js` (PRIMARY) + `templates/manifest-template.json`
- Rewrite `SKILL.md`: dạy Claude ưu tiên BG-fetch, MAIN-world chỉ là fallback
- Thêm `reference/extraction-strategies.md` so sánh 3 approach
- Xoá `content-hook.js`, `content-bridge.js`, `puppeteer-extract.js`, `internal-creds.md`, `extraction-sources.md` (legacy)

### v0.1.0 — 2026-04-20
- Khởi tạo repo
- Skill `get-via-access` phiên bản đầu (MAIN-world content script — đã deprecated)
- 5 reference docs + 7 template files

### Roadmap
- **v0.2.0** — Skill `fb-get-ads-data` (fetch TKQC, billing, insights, BM)
- **v0.3.0** — Skill `fb-data-sync` (incremental sync, localStorage merge)
- **v0.4.0** — Skill `fb-tool-scaffold` (generate project mới từ template)

## Đóng góp

Repo private của cá nhân. Nếu anh/chị được chia sẻ truy cập:
- Branch `main` là stable
- PR qua branch `feature/xxx`
- Mỗi skill update → bump version trong SKILL.md frontmatter + update README changelog

## License

Private — chỉ dùng nội bộ Lexcom Agency.
