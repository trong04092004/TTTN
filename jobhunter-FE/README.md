
# JobHunter Frontend 🚀

The frontend client for the JobHunter recruitment system, built with **React (Vite) + TypeScript**.

> **Note:** This codebase has been refactored from Redux to **TanStack Query + Context API**.

## 🛠 Tech Stack
* **Core:** React 18, TypeScript, Vite.
* **State & Data:** TanStack Query (v5), Context API, Axios.
* **UI:** Ant Design, ProComponents, SCSS.
* **Real-time:** WebSocket (@stomp/stompjs).

## ⚙️ Prerequisites
* **Node.js** (v16 or higher).
* **JobHunter Backend** running (default: `http://localhost:8080`).

## 🚀 How to Run

### 1. Install Dependencies
Open the terminal in the project root and run:
```bash
npm install
````

### 2\. Environment Setup

Ensure the `.env` (or `.env.development`) file exists in the root directory:

```env
PORT=3000
VITE_BACKEND_URL=http://localhost:8080
VITE_ACL_ENABLE=true
```

### 3\. Start the App

```bash
npm run dev
```

The application will run at: `http://localhost:3000`

