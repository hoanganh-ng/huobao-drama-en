# 🎬 Huobao Drama - AI Short-Drama Generation Platform

<div align="center">

**A full-stack TypeScript AI short-drama automation platform**

[![Node Version](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=node.js)](https://nodejs.org)
[![Vue Version](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat&logo=vue.js)](https://vuejs.org)
[![License](https://img.shields.io/badge/CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

[Features](#features) • [Quick Start](#quick-start) • [Deployment Guide](#deployment-guide)

> 🔥 **AI Creation Savings Guide — Happy Horse & Seedance exclusive discount, unbeatable deals** 👉 [View now](https://aiad.dfycloud.com/)

</div>

---

## 📖 Overview

Huobao Drama is an AI-powered automation platform for short-drama production, covering the full pipeline from script generation, character design, storyboard production, to final video composition.

Huobao Drama Commercial: [Commercial Site](https://drama.chatfire.site/shortvideo)
Huobao Novel Generation: [Novel Site](https://marketing.chatfire.site/huobao-novel/)

### 🎯 Core Value

- **🤖 AI-driven**: Uses large language models to parse scripts and extract characters, scenes, and storyboard information
- **🎨 Smart creation**: AI image generation for character portraits and scene backgrounds
- **📹 Video generation**: Text-to-video and image-to-video models automatically generate storyboard clips
- **🔄 Workflow**: Complete short-drama production pipeline, from idea to final cut in one place

### 🛠️ Tech Architecture

```
frontend/   — Nuxt 3 + Vue 3 + TypeScript (pure CSS, no UI framework)
backend/    — Hono + Drizzle ORM + Mastra AI Agents + better-sqlite3
configs/    — config.yaml
data/       — SQLite database + generated assets
skills/     — Agent skill definitions (SKILL.md)
```

### 🎥 Demo Videos

Experience the AI short-drama generation effect:

<div align="center">

**Demo 1**

<video src="https://ffile.chatfire.site/cf/public/20260114094337396.mp4" controls width="640"></video>

**Demo 2**

<video src="https://ffile.chatfire.site/cf/public/fcede75e8aeafe22031dbf78f86285b8.mp4" controls width="640"></video>

[Watch Video 1](https://ffile.chatfire.site/cf/public/20260114094337396.mp4) | [Watch Video 2](https://ffile.chatfire.site/cf/public/fcede75e8aeafe22031dbf78f86285b8.mp4)

</div>

---

## ✨ Features

### 🎭 Character Management

- ✅ AI-generated character portraits
- ✅ Batch character generation
- ✅ Character image upload and management
- ✅ Character voice assignment and sample playback

### 🎬 Storyboard Production

- ✅ AI auto-breaking of storyboard scripts
- ✅ Scene description and shot design
- ✅ Storyboard image generation (text-to-image)
- ✅ Grid image generation, splitting, and assignment
- ✅ Frame type selection (first frame / last frame / storyboard panel)

### 🎥 Video Generation

- ✅ Image-to-video auto-generation
- ✅ TTS voice generation
- ✅ FFmpeg single-shot composition (video + audio + subtitle)
- ✅ Full-episode merge and export

### 📦 Asset Management

- ✅ Unified asset library
- ✅ Local storage support
- ✅ Task progress tracking

### 🤖 AI Agents

5 built-in Mastra Agents with database configuration and Skill extension support:

| Agent | Responsibility |
|---|---|
| `script_rewriter` | Novel → formatted script rewriting |
| `extractor` | Character + scene intelligent extraction and dedup |
| `storyboard_breaker` | Script → storyboard sequence breaking |
| `voice_assigner` | Character voice auto-assignment |
| `grid_prompt_generator` | Character / scene / grid image prompt generation |

### 🔌 Multi-Provider Adapters

| Type | Supported Providers |
|---|---|
| **Image** | OpenAI, Gemini, MiniMax, Volcengine, Aliyun, Chatfire |
| **Video** | MiniMax, Volcengine/Seedance, Vidu, Aliyun |
| **TTS** | MiniMax |

---

## 🚀 Quick Start

### 📋 Requirements

| Software | Version | Notes |
|---|---|---|
| **Node.js** | 20+ | Frontend & backend runtime |
| **npm** | 9+ | Package manager |
| **FFmpeg** | 4.0+ | Video processing (**required**) |

#### Install FFmpeg

**macOS:**

```bash
brew install ffmpeg
```

**Ubuntu/Debian:**

```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
Download from the [FFmpeg website](https://ffmpeg.org/download.html) and add to PATH.

Verify installation:

```bash
ffmpeg -version
```

### ⚙️ Configuration

Copy and edit the config file:

```bash
cp configs/config.example.yaml configs/config.yaml
```

Config format (`configs/config.yaml`):

```yaml
app:
  name: "Huobao Drama API"
  version: "1.0.0"
  debug: true

server:
  port: 5679
  host: "0.0.0.0"
  cors_origins:
    - "http://localhost:3013"

database:
  type: "sqlite"
  path: "./data/huobao_drama.db"

storage:
  type: "local"
  local_path: "./data/storage"
  base_url: "http://localhost:5679/static"

ai:
  default_text_provider: "openai"
  default_image_provider: "openai"
  default_video_provider: "doubao"
```

> **Note**: AI service API keys and model parameters are configured in the **Settings** page of the Web UI.

### 📥 Install Dependencies

```bash
# Clone the project
git clone https://github.com/chatfire-AI/huobao-drama.git
cd huobao-drama

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 🎯 Run the Project

#### Option 1: Development Mode (Recommended)

Frontend and backend separated, with hot-reload:

```bash
# Terminal 1: backend
cd backend
npm run dev

# Terminal 2: frontend
cd frontend
npm run dev
```

- Frontend: `http://localhost:3013`
- Backend API: `http://localhost:5679/api/v1`
- Frontend automatically proxies `/api` and `/static` to the backend

#### Option 2: Single-Server Mode

The backend serves both API and frontend static files:

```bash
# 1. Build the frontend
cd frontend && npm run generate

# 2. Start the backend
cd ../backend && npm start
```

Visit: `http://localhost:5679`

### 🗄️ Database

Database tables are created automatically on first startup, no manual migration required. Default path: `data/huobao_drama.db`. Override with environment variable:

```bash
DB_PATH=/path/to/your.db npm start
```

---

## 📦 Deployment Guide

### ☁️ One-Click Cloud Deployment (Recommended 3080Ti)

👉 [CompShare, one-click deploy](https://www.compshare.cn/images/fScvzK95NUk5?referral_code=8hUJOaWz3YzG64FI2OlCiB&ytag=GPU_YY_YX_GitHub_huobaoai)

> ⚠️ **Note**: Back up your data from the cloud deployment to local storage in time.

---

### 🐳 Docker Deployment (Recommended)

#### Option 1: Docker Compose (Recommended)

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

#### Option 2: Docker CLI

```bash
# Run from Docker Hub
docker run -d \
  --name huobao-drama \
  -p 5679:5679 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/configs/config.yaml:/app/configs/config.yaml \
  --restart unless-stopped \
  huobao/huobao-drama:latest

# View logs
docker logs -f huobao-drama
```

> **Note**: Linux users need to add `--add-host=host.docker.internal:host-gateway` to access host services.

**Build locally (optional):**

```bash
docker build -t huobao-drama:latest .
docker run -d --name huobao-drama -p 5679:5679 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/configs/config.yaml:/app/configs/config.yaml \
  huobao-drama:latest
```

**Docker deployment benefits:**

- ✅ Out of the box, includes FFmpeg and default config
- ✅ Frontend + backend merged into a single image, single port
- ✅ Environment consistency, no dependency issues
- ✅ `data/` volume-mounted for data persistence

#### 🔗 Accessing Host Services (Ollama / local models)

Inside the container, access host services via `http://host.docker.internal:PORT`.

**Configuration steps:**

1. Start the service on the host (listening on all interfaces):

   ```bash
   export OLLAMA_HOST=0.0.0.0:11434 && ollama serve
   ```

2. In the Web UI **Settings → AI Service Configuration**, fill in:
   - Base URL: `http://host.docker.internal:11434/v1`
   - Provider: `openai`
   - Model: `qwen2.5:latest`

---

### 🏭 Traditional Deployment

```bash
# 1. Build the frontend
cd frontend && npm run generate && cd ..

# 2. Start the backend
cd backend && npm start
```

Files to upload to the server:

```
backend/          # Backend source + node_modules
frontend/dist/    # Frontend build output
configs/config.yaml
data/             # Data directory (auto-created on first run)
skills/           # Agent skill files
```

#### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5679;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 🎨 Tech Stack

### Backend

- **Runtime**: Node.js 20+
- **Web framework**: Hono
- **ORM**: Drizzle ORM + better-sqlite3
- **AI Agent**: Mastra + AI SDK (OpenAI compatible)
- **Video processing**: FFmpeg (fluent-ffmpeg)
- **Image processing**: Sharp

### Frontend

- **Framework**: Nuxt 3 (SPA mode)
- **Language**: Vue 3 + TypeScript
- **Routing**: File-based routing (Vue Router 4)
- **Styling**: Pure CSS + CSS Variables (dark theme)
- **Icons**: Lucide Vue

---

## 📝 FAQ

### Q: How does the Docker container access the host's Ollama?

A: Use `http://host.docker.internal:11434/v1` as the Base URL. Note:
1. Host Ollama must listen on `0.0.0.0`: `export OLLAMA_HOST=0.0.0.0:11434 && ollama serve`
2. Linux users running `docker run` need to add: `--add-host=host.docker.internal:host-gateway`

### Q: FFmpeg not installed or not found?

A: Make sure FFmpeg is installed and in your PATH. Run `ffmpeg -version` to verify. Docker deployments include FFmpeg.

### Q: Frontend can't reach backend API?

A: Check the backend is running and on the correct port. In dev mode, the proxy is configured in `frontend/nuxt.config.ts`.

### Q: Database tables not created?

A: The backend creates all tables on first startup. Check the logs to confirm initialization succeeded.

---

## 📋 Changelog

### v2.0.0 (2026-04)

#### 🚀 Major Update

- Full migration to TypeScript stack
  - Backend: Hono + Drizzle ORM + better-sqlite3
  - Frontend: Nuxt 3 + Vue 3
  - AI Agent: Mastra framework
- Redid the single-episode workbench UI and production flow
  - More compact workbench layout
  - Redid storyboard editor
  - Redid voice, shot image, video, composition, and export interfaces
- Added Docker deployment support, frontend + backend merged into a single image
- Runtime Skill loading mechanism
- Expanded multi-provider media adapters
  - Image: OpenAI, Gemini, MiniMax, Volcengine, Aliyun
  - Video: MiniMax, Volcengine/Seedance, Vidu, Aliyun
  - TTS: MiniMax
- Grid image generation, splitting, and reassignment flow
- Optimized local file handling and reference image on-demand transcoding

### v1.0.4 (2026-01-27)

- Local storage strategy to avoid external link breakage
- Base64 reference image inline transfer
- Fixed shot-switching state reset issue
- Scene migration to chapter support

### v1.0.3 (2026-01-16)

- Pure Go SQLite driver, supports CGO_ENABLED=0 cross-platform builds
- Optimized concurrent performance (WAL mode)
- Docker cross-platform support for host.docker.internal

### v1.0.2 (2026-01-14)

- Fixed video generation API response parsing
- Added OpenAI Sora video endpoint configuration
- Optimized error handling and log output

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork this project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Common check commands:

```bash
cd backend && npm run typecheck
cd ../frontend && npm run build
```

---

## API Configuration Site

2-minute setup: [API Aggregator](https://api.chatfire.site/models)

---

## 👨‍💻 About Us

**AI Huobao — AI Studio (building in progress)**

- 🏠 **Location**: Nanjing, China
- 🚀 **Status**: Building in progress
- 📧 **Email**: [18550175439@163.com](mailto:18550175439@163.com)
- 🐙 **GitHub**: [https://github.com/chatfire-AI/huobao-drama](https://github.com/chatfire-AI/huobao-drama)

> _"Let AI help us do more creative work"_

## 🔗 Friends Links

This project has been recognized by the [LINUX DO](https://linux.do/) community.

- [LINUX DO](https://linux.do/) — The true open-source spirit, a community built and shared together

## Project Group

![Project Group](drama.png)

- File an [Issue](../../issues)
- Email the project maintainer

---

<div align="center">

**⭐ If this project helps you, please give it a Star!**

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=chatfire-AI/huobao-drama&type=date&legend=top-left)](https://www.star-history.com/#chatfire-AI/huobao-drama&type=date&legend=top-left)
Made with ❤️ by Huobao Team

</div>
