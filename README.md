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

* **🔐 Authenticated User Workspace**: Register and log in securely. Password hashes are stored safely in MongoDB and tokens are verified via JWT middleware.
* **📄 Smart ATS Resume Parser**:
  * Upload a PDF resume.
  * The server extracts text using `pdf-parse`.
  * If a `GEMINI_API_KEY` is present, it uses Gemini AI model prompts to format sections into clean JSON.
  * If the API fails or is not provided, the server runs a custom, multi-pass **heuristic parsing fallback** that splits details into profile contact keys, education rows, bulleted projects, and skills.
* **📋 Job Tracker Kanban Sync**: Handles CRUD operations for job applications mapped to Kanban lanes (`Wishlist`, `Applied`, `Interview`, `Offer`, `Rejected`).
* **🧠 Copilot Integrations**: API endpoints to generate cover letters and optimize text inputs.

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
