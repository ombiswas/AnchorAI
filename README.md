# AnchorAI — AI Study Companion

AnchorAI is an intelligent study companion platform that transforms your notes, PDFs, and handwritten study materials into an interactive, grounded AI learning environment. Ask questions directly grounded in your documents with page citations, generate tailored quizzes, and pinpoint weak topics through mastery analytics.

---

## Tech Stack

### Client (`/client`)
- **Framework:** React 19 + TypeScript (strict mode)
- **Tooling:** Vite, ESLint, Prettier
- **Styling:** TailwindCSS + Custom Tokens inspired by the Together AI design system (high-contrast surfaces, mono eyebrows, clean typography)
- **State & Routing:** Context API / React Hooks

### Server (`/server`)
- **Runtime & Framework:** Node.js + Express + TypeScript (strict mode)
- **Database:** MongoDB & Mongoose + MongoDB Atlas Vector Search
- **AI & Ingestion:** OpenAI / Groq LLMs, OpenAI Embeddings (`text-embedding-3-small`), Tiktoken chunking, Tesseract.js / Vision OCR
- **Security & Validation:** JWT (JSON Web Tokens), bcrypt (cost factor 12), Zod schema validation

---

## Project Structure

```text
AnchorAI/
├── client/                     # Independent Frontend Vite + React application
│   ├── src/
│   │   ├── components/         # Reusable UI components & design system primitives
│   │   ├── pages/              # Top-level screen views (Auth, Upload, Chat, Quiz, Analytics)
│   │   ├── hooks/              # Custom React hooks (useAuth, etc.)
│   │   ├── lib/                # API clients, token helpers, utilities
│   │   └── types/              # Client-side TypeScript definitions
│   ├── eslint.config.js        # Client ESLint configuration
│   ├── .env.example
│   └── package.json            # Client-only dependencies
├── server/                     # Independent Backend Node.js + Express API
│   ├── src/
│   │   ├── routes/             # Express route definitions
│   │   ├── controllers/        # Request handling and HTTP orchestration
│   │   ├── services/           # Core business logic & database/AI calls
│   │   ├── models/             # Mongoose schemas & data models
│   │   ├── middleware/         # Auth, validation, and error middlewares
│   │   ├── config/             # Typed environment & service configuration
│   │   └── utils/              # Helper utilities
│   ├── eslint.config.mjs       # Server ESLint configuration
│   ├── .env.example
│   └── package.json            # Server-only dependencies
├── docs/                       # Project blueprints and design system specifications
├── tracker.md                  # Milestone & decision tracking log
├── .prettierrc                 # Shared workspace Prettier configuration
└── .prettierignore
```

---

## Getting Started

`/client` and `/server` are completely independent Node projects with their own `package.json` and `node_modules`.

### 1. Client Setup
```bash
cd client
npm install
npm run dev      # Runs Vite dev server at http://localhost:5173
npm run build    # Type-check and bundle production assets
npm run lint     # Lint client TypeScript code
```

### 2. Server Setup
```bash
cd server
npm install
# Configure your environment variables
cp .env.example .env
npm run dev      # Runs nodemon + ts-node at http://localhost:5000
npm run build    # Type-checks and compiles to /dist
npm run lint     # Lint server TypeScript code
```

### 3. Server Environment Variables

Create a `server/.env` file based on `server/.env.example`:

| Variable | Description | Default / Example | Required in Production |
|---|---|---|---|
| `PORT` | API server listen port | `5000` | No (defaults to 5000) |
| `NODE_ENV` | Application environment (`development` / `production`) | `development` | Yes |
| `CLIENT_URL` | Exact URL of the frontend client application | `http://localhost:5173` | **YES** |
| `MONGODB_URI` | MongoDB Atlas or replica set connection string | `mongodb://...` | **YES** |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | `your_secret_key` | **YES** |
| `LLM_PROVIDER` | Active LLM inference provider (`openai` or `groq`) | `openai` | Yes |
| `OPENAI_API_KEY` | OpenAI API key (required if `LLM_PROVIDER=openai`) | `sk-...` | Conditional |
| `GROQ_API_KEY` | Groq API key (required if `LLM_PROVIDER=groq`) | `gsk_...` | Conditional |
| `CLOUDINARY_*` | Cloudinary credentials for persistent cloud file uploads | `...` | Optional (local dev fallback) |

> [!CRITICAL]
> **Production CORS Guard (`CLIENT_URL`):**
> `CLIENT_URL` is configured as the CORS origin whitelist in Express. In production, this must be set to the exact deployed client origin (e.g. `https://anchor-ai.vercel.app` without trailing slash). **Omitting or misconfiguring `CLIENT_URL` will silently block all frontend cross-origin requests with CORS policy errors.**

