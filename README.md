# ⚡ ECHO VAULT: Futuristic Student Database Management System

> **Operational State**: NOMINAL  
> **Tagline**: *"The Future of Student Database Management."*

Echo Vault is a premium, high-fidelity personal student cloud database system. It provides academic, personal, and security management hubs inside a luxury cyberpunk-inspired interface (combining design notes from Apple Vision Pro, Windows 11 Fluent, Nothing OS, and Cyberpunk 2077 HUDs). 

Rather than a standard admin dashboard, Echo Vault feels like a live operating system console with custom Canvas plexus background links, micro-synthesized audio beeps, and dynamic mouse glows.

---

## 📂 System Architecture & Folder Structure

```
student-personal-information-vault/
├── client/                      # React Frontend App
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Shared components
│   │   │   ├── ui/              # Canvas backgrounds, glow buttons, micro-audio
│   │   │   ├── FileExplorer/    # Win11 Explorer, File history, comparative Diff
│   │   │   ├── AI/              # AI Assistant chat panels
│   │   │   └── Layout/          # Nav sidebar, control headers
│   │   ├── context/             # AuthContext, sessions provider
│   │   ├── pages/               # Dashboard, Notes Lab, Attendance, Vault, Profile
│   │   ├── services/            # Dexie.js IndexedDB cache configuration
│   │   ├── App.jsx              # Routing rules & provider trees
│   │   ├── index.css            # Cyberpunk Tailwind base & neon scrollbars
│   │   └── main.jsx             # React bootstrapping entry point
│   ├── tailwind.config.js       # Neon color palette configuration
│   ├── vite.config.js           # API proxy targets configurations
│   └── package.json
│
└── server/                      # Express.js backend API
    ├── config/                  # SQLite connection and migration modules
    ├── controllers/             # Relational CRUD logic handlers
    ├── middleware/              # JWT authorization & multipart uploads parser
    ├── routes/                  # Route routers for endpoints
    ├── uploads/                 # Storage uploads folder
    ├── server.js                # Express app launcher
    ├── .env                     # Server environment settings
    └── package.json
```

---

## ⚙️ Quick Start Installation Guide

Follow these steps to initialize the Echo Vault engine on your local node:

### 1. Prerequisite Requirements
Ensure you have **Node.js (v18+)** and **npm** installed on your system.

### 2. Backend Server Setup
Navigate into the server folder, install dependencies, and start the node:
```bash
cd server
npm install
npm run dev
```
*The server will initialize `database.sqlite`, execute table schema creations, seed initial student profiles (Tony Stark), and start listening on port `5000`.*

### 3. Frontend Client Setup
Navigate into the client folder, install dependencies, and launch the Vite dev server:
```bash
cd client
npm install
npm run dev
```
*Open your browser and navigate to `http://localhost:5173`. The client runs in proxy mode, routing `/api/*` network requests directly to the backend node.*

---

## 🛡️ Sandbox Login Access Credentials

To skip registration, bypass lock controls using the built-in sandbox token profile:

- **Academic Email**: `tony@echo.edu`
- **Security Password**: `echo1234`
- **Master Credentials PIN**: `7777` *(Required to decrypt passwords inside the vault)*

---

## 💎 Core Feature Highlights

### 1. Interactive Starfield Canvas & Mouse Glow
Layers an interactive canvas underneath the app. Dots represent data nodes that form connective vectors (plexus nodes) based on mouse proximity. Glassmorphic cards use hover event coordinates to calculate radial offsets for neon gradients.

### 2. Synthesized Web Audio Tones
Features custom click pops, warning alarms, success arpeggios, and list ticks synthesized on the fly via the browser's native **Web Audio API**. Requires zero asset downloads and includes simple mute settings cached locally in Dexie.

### 3. Draggable File Explorer & Live Diffing
Provides a custom Explorer displaying items by categories (Documents, Pictures, Videos). Supports file versions. Selecting multiple versions generates line-by-line differences of text assets (revisions comparison).

### 4. Smart AI Assistant Co-Pilot
A Notion/Gemini style drawer. If asked *"Where is my DBMS notes?"*, it queries note endpoints and renders rich, interactive widgets directly in the chat bubbles showing locations, semesters, and markdown quick-reads.

### 5. Client-Side Encryption Vault
Allows securing portal credentials. Passwords are encrypted client-side using a symmetric Cipher shift before database upload. Values remain encrypted on the SQLite server and are decrypted only after verified input of the Master PIN.

### 6. JSON Database Backup Streams
Allows exporting the entire database state as a JSON backup payload file. You can import this JSON file into any new instance of Echo Vault to restore data tables.
