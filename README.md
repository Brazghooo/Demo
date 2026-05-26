# Pacific Finance Reporting Portal

A modern, fast, responsive multi-module client-side portal and administrative panel with a secured login interface. Equipped with mock-up central finance engines, branch trackers, sheets analyzers, and real-time ledger records.

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v10 or higher)

### 2. Local Installation
Extract the exported ZIP archive to a folder, open your terminal in that folder, and run:
```bash
npm install
```

### 3. Run Development Server
To launch both the Express backend server and Vite dev proxy:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment Guides

### Option A: Static Frontend Only (Vercel, Netlify, Cloudflare Pages, GitHub Pages)
If you do not require the backend file-upload simulation APIs or want a pure frontend SPA:
1. Import your exported repository or drag-and-drop the files into **Vercel**.
2. Configure the following project settings on Vercel:
   - **Framework Preset**: `Vite` or `Other`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Hit **Deploy**. The application will be optimized, bundled, and hosted globally.

### Option B: Full-Stack App (Render, Railway, Koyeb, Heroku, AWS)
If you wish to deploy both the Vite frontend and the Node.js Express server (`server.ts`):
1. **Render** / **Railway**:
   - Create a new web service.
   - Link your repository.
   - Vercel-like platforms might need a standard build command. Specify:
     - **Build Command**: `npm run build`
     - **Start Command**: `npm start`
     - **Port**: `3000` (Render/Railway will automatically forward public traffic to your bind port).

2. **Serverless on Vercel (Optional)**:
   - To host full-stack with serverless functions on Vercel, configure a `vercel.json` routing configuration to forward `/api/*` to a middleware function. However, the pre-bundled CJS static routing (`dist/`) works natively out-of-the-box on standard server hosts.

---

## 🛠️ Build and Testing
To perform a complete production compilation run:
```bash
npm run build
```
This performs a custom fast Vite build producing the static assets under `/dist` and bundles the TypeScript backend wrapper cleanly into `/dist/server.cjs` for fast execution.
