<div align="center">

# ✨ CREATOR HUB ✨

**The Ultimate Cross-Platform Utility Ecosystem for Content Creators**

![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-success?style=for-the-badge)

*An all-in-one desktop application designed to optimize workflows, process media, and manage system resources effortlessly.*

</div>

---

## 🚀 Key Features

Creator Hub is divided into powerful modules, combining local hardware acceleration with cloud-based AI to deliver a seamless experience:

### 🎬 Media & Video Processing
- **Video Joiner:** Quickly merge multiple video files. Supports shuffling, Pillar Video algorithms, and custom aspect ratios (16:9, 9:16, 1:1).
- **Video Downloader:** Fetch high-quality videos (up to 4K) from YouTube, TikTok, and 1000+ platforms using anti-bot bypass mechanisms.
- **Smart Converter:** Cross-convert between `mp4`, `mkv`, `mov`, `mp3`, `webp`, and more with Hardware GPU Acceleration (`nvenc`, `qsv`, `videotoolbox`).

### 🧠 AI Integration (Coming Soon / WIP)
- **AI Voice Generator:** Studio-grade multilingual voiceovers powered by ElevenLabs.
- **AI Subtitle Extractor:** Auto-extract and transcribe audio using Groq Cloud API & Whisper-Large-V3.

### 🛠️ System Administration
- **Deep Clean Uninstaller:** Deep scans the Windows Registry and macOS `/Applications` to remove ghost processes and residual junk files.
- **System Junk Cleaner:** Purges bloated temporary files from the OS, browsers, and CapCut render caches.
- **Package Manager CLI:** Silent bulk software installations via Winget & Homebrew.

---

## 💻 Tech Stack

- **Framework:** [Electron](https://electronjs.org/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Electron-Vite](https://electron-vite.org/) + [Electron-Builder](https://www.electron.build/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Media Core:** `ffmpeg-static`, `ffprobe-static`, `fluent-ffmpeg`, `yt-dlp-wrap`

---

## ⚙️ Development Setup

### Recommended IDE
- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+ recommended) and `npm` installed.

### Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
$ git clone [https://github.com/trancaodai1651/creator-hub-app.git](https://github.com/trancaodai1651/creator-hub-app.git)

# Navigate to the directory
$ cd creator-hub-app

# Install dependencies
$ npm install

# Development
$ npm run dev

# Build
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux