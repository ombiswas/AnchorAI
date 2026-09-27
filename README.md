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

`/client` and `/server` are independent Node.js projects with their own dependencies and scripts.

---

### 1. Environment Variables Configuration

#### A. Client Environment (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```bash
cd client
cp .env.example .env
```

| Variable | Description | Development Default | Required in Production |
|---|---|---|---|
| `VITE_API_URL` | Base URL pointing to the Express backend API (must include `/api`) | `http://localhost:5000/api` | **YES** (`https://<api-domain>/api`) |

#### B. Server Environment (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```bash
cd server
cp .env.example .env
```

| Variable | Description | Development Default / Example | Required in Production |
|---|---|---|---|
| `PORT` | API HTTP port | `5000` | No (defaults to 5000) |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` | **YES** |
| `CLIENT_URL` | Exact client origin for Express CORS whitelist | `http://localhost:5173` | **YES** (`https://<client-domain>`) |
| `MONGODB_URI` | MongoDB connection URI (Atlas or local replica set) | `mongodb://localhost:27017/anchor_ai` | **YES** |
| `JWT_SECRET` | 64+ char secret string for signing JWT tokens | `openssl rand -hex 64` | **YES** (no fallback string) |
| `JWT_EXPIRES_IN` | Token duration | `7d` | No (defaults to 7d) |
| `LLM_PROVIDER` | Active LLM inference provider (`openai` or `groq`) | `openai` | **YES** |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` | **YES** if `LLM_PROVIDER=openai` |
| `GROQ_API_KEY` | Groq API key | `gsk_...` | **YES** if `LLM_PROVIDER=groq` |
| `GROQ_MODEL` | Groq model identifier | `llama-3.3-70b-versatile` | No (defaults to llama-3.3-70b) |
| `CLOUDINARY_*` | Cloudinary credentials (`CLOUD_NAME`, `API_KEY`, `API_SECRET`) | *(empty for local `/uploads` fallback)* | Recommended in production |

> [!CRITICAL]
> **Production CORS Guard (`CLIENT_URL`):**
> `CLIENT_URL` must match your production client origin exactly (e.g. `https://anchor-ai.vercel.app`) without a trailing slash. If missing or misconfigured in production, all browser requests will be blocked by CORS policy.

---

### 2. Switching Between LLM Providers (OpenAI vs. Groq)

AnchorAI provides a pluggable LLM architecture supporting both OpenAI and Groq for completions, quizzes, primers, and RAG question answering.

#### Option A: Using OpenAI (Default)
1. In `server/.env`, set:
   ```env
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-proj-...
   ```
2. **Behavior:**
   - Text generation: Uses `gpt-4o-mini` with low temperature for strict factual adherence.
   - Vector embeddings: Uses `text-embedding-3-small` (1536 dimensions) for semantic retrieval.
   - OCR transcription: Tesseract.js runs locally first ($0 cost); if handwriting confidence is < 60%, automatically escalates to GPT-4o Vision.

#### Option B: Using Groq (Ultra-Low Latency)
1. In `server/.env`, set:
   ```env
   LLM_PROVIDER=groq
   GROQ_API_KEY=gsk_...
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
2. **Behavior:**
   - Text generation: Routes completions, quiz generation, and primer synthesis to Groq's LPUs for near-instant response times.
   - Vector embeddings: Continues using `text-embedding-3-small` if `OPENAI_API_KEY` is present, or falls back gracefully to local embeddings.

> [!NOTE]
> **Fail-Fast Startup Guards:**
> The server validates active LLM credentials on boot. If `LLM_PROVIDER=groq` is set without `GROQ_API_KEY`, or `LLM_PROVIDER=openai` without `OPENAI_API_KEY`, the server throws a fatal startup error and refuses to start.

---

### 3. Development vs. Production Run Instructions

#### Development Workflow

Run both client and server dev servers concurrently with hot-reloading:

```bash
# Terminal 1 — Backend API
cd server
npm install
npm run dev      # Runs nodemon + ts-node at http://localhost:5000

# Terminal 2 — Frontend Client
cd client
npm install
npm run dev      # Runs Vite dev server at http://localhost:5173
```

#### Production Build & Run

```bash
# 1. Build and Run Server
cd server
npm install --omit=dev
npm run build    # Compiles TypeScript to server/dist
npm start        # Launches production Node server via node dist/server.js

# 2. Build Client Assets
cd client
npm install
npm run build    # Type-checks and bundles optimized production SPA in client/dist
npm run preview  # (Optional) Locally test the production build at http://localhost:4173
```

#### Production Deployment Checklist
1. Deploy `server/` to any Node 20+ runtime (Render, Railway, Fly.io, AWS ECS). Set `NODE_ENV=production`.
2. Deploy `client/` to any static hosting service (Vercel, Cloudflare Pages, Netlify). Set `VITE_API_URL=https://<api-domain>/api`.
3. Set `CLIENT_URL=https://<client-domain>` on the server environment so CORS allows the web app.
4. Supply production `MONGODB_URI`, `JWT_SECRET`, Cloudinary credentials, and active LLM API keys.

---

### 4. Docker Deployment

AnchorAI provides Docker configurations for both multi-container orchestration and single-container full-stack deployments.

#### Option A: Docker Compose (Multi-Container: Frontend + Backend + MongoDB)

Runs MongoDB, the Express backend, and the Nginx-served frontend in isolated containers:

```bash
# 1. Start all services in the background
docker compose up -d --build

# 2. View streaming logs
docker compose logs -f

# 3. Stop all services
docker compose down
```

- **Frontend Client:** Available at `http://localhost` (or port specified via `CLIENT_PORT`)
- **Backend API:** Available at `http://localhost:5000`
- **MongoDB:** Available at `localhost:27017` (data persisted in `mongo_data` volume)

#### Option B: Unified Single-Container (Root Dockerfile)

Builds the entire application (frontend + backend) into a single container where Express serves both the API and SPA static assets. Ideal for single-port PaaS hosts (Render, Railway, Fly.io, Cloud Run):

```bash
# Build the unified image
docker build -t anchorai .

# Run container (pass your env variables)
docker run -p 5000:5000 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-jwt-secret" \
  -e OPENAI_API_KEY="your-openai-key" \
  anchorai
```

#### Option C: Standalone Client or Server Containers

Build and run individual microservice containers:

```bash
# Server only
docker build -t anchorai-server ./server
docker run -p 5000:5000 -e MONGODB_URI="..." -e JWT_SECRET="..." anchorai-server

# Client only (baked with API URL)
docker build --build-arg VITE_API_URL="https://api.yourdomain.com/api" -t anchorai-client ./client
docker run -p 80:80 anchorai-client
```


