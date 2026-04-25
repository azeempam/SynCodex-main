# SynCodex

**Under Development 🚀**

---

## Overview

**SynCodex** is an all-in-one collaborative coding platform designed for developers, teams, students, and educators. Its mission is to simplify remote collaboration, coding interviews, and project management by integrating real-time code editing, live sharing, and professional workflow features—all in a single workspace.

---

## Key Features

- **Real-time Collaborative Code Editor:** Multi-user, live code editing with awareness and session tracking powered by Yjs and WebSocket.
- **Live Coding Interviews:** Interview mode with live code sharing, file explorer, and possible video chat integration.
- **Project & File Management:** Organize projects into folders and files; add, rename, and validate unique file/folder names.
- **Interactive File Explorer:** Browse, add, and manage files/folders in both personal and collaborative modes.
- **Role-based Sessions:** Designed for developers, teams, as well as students & educators for learning and teaching.
- **Authentication & User Sessions:** Secure login, signup, password reset, and session persistence.
- **Cloud-Backed Storage:** Uses Firebase for robust, real-time backend data storage.
- **Modern Frontend:** Built with React + Vite for fast refresh and an interactive UI.

---

## Why Choose SynCodex?

- ✔ Eliminates the hassle of switching between multiple tools.
- ✔ Provides a professional and interactive coding experience.
- ✔ Enhances remote coding collaboration for teams and interviewers.

---

## Getting Started

### Prerequisites

- Node.js and npm installed
- (For development) Firebase service account credentials
- (Optional) Docker for backend

### Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/pranav89624/SynCodex.git
cd SynCodex
```

#### 2. Frontend Setup (`SynCodex Frontend`)

```bash
cd "SynCodex Frontend"
npm install
# To start the dev server:
npm run dev
```

#### 3. Backend Setup (`SynCodex Backend`)

```bash
cd "../SynCodex Backend"
npm install
# Ensure your Firebase credentials are in place
npm start
```

#### 4. Environment Variables

- Place your Firebase service account in the backend config directory as `firebase-service-account.json`.
- Configure API endpoints if needed for local/production.

---

## Usage

- **Collaborative Coding:** Create or join a room/project, invite others, and code together in real-time.
- **Project Management:** Add/manage files and folders, organize code, and download zipped projects.
- **Interview Mode:** Switch to interview mode for coding interviews, with specialized collaboration and session features.

---

## Project Structure

```
SynCodex/
├── SynCodex Backend/   # Node.js/Express backend, Firebase integration
├── SynCodex Frontend/  # React + Vite frontend
```

---

## License

This project may use open-source licenses for itself and its dependencies. See `LICENSE` (if available) for details.

---

## Contact

For support, feedback, or collaboration:
- Email: [See project contact section or open an issue](https://github.com/pranav89624/SynCodex/issues)

---

## Status

This project is **actively under development**. Features and documentation are subject to frequent updates.




cd '/home/azeem/Documents/Year3 -Sem 2/SynCodex-main/code runner/app' && '/home/azeem/Documents/Year3 -Sem 2/SynCodex-main/.venv/bin/python' app.py