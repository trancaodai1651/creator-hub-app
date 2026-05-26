<div align="center">

# ✨ CREATOR HUB ✨

**The Ultimate Cross-Platform Utility Ecosystem for Content Creators**

![Tauri v2](https://img.shields.io/badge/Tauri_v2-FF7E1B?style=for-the-badge&logo=Tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-success?style=for-the-badge)

*An ultra-lightweight, blazing-fast desktop application powered by Tauri v2 and Rust, designed to optimize workflows, process media, and manage system resources effortlessly.*

</div>

---

## 🚀 Key Features

Creator Hub is divided into powerful modules, combining local Rust native hardware acceleration with cloud-based AI to deliver a seamless experience:

### 🎬 Media & Video Processing
- **Smart Video Joiner:** Merge multiple video files using a multi-threaded Rust backend. Supports shuffling, Pillar Video algorithms, custom aspect ratios (16:9, 9:16, 1:1), **real-time per-video progress parsing (%)**, and **accurate ETA (Time Remaining) calculation**.
- **Ultimate Hardware Compatibility:** Intelligent hardware fallback system ensuring maximum performance on both modern GPUs (RTX 40-Series) and legacy cards (**GTX 10-Series Pascal architecture**) without crushing the CPU. Dual-GPU (Integrated + Discrete) radar detection built-in.
- **Video Downloader:** Fetch high-quality videos (up to 4K) from YouTube, TikTok, and 1000+ platforms using embedded anti-bot bypass mechanisms.
- **Smart Converter:** Cross-convert between `mp4`, `mkv`, `mov`, `mp3`, `webp` with native hardware acceleration (`nvenc`, `qsv`, `videotoolbox`).

### 🧠 AI Integration (Coming Soon / WIP)
- **AI Voice Generator:** Studio-grade multilingual voiceovers powered by ElevenLabs.
- **AI Subtitle Extractor:** Auto-extract and transcribe audio using Groq Cloud API & Whisper-Large-V3.

### 🛠️ System Administration
- **Deep Clean Uninstaller:** Deep scans the Windows Registry and macOS `/Applications` to remove ghost processes and residual junk files.
- **System Junk Cleaner:** Purges bloated temporary files from the OS, browsers, and CapCut render caches.
- **Package Manager CLI:** Silent bulk software installations via Winget & Homebrew.

---

## 💻 Tech Stack

- **Backend Architecture:** [Rust](https://www.rust-lang.org/) Core Engine
- **Framework:** [Tauri v2](https://v2.tauri.app/) (Blazing fast, ultra-secure, ~10MB memory idle)
- **Frontend App:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build System:** [Vite](https://vite.dev/) + [Cargo](https://doc.rust-lang.org/cargo/)
- **Styling Layout:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Media Engine Core:** Native asynchronous `FFmpeg` and `FFprobe` binaries communication via Rust `std::process::Command` piped stream.

---

## ⚙️ Development Setup

### Recommended IDE
- [VSCode](https://code.visualstudio.com/) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

### Prerequisites
Before starting, make sure you have installed the required development dependencies for Tauri v2:
1. **Node.js** (v18+ recommended)
2. **Rust Up Crate Compiler** via [rustup.rs](https://rustup.rs/)
3. **OS Build Tools:**
   - *Windows:* [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - *macOS:* Xcode Command Line Tools (`xcode-select --install`)

### Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
$ git clone [https://github.com/trancaodai1651/creator-hub-app.git](https://github.com/trancaodai1651/creator-hub-app.git)

# Navigate to the directory
$ cd creator-hub-app

# Install Node modules
$ npm install

# Starts frontend Vite and injects Tauri native Rust context
$ npm run tauri dev

# Builds native production installer based on your host OS (.exe, .msi, .dmg, .app)
$ npm run tauri build