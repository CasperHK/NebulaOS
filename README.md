## 🚀 NebulaOS

基於 SolidStart 的次世代 AI 驅動雲端辦公操作系統
NebulaOS 是一個將 極致性能 與 生成式 AI 深度融合的 Web 操作系統。我們不只是在瀏覽器裡跑應用，而是利用 Solid.js 的細粒度更新特性，打造一個反應速度媲美原生系統、且 AI 深度嵌入工作流的雲端辦公平台。

------------------------------
## ✨ 核心特性

* ⚡ 極速內核：基於 [SolidStart](https://docs.solidjs.com/solid-start)，無虛擬 DOM，實現毫秒級視窗切換與響應。
* 🤖 原生 AI 代理：系統級 AI 接口，支援跨應用上下文感知（Context-Awareness），可自動執行跨視窗任務。
* 🪟 多任務窗口管理：完全模擬桌面體驗，支援視窗拖拽、縮放、層級管理及虛擬桌面。
* ☁️ 邊緣運算優化：深度整合 Cloudflare Workers / Deno Deploy，確保全球訪問低延遲。
* 🔒 隱私優先：支援本地模型（Local LLM via WebLLM）與雲端模型切換，數據存儲加密。

------------------------------
## 🛠️ 技術棧

* 前端框架: [Solid.js](https://www.solidjs.com/)
* 全棧引擎: SolidStart (Powered by Vinxi)
* 狀態管理: Solid Signals & Stores
* AI 處理: Vercel AI SDK / OpenAI / Anthropic API
* 樣式方案: Tailwind CSS + Bits UI (Solid)
* 實時協作: Yjs / Socket.io

------------------------------
## 🚀 快速開始## 1. 複製項目
```
git clone https://github.com
cd nebula-os
```

## 2. 安裝依賴
```
npm install
```

## 3. 配置環境變量
建立 .env 文件並填入你的 AI 金鑰：
```
OPENAI_API_KEY=your_key_here
DATABASE_URL=your_db_url
```

## 4. 啟動開發服務器
```
npm run dev
```

打開瀏覽器訪問 http://localhost:3000。
------------------------------
## 📂 項目目錄
```text
.
├── nebula-os-monorepo/
│   ├── apps/                   # 系統內建應用 (如 Settings, App Store)
│   ├── nebula-kernel/          # [Fiber (Go) 內核]
│   │   ├── api/                # RESTful 接口
│   │   ├── cmd/                # 入口文件
│   │   ├── internal/
│   │   │   ├── appmanager/     # 管理員安裝、二進位/JS 模組加載邏輯
│   │   │   ├── desktop/        # 用戶桌面與 App 實例管理
│   │   │   └── auth/           # 權限校驗 (Admin vs User)
│   │   └── storage/            # App 資源與用戶數據存儲
│   ├── nebula-ui/              # [SolidStart 前端]
│   │   ├── src/
│   │   │   ├── core/           # OS 核心組件 (WindowManager, Taskbar)
│   │   │   ├── sdk/            # 給第三方 App 調用的 SDK (@nebula/sdk)
│   │   │   ├── shell/          # 桌面渲染與 App 加載器
│   │   │   └── routes/         # SSR 路由與 BFF
│   ├── packages/               # 共享 SDK 或 類型定義
│   │   └── sdk/                # App Framework 核心
│   └── installed_apps/         # [動態目錄] 存放管理員安裝的 App 編譯檔 (.js / .wasm)
```

------------------------------
## 🗺️ 開發路線圖 (Roadmap)

* Phase 1: 核心窗口管理器與基礎文件系統。
* Phase 2: 整合 AI Copilot，實現自動化文件處理。
* Phase 3: 應用商店架構，支援第三方開發者接入。
* Phase 4: 支持 WebContainer，在瀏覽器內運行 Node.js 開發環境。

------------------------------
## 🤝 貢獻
我們歡迎任何形式的貢獻！請先閱讀 CONTRIBUTING.md 並提交 PR。
------------------------------
## 📄 許可證
基於 MIT License 開源。

