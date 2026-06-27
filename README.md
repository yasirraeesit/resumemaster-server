# 🖥️ ResumeMaster Server Engine

<p align="center">
  <img src="https://img.shields.io/badge/Express-4.x-black?style=flat-square&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Mongoose-database-brightgreen?style=flat-square&logo=mongoose" alt="Mongoose" />
  <img src="https://img.shields.io/badge/Gemini_AI-API-orange?style=flat-square&logo=google-gemini" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/PDF_Parse-tool-blue?style=flat-square" alt="PDF Parse" />
  <img src="https://img.shields.io/badge/JWT-Tokens-purple?style=flat-square&logo=jsonwebtokens" alt="JWT" />
</p>

---

This is the backend REST API server engine driving **ResumeMaster**. It handles document management pipelines, user authentication databases, ATS scoring, cover letter generators, and our robust PDF processing pipelines.

---

## ⚡ Core Engine Features

### 📄 Dual-Engine Resume PDF Parser
The parser processes PDF binary streams through a multi-pass layout extraction script:
1. **AI Parse Mode**: Sends extracted text streams to the Google Gemini API to return structured resume JSON objects based on system instructions.
2. **Heuristic Fallback Engine**: Actively triggers if Gemini is unavailable. Uses regular expressions, title validators, and metadata parsers to extract emails, websites, contact details, experiences, educational markers, and skills locally.

### 🔐 User Space Security
Includes JWT session validation middleware and hashes passwords using `bcryptjs` before persisting records in MongoDB.

---

## 📂 Codebase Navigation

* **`/controllers/resumeController.js`**: Core parsing logics, heuristics fallbacks, and DB queries.
* **`/routes`**: Decoupled API routes:
  * [authRoutes.js](file:///Users/yasir/Desktop/Yasir/Products/resumemaster/resumemaster-server/routes/authRoutes.js) – User auth, registrations, and logins.
  * [resumeRoutes.js](file:///Users/yasir/Desktop/Yasir/Products/resumemaster/resumemaster-server/routes/resumeRoutes.js) – Document lists, metadata saves, and deletions.
  * [aiRoutes.js](file:///Users/yasir/Desktop/Yasir/Products/resumemaster/resumemaster-server/routes/aiRoutes.js) – PDF file uploads and parser endpoints.
  * [careerRoutes.js](file:///Users/yasir/Desktop/Yasir/Products/resumemaster/resumemaster-server/routes/careerRoutes.js) – Cover letter and simulation APIs.
  * [matcherRoutes.js](file:///Users/yasir/Desktop/Yasir/Products/resumemaster/resumemaster-server/routes/matcherRoutes.js) – Swipe tracking lists.

---

## ⚙️ Development Setup

### Setup and Running
1. Install server packages:
   ```bash
   npm install
   ```
2. Configure local environment (`.env`):
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/resumemaster
   JWT_SECRET=your_jwt_secret_phrase
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
3. Start the hot-reload service:
   ```bash
   npm run dev
   ```

### API Reference Table
| Route | Method | Action | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/register` | `POST` | Create a new user account. | No |
| `/api/login` | `POST` | Authenticate and obtain JWT token. | No |
| `/api/parse-resume` | `POST` | Upload PDF and run Dual-Engine parser. | Yes |
| `/api/resumes` | `GET`/`POST` | Save or fetch all user resumes. | Yes |
| `/api/copilot/cover-letter`| `POST` | Generate targeted cover letters. | Yes |
| `/api/jobs` | `GET`/`POST` | Track swipe listings and Kanban items. | Yes |

---

## 🌐 Deploy to Production (Render / Railway)

1. Connect your repository.
2. Specify the root target folder to `resumemaster-server`.
3. Provide host variables (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`).
4. Set build & run parameters:
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
