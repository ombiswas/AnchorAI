# AnchorAI — AI Study Companion

AnchorAI is an intelligent study companion platform that transforms your notes, PDFs, and handwritten study materials into an interactive, grounded AI learning environment. Ask questions directly grounded in your documents with page citations, generate tailored quizzes, and pinpoint weak topics through mastery analytics.

---

## Tech Stack

### Client

- **Framework:** React 19 + TypeScript (strict mode)
- **Tooling:** Vite, ESLint, Prettier
- **Styling:** TailwindCSS + Custom Tokens inspired by the Together AI design system (high-contrast surfaces, mono eyebrows, clean typography)
- **State & Routing:** Context API / React Hooks

### Server

- **Runtime & Framework:** Node.js + Express + TypeScript (strict mode)
- **Database:** MongoDB & Mongoose + MongoDB Atlas Vector Search
- **AI & Ingestion:** OpenAI / Groq LLMs, OpenAI Embeddings (`text-embedding-3-small`), Tiktoken chunking, Tesseract.js / Vision OCR
- **Security & Validation:** JWT (JSON Web Tokens), bcrypt (cost factor 12), Zod schema validation

---

## Project Structure

```text
AnchorAI/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── components/         # Reusable UI components & design system primitives
│   │   ├── pages/              # Top-level screen views (Auth, Upload, Chat, Quiz, Analytics)
│   │   ├── hooks/              # Custom React hooks (useAuth, etc.)
│   │   ├── lib/                # API clients, token helpers, utilities
│   │   └── types/              # Client-side TypeScript definitions
│   ├── .env.example
│   └── package.json
├── server/                     # Backend Node.js + Express API
│   ├── src/
│   │   ├── routes/             # Express route definitions
│   │   ├── controllers/        # Request handling and HTTP orchestration
│   │   ├── services/           # Core business logic & database/AI calls
│   │   ├── models/             # Mongoose schemas & data models
│   │   ├── middleware/         # Auth, validation, and error middlewares
│   │   ├── config/             # Typed environment & service configuration
│   │   └── utils/              # Helper utilities
│   ├── .env.example
│   └── package.json
├── docs/                       # Project blueprints and design system specifications
├── tracker.md                  # Milestone & decision tracking log
├── eslint.config.js            # Shared ESLint configuration
├── .prettierrc                 # Shared Prettier formatting rules
└── package.json                # Root orchestration & scripts
```

---

## Getting Started

### Prerequisites

- **Node.js:** v18+ (tested on Node v24)
- **npm:** v9+

### Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd AnchorAI
   ```

2. **Install dependencies:**

   ```bash
   # Install root orchestration tools
   npm install

   # Install client dependencies
   npm --prefix client install

   # Install server dependencies
   npm --prefix server install
   ```

3. **Configure Environment Variables:**
   - Copy `server/.env.example` to `server/.env` and provide your secrets (MongoDB URI, JWT secret, Cloudinary, API keys).
   - Copy `client/.env.example` to `client/.env` and verify API endpoints.

4. **Run Development Servers:**
   - **Both Client & Server:**
     ```bash
     npm run dev:server
     npm run dev:client
     ```
   - Client dev runs on `http://localhost:5173`
   - Server dev runs on `http://localhost:5000`

5. **Linting and Formatting:**
   ```bash
   npm run lint          # Run ESLint across all packages
   npm run format        # Auto-format all code with Prettier
   npm run format:check  # Check formatting compliance
   ```
