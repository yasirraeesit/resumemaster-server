# 🖥️ ResumeMaster Backend API Server

This is the Express backend service for **ResumeMaster**, containing the database models, authentication workflows, AI resume parsing, and career copilot logic.

---

## 🛠️ Tech Stack & Dependencies

* **Runtime & Framework**: Node.js, Express (ES6 Modules)
* **Database**: MongoDB, Mongoose ODM
* **Security & Auth**: `bcryptjs` (password hashing), `jsonwebtoken` (JWT state tokens)
* **File Uploads**: `multer` (handling multi-part/form-data for PDF uploads)
* **PDF Processing**: `pdf-parse` (extracting text from binary PDFs)
* **APIs**: Integration with the Google Gemini API for natural-language analysis.

---

## ⚙️ Features & Architecture

* **🔐 Authenticated User Workspace (`routes/authRoutes.js`)**:
  * User Registration (`/api/register`) hashing passwords securely via `bcryptjs`.
  * User Login (`/api/login`) returning JWT tokens for secure authentication middleware verification.
* **📄 Dual-Engine ATS Resume Parser (`routes/aiRoutes.js` / `controllers/resumeController.js`)**:
  * Multer-based multipart endpoints accepting binary files.
  * Integration with `pdf-parse` to convert PDFs to plain text.
  * **AI Parser**: Connects to the Google Gemini API to structure text into profile objects using targeted instructions.
  * **Heuristics Fallback Parser**: A robust multi-pass rule engine that runs if Gemini is unavailable. It parses text into structured blocks by:
    * Identifying section titles dynamically (regular expressions matching standard titles like `experience`, `education`, `skills`).
    * Running a multi-pass regex filter to separate contact keys (emails, LinkedIn profiles, phone numbers, websites).
    * Restructuring experience description rows and identifying bullet point details.
* **📋 Job Tracker API (`routes/matcherRoutes.js`)**:
  * Endpoints to manage card state updates inside the Kanban lanes (`Wishlist`, `Applied`, `Interview`, `Offer`, `Rejected`).
  * Real-time ATS match calculations comparing resume keywords to target role listings.
* **🤖 Career copilot tools (`routes/careerRoutes.js`)**:
  * AI-driven endpoints generating cover letters tailored to targeted role parameters.
  * Question generators for behavioral/technical interviews.
  * Headline/Summary rewriting modules for LinkedIn profile SEO.
* **📂 Document Storage (`routes/resumeRoutes.js` / `routes/documentRoutes.js`)**:
  * Full REST endpoints allowing users to save, modify, retrieve, and delete multiple resumes mapped in MongoDB.

---

## 🏃 Local Setup & Commands

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) and [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally.

### 1. Installation
Navigate to this directory and install dependencies:
```bash
npm install
```

### 2. Environment Setup
Create a file named `.env` in this directory:
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/resumemaster
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=your_optional_gemini_api_key_here
```

### 3. Running the Server
* **Run in Development Mode (with hot-reloading)**:
  ```bash
  npm run dev
  ```
  Launches the Express server via `nodemon` at `http://localhost:5001`.
* **Run in Production Mode**:
  ```bash
  npm start
  ```
  Launches the server via Node directly.

---

## ☁️ Deployment (Making it Live)

You can host this backend server on Render, Railway, Fly.io, or Heroku.

### Render / Railway Setup
1. Point your service to the `resumemaster-server` root directory.
2. Specify the environment variables in your deployment portal settings:
   * `MONGO_URI`: `mongodb+srv://...` (Your MongoDB Atlas cloud connection string)
   * `JWT_SECRET`: (Any secure unique token)
   * `GEMINI_API_KEY`: (Your Google AI Gemini key)
   * `PORT`: `5001` or let the server use the dynamic host environment port.
3. Configure build and start parameters:
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`

---

## 💖 Support, Donations & Sponsors

If this open-source project has helped you host your own parser API, please support its maintenance:
* **⭐ Star this Repository**: Help developers find the backend APIs by starring this project on GitHub.
* **☕ Buy Me A Coffee**: Send a one-time support contribution via [Buy Me A Coffee](https://www.buymeacoffee.com/yasirraeesit).
* **🤝 Sponsors**: If your organization uses ResumeMaster or you want to showcase your brand, please contact us for sponsorship opportunities.

