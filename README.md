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

## 📖 Table of Contents
* [🌟 Detailed Engine Features](#-detailed-engine-features)
* [📁 Database Models Structure](#-database-models-structure)
* [🛣️ REST API Reference Router](#️-rest-api-reference-router)
* [📂 Folder Structure Map](#-folder-structure-map)
* [⚙️ Development Setup & Local Run](#️-development-setup--local-run)
* [☁️ Cloud Deployments](#️-cloud-deployments)
* [💖 Support & Donation Options](#-support--donation-options)

---

## 🌟 Detailed Engine Features

### 📄 Dual-Engine Resume PDF Parser
When a user uploads a PDF file (`/api/parse-resume`), it is processed by `multer` and run through:
1. **Gemini AI Engine**: Converts text extracted via `pdf-parse` into clean JSON formats using targeted prompt structures.
2. **Heuristic Fallback Engine**: Runs automatically if Gemini fails or the API key is not configured. It executes multiple regex steps:
   * **Contact Regex Scanner**: Extracts emails, phone numbers, location keywords, GitHub links, LinkedIn URLs, and websites.
   * **Title Buffers**: Maps line titles to key database models (`summary`, `experience`, `education`, `skills`, `projects`).
   * **Multi-pass Item Splitter**: Joins wrapped bullet continuations to their parent items and splits project listings dynamically when titles are detected.

### 🔐 User Space Security
Authentication is handled using `bcryptjs` for secure password hashing and standard JWT verification filters inside `middleware/authMiddleware.js`.

---

## 📁 Database Models Structure

The MongoDB database tracks these schemas:
* **User**: Profiles mapping `email`, `password`, and profile configurations.
* **Resume**: Storing resume titles, JSON data structures, and styling variables.
* **Job**: Storing company names, salaries, roles, Kanban categories, and swipe lists.

---

## 🛣️ REST API Reference Router

All API routes are prefixed with `/api`:

| Path | Method | Purpose | Auth Header |
| :--- | :--- | :--- | :--- |
| `/api/register` | `POST` | User registration. | No |
| `/api/login` | `POST` | User login (JWT return). | No |
| `/api/parse-resume` | `POST` | File upload and PDF parsed structures. | Yes |
| `/api/resumes` | `GET` | Get all saved resumes for the user. | Yes |
| `/api/resumes` | `POST` | Save a new resume dataset. | Yes |
| `/api/resumes/:id` | `PUT`/`DELETE` | Modify or remove a saved resume. | Yes |
| `/api/jobs` | `GET`/`POST` | Track swipe listings and Kanban items. | Yes |
| `/api/copilot/cover-letter` | `POST` | Build tailored cover letters. | Yes |
| `/api/copilot/interview` | `POST` | Generate interview mock sheets. | Yes |

---

## 📂 Folder Structure Map

```text
resumemaster-server/
├── controllers/          # API Handlers & Parser engines
│   └── resumeController.js     # Resume upload parsing controller
├── middleware/           # Route verification layers
│   └── authMiddleware.js       # JWT filters
├── models/               # MongoDB Mongoose Schemas
│   ├── User.js
│   ├── Resume.js
│   └── Job.js
├── routes/               # Express Router routes mapping
│   ├── aiRoutes.js
│   ├── authRoutes.js
│   ├── careerRoutes.js
│   ├── documentRoutes.js
│   ├── matcherRoutes.js
│   └── resumeRoutes.js
├── utils/                # Helper tools
│   └── keywordExtractor.js     # Keyword algorithms
├── server.js             # Express app entrypoint & db connection
└── package.json          # Node scripts
```

---

## ⚙️ Development Setup & Local Run

1. Navigate to the server folder:
   ```bash
   cd resumemaster-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside this directory:
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/resumemaster
   JWT_SECRET=your_jwt_secret_phrase
   GEMINI_API_KEY=your_optional_gemini_api_key
   ```
4. Run in dev mode (hot reload via nodemon):
   ```bash
   npm run dev
   ```

---

## ☁️ Cloud Deployments

1. Link repository and point root directory to `resumemaster-server`.
2. Add your environment parameters: `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`.
3. Set build & run parameters:
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`

---

## 💖 Support & Donation Options

ResumeMaster is an open-source product created to help candidates build resumes. Support its continuous development!

<p align="center">
  <a href="https://www.buymeacoffee.com/yasirraeesit" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" />
  </a>
</p>

* **⭐ Star the repo**: Help us grow our developer community.
* **☕ Sponsor a developer**: Send a one-time support contribution via [Buy Me A Coffee](https://www.buymeacoffee.com/yasirraeesit).
* **🤝 Partner / Sponsor**: If your company benefits from ResumeMaster or wants to sponsor features, get in touch to get your logo placed right here!
