# AnchorAI — AI-Powered Adaptive Study Companion

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Vector_Search-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/products/platform/atlas-vector-search)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**AnchorAI** is an intelligent, full-stack learning workspace that transforms lecture slides, course syllabi, textbooks, and handwritten notes into an interactive, grounded AI study companion.

Unlike generic AI chatbots that hallucinate or guess, AnchorAI combines **high-precision Retrieval-Augmented Generation (RAG)** with deterministic page-level citations, a dual-layer refusal architecture, adaptive diagnostic quizzes, and rolling topic mastery analytics.

---

## 📑 Table of Contents

- [Key Features & Core Capabilities](#-key-features--core-capabilities)
- [How It Works: Technical Deep Dive](#-how-it-works-technical-deep-dive)
  - [1. Two-Stage Grounded RAG & Sentinel Fallback](#1-two-stage-grounded-rag--sentinel-fallback)
  - [2. Hybrid Document Ingestion & Tiered OCR](#2-hybrid-document-ingestion--tiered-ocr)
  - [3. Synthetic AI Study Primers](#3-synthetic-ai-study-primers)
  - [4. Diagnostic Quizzes & Topic Mastery Tracking](#4-diagnostic-quizzes--topic-mastery-tracking)
- [Architecture & Directory Structure](#️-architecture--directory-structure)
- [Technology Stack](#️-technology-stack)
- [MongoDB Atlas Vector Search Setup](#-mongodb-atlas-vector-search-setup)
- [Security & Production Hardening](#-security--production-hardening)
- [Environment Variables Reference](#️-environment-variables-reference)
- [Getting Started & Local Development](#-getting-started--local-development)
- [Docker Deployment](#-docker-deployment)
- [Production Deployment Guide](#-production-deployment-guide)
- [REST API Reference](#-rest-api-reference)
- [Credits & Acknowledgments](#-credits--acknowledgments)
- [License](#-license)

---

## 🌟 Key Features & Core Capabilities

### 🔍 Grounded RAG Chat Engine (Zero Hallucination)
- **Strict Vector Retrieval:** Powered by **MongoDB Atlas Vector Search** with 1536-dimensional embeddings (and an automatic in-memory cosine fallback for local/offline environments).
- **Two-Stage Refusal with Sentinel Signal:** When course materials do not contain the answer, AnchorAI triggers an explicit sentinel signal (`[[NOT_IN_NOTES]]`), preventing the LLM from fabricating false information.
- **Academic Fallback & Dynamic Note Appending:** If a question falls outside uploaded documents, the tutor switches to general knowledge mode and offers an **"Append to Study Guide"** action, allowing students to seamlessly integrate new concepts into their indexed library.
- **Verifiable Page Citations:** Every grounded response cites exact source page numbers and chunk similarity scores that can be clicked to inspect original excerpts.

### 📑 Hybrid Document Ingestion & Tiered OCR
- **Multi-Format Support:** Ingests digital PDFs, scanned slide decks, handwritten notes, and image snapshots (`.pdf`, `.png`, `.jpg`, `.jpeg`).
- **Cost-Optimized Tiered OCR:**
  1. **Tier 1 (Tesseract.js Wasm):** Fast, local WebAssembly OCR at $0 API cost for standard printed and legible text.
  2. **Tier 2 (GPT-4o Vision):** Automatically triggered when OCR confidence drops below 60%, delivering transcription accuracy on complex handwriting.
- **Accurate Token Chunking:** Uses OpenAI's `cl100k_base` tokenizer (`js-tiktoken`) to produce ~400-token chunks with a 50-token sliding boundary overlap to prevent loss of context across page boundaries.
- **Asynchronous Ingestion Pipeline:** Document processing runs in the background with soft-delete safeguards (`isDeleted`), ensuring long extractions never block the HTTP thread or create orphaned chunks.

### 🧪 Synthetic Study Primers
- Generate comprehensive, structured **AI Study Primers** on any topic before materials are distributed.
- Primers automatically include core definitions, theoretical mechanisms, real-world examples, and common pitfalls—indexed and ready for interactive RAG chat.

### 🎯 Adaptive Quizzes & Mastery Analytics
- **Anti-Cheat Server Evaluation:** Answer keys are stripped before sending quizzes to the client, preventing inspection through browser DevTools.
- **Rolling Window Mastery Algorithm:** Tracks student competency per topic tag using a deterministic 5-attempt sliding window ($Mastery = \frac{\text{Correct in last 5}}{\text{Total in last 5}}$), completely immune to state drift.
- **Targeted Practice Generator:** Identifies topics with mastery scores below 75% and auto-synthesizes tailored practice assessments to reinforce weak areas.
- **High-Performance Aggregations:** MongoDB `$facet` pipelines compute user statistics, subject breakdown, and recent attempts in a single database round-trip.

---

## 🔬 How It Works: Technical Deep Dive

### 1. Two-Stage Grounded RAG & Sentinel Fallback

Standard RAG implementations often suffer from hallucination when retrieved chunks are marginally similar but do not actually contain the answer. AnchorAI implements a strict two-stage verification pipeline:

```
User Query
    │
    ▼
Generate 1536-dim Embedding (text-embedding-3-small)
    │
    ▼
MongoDB Atlas $vectorSearch (Filter by userId & documentId)
    │
    ├── Top Score < 0.35 ──────────► [Stage 1 Trigger: below_threshold]
    │                                          │
    ▼ Top Score >= 0.35                         ▼
Prompt LLM with Document Excerpts        General Knowledge Fallback Mode
    │                                          │
    ├── LLM returns "[[NOT_IN_NOTES]]" ───────► (Label clearly + offer
    │   [Stage 2 Trigger: llm_not_in_notes]     "Append to Study Guide")
    ▼
Verified Grounded Answer with Page Citations
```

1. **Stage 1 (Similarity Gate):** If the highest cosine similarity score among retrieved chunks falls below `0.35`, the query immediately enters the fallback workflow without prompting grounded generation.
2. **Stage 2 (Sentinel Gate):** If similarity passes the threshold, the LLM is instructed under a strict system prompt: if the answer is not explicitly stated in the retrieved excerpts, it must reply *only* with the sentinel token `[[NOT_IN_NOTES]]`.
3. **Seamless Transition:** The server intercepts `[[NOT_IN_NOTES]]`, logs the fallback trigger for observability, and requests a structured general knowledge explanation with clear labeling.

### 2. Hybrid Document Ingestion & Tiered OCR

```
File Upload (PDF / Image)
    │
    ├── Digital PDF ──► pdf-parse extraction
    │
    └── Image / Scanned Page ──► Tesseract.js WebAssembly OCR
                                      │
                                      ├── Confidence >= 60% ──► Use OCR Text
                                      │
                                      └── Confidence < 60% ──► Escalate to GPT-4o Vision
    │
    ▼
js-tiktoken (cl100k_base) ~400 Token Chunking + 50 Token Overlap
    │
    ▼
Batch Embeddings (text-embedding-3-small)
    │
    ▼
MongoDB chunks Collection (Soft-delete & userId ownership validated)
```

### 3. Synthetic AI Study Primers

When students need to study a subject before official course slides are available, AnchorAI synthesizes a structured academic primer using the active LLM (`llama-3.3-70b` on Groq or `gpt-4o-mini` on OpenAI). The generated primer is tokenized, embedded, and stored as a first-class document in the user's library, unlocking full RAG Q&A and quiz generation.

### 4. Diagnostic Quizzes & Topic Mastery Tracking

Mastery is computed deterministically across historical attempts rather than relying on an incrementing counter:

$$\text{Mastery}(\text{tag}) = \frac{\sum_{i=1}^{\min(N, 5)} \text{correct}_i}{\sum_{i=1}^{\min(N, 5)} \text{total}_i} \times 100$$

- **Sliding Window:** Only the last 5 attempts per topic are counted, ensuring that recent improvement is accurately reflected.
- **Weak Topic Detection:** Tags with mastery under 75% are highlighted on the dashboard with a single-click action to spawn a targeted quiz.
- **Cascade Recalculation:** Deleting a document or quiz automatically triggers a full recalculation of topic mastery scores, maintaining zero-drift database integrity.

---

## 🏗️ Architecture & Directory Structure

```text
AnchorAI/
├── client/                     # Frontend SPA (Vite + React 19 + TypeScript)
│   ├── src/
│   │   ├── components/         # Modular UI components (Chat, Quizzes, Primers, Citations)
│   │   ├── pages/              # Landing, Auth, Dashboard, and Document views
│   │   ├── hooks/              # Custom React hooks (useAuth, etc.)
│   │   ├── lib/                # API client, auth token storage, and formatting utilities
│   │   └── types/              # Client-side TypeScript definitions
│   ├── nginx.conf              # Production Nginx SPA reverse-proxy configuration
│   ├── Dockerfile              # Multi-stage Nginx container build
│   ├── vercel.json             # Vercel SPA routing rewrite rules
│   ├── .env.example
│   └── package.json
│
├── server/                     # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/             # Typed environment parsing & MongoDB connection
│   │   ├── controllers/        # Request handling and HTTP orchestration
│   │   ├── middleware/         # Auth, rate-limiting, error handling & Multer upload
│   │   ├── models/             # Mongoose schemas (User, Document, Chunk, Quiz, Attempt)
│   │   ├── routes/             # Express REST API routes
│   │   ├── services/           # RAG, LLM, Embedding, OCR, Quiz & Analytics services
│   │   └── utils/              # Cosine similarity, errors, and mastery calculators
│   ├── scripts/                # Database maintenance and cascade verification utilities
│   ├── uploads/                # Local file storage fallback (.gitkeep preserved)
│   ├── Dockerfile              # Multi-stage Node.js container build
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml          # Multi-container orchestration (Mongo 7 + Node + Nginx)
├── Dockerfile                  # Unified single-container deployment (Full-Stack)
├── LICENSE                     # MIT License
├── .dockerignore
├── .gitignore
├── .prettierrc
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Client Frontend** | React 19, TypeScript, Vite, TailwindCSS v4, Lucide Icons, Satoshi & IBM Plex typography |
| **Server Backend** | Node.js, Express, TypeScript (strict mode), Mongoose, Zod |
| **Database & Vector Search** | MongoDB Atlas, Atlas Vector Search, In-Memory Cosine Vector fallback |
| **LLM Inference** | **Groq** (Llama-3.3-70B, GPT-OSS-120B) & **OpenAI** (GPT-4o-mini, GPT-4o Vision) |
| **Embeddings** | OpenAI `text-embedding-3-small` (1536 dimensions) |
| **Document Processing** | `pdf-parse`, `tesseract.js` (Wasm OCR), `js-tiktoken` (`cl100k_base` BPE), Cloudinary |
| **Security & Hardening** | Helmet, Express Rate Limit, JWT, bcrypt (cost factor 12), Timing-safe login |
| **DevOps & Containers** | Docker, Docker Compose, Nginx, Vercel, Render |

---

## 🔍 MongoDB Atlas Vector Search Setup

For production semantic search, AnchorAI utilizes **MongoDB Atlas Vector Search**.

### 1. Create the Vector Search Index in Atlas
1. In the MongoDB Atlas Web Console, navigate to your cluster.
2. Select the **Atlas Search** or **Vector Search** tab.
3. Click **Create Search Index** ➔ Select **JSON Editor**.
4. Select database `anchor_ai` (or your configured database name) and collection `chunks`.
5. Enter index name: `vector_index`.
6. Paste the following index definition:

```json
{
  "name": "vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 1536,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "userId"
      },
      {
        "type": "filter",
        "path": "documentId"
      }
    ]
  }
}
```

7. Click **Create Vector Search Index**.

> [!NOTE]
> **Automatic Local Fallback:**
> If you are running a local MongoDB instance without Atlas Search, AnchorAI automatically falls back to an exact in-memory cosine similarity search over your document chunks. No configuration change is required.

---

## 🔒 Security & Production Hardening

- **Fail-Fast Startup Validation:** The backend validates critical environment variables at boot (`validateEnv()`). If `JWT_SECRET`, `MONGODB_URI`, or the active LLM key is missing, the server halts immediately with an explicit error.
- **Granular Rate Limiting:**
  - *Authentication:* 10 requests / 15 minutes per IP (`authRateLimiter`) to prevent brute-force attacks.
  - *RAG Chat & Primers:* 30 requests / 15 minutes per user (`chatRateLimiter`, `primerRateLimiter`) to protect API quotas.
  - *General API:* 100 requests / 15 minutes per IP (`generalRateLimiter`).
- **Timing-Safe Authentication:** Constant-time bcrypt execution with a dummy hash prevents user enumeration through response-timing side channels.
- **HTTP Security Headers:** Configured via `helmet` (CSP, HSTS, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`).
- **Strict Payload Limits:** JSON body parser strictly capped at `1mb` to defend against memory exhaustion and payload-based DoS.
- **Data Isolation:** Every database query, vector search pipeline, and chunk retrieval strictly enforces `userId` scoping to prevent unauthorized cross-tenant data access.

---

## ⚙️ Environment Variables Reference

### Client Environment (`client/.env`)

| Variable | Description | Example / Default | Required |
|---|---|---|:---:|
| `VITE_API_URL` | Base URL of the backend API (must include `/api`) | `http://localhost:5000/api` | **Yes** |

### Server Environment (`server/.env`)

| Variable | Description | Default | Required in Production |
|---|---|---|:---:|
| `PORT` | API server port | `5000` | No |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` | **Yes** |
| `CLIENT_URL` | Allowed client origin for Express CORS whitelist | `http://localhost:5173` | **Yes** |
| `MONGODB_URI` | MongoDB connection string (Atlas or local instance) | `mongodb://localhost:27017/anchor_ai` | **Yes** |
| `JWT_SECRET` | Cryptographically random secret for signing JWTs | *(none)* | **Yes** |
| `JWT_EXPIRES_IN` | JWT token lifetime | `7d` | No |
| `LLM_PROVIDER` | Active LLM inference provider (`groq` or `openai`) | `groq` | **Yes** |
| `GROQ_API_KEY` | Groq API Key | *(none)* | **Yes** (if `LLM_PROVIDER=groq`) |
| `GROQ_MODEL` | Groq model identifier | `llama-3.3-70b-versatile` | No |
| `OPENAI_API_KEY` | OpenAI API Key (used for embeddings & vision OCR) | *(none)* | **Yes** |
| `CLOUDINARY_*` | Cloudinary credentials for permanent PDF storage | *(empty for local storage)* | Recommended |

> [!WARNING]
> **Production CORS Guard (`CLIENT_URL`):**
> `CLIENT_URL` must match your production frontend URL exactly (e.g., `https://anchorai.vercel.app`) with **no trailing slash**. Mismatched origins will be rejected by the CORS security layer.

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js** 20+ installed
- **MongoDB** instance (local community edition or free MongoDB Atlas cluster)
- **Groq API key** (free tier available at [console.groq.com](https://console.groq.com))
- **OpenAI API key** (for 1536-dim embeddings via `text-embedding-3-small`)

### 1. Clone & Configure

```bash
git clone https://github.com/ombiswas/AnchorAI.git
cd AnchorAI
```

### 2. Configure Backend Server

```bash
cd server
cp .env.example .env
# Edit .env with your MONGODB_URI, JWT_SECRET, GROQ_API_KEY, and OPENAI_API_KEY
npm install
npm run dev
```

*Server will start on `http://localhost:5000`.*

### 3. Configure Frontend Client

In a separate terminal window:

```bash
cd client
cp .env.example .env
# Verify VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

*Client will start on `http://localhost:5173`.*

---

## 🐳 Docker Deployment

AnchorAI provides complete container configurations for both multi-container local clusters and single-port cloud PaaS deployments.

### Option A: Docker Compose (Full Stack)

Deploys MongoDB 7, the Express API, and the Nginx frontend in isolated bridge containers:

```bash
# Start all containers in detached mode
docker compose up -d --build

# Inspect running logs
docker compose logs -f

# Shut down stack
docker compose down
```

- **Frontend Client:** `http://localhost` (or specified via `CLIENT_PORT`)
- **Backend API:** `http://localhost:5000`
- **MongoDB:** `localhost:27017` (data persisted in Docker volume `mongo_data`)

### Option B: Single Full-Stack Container (Root `Dockerfile`)

Builds both the React SPA and Express API into a single image where Node.js serves both API endpoints and static assets. Ideal for single-port hosts like **Render**, **Railway**, or **Fly.io**:

```bash
# Build unified image
docker build -t anchorai .

# Run container
docker run -p 5000:5000 \
  -e MONGODB_URI="your-mongodb-connection-string" \
  -e JWT_SECRET="your-jwt-secret" \
  -e LLM_PROVIDER="groq" \
  -e GROQ_API_KEY="your-groq-key" \
  -e OPENAI_API_KEY="your-openai-key" \
  anchorai
```

---

## 🌐 Production Deployment Guide

The recommended architecture couples a **Vercel** client with a **Render / Railway** backend:

### Step 1: Deploy Backend to Render

1. Create a new **Web Service** on [Render](https://render.com) linked to your repository.
2. Configuration:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: *Your MongoDB Atlas connection URI*
   - `JWT_SECRET`: *A secure random 64+ char string*
   - `LLM_PROVIDER`: `groq`
   - `GROQ_API_KEY`: *Your Groq API key*
   - `OPENAI_API_KEY`: *Your OpenAI API key*
   - `CLIENT_URL`: `https://your-app.vercel.app` *(update once frontend is deployed)*

### Step 2: Deploy Frontend to Vercel

1. Create a **New Project** on [Vercel](https://vercel.com) from the same repository.
2. Configuration:
   - **Root Directory:** `client` (Click Edit)
   - **Framework Preset:** `Vite`
3. Environment Variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
4. Deploy!

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

| Endpoint | Method | Auth | Description |
|---|---|:---:|---|
| `/api/auth/signup` | `POST` | No | Register a new user account |
| `/api/auth/login` | `POST` | No | Authenticate user with timing-safe check |
| `/api/auth/me` | `GET` | Yes | Get currently authenticated user profile |
| `/api/auth/account` | `DELETE` | Yes | Permanently delete account and all user data |
| `/api/documents/upload` | `POST` | Yes | Upload document (PDF/Image) for async ingestion |
| `/api/documents/primer` | `POST` | Yes | Generate an AI study primer from a topic |
| `/api/documents` | `GET` | Yes | List active documents with processing statuses |
| `/api/documents/:id` | `GET` | Yes | Retrieve document metadata and excerpts |
| `/api/documents/:id` | `DELETE` | Yes | Delete document (`?preserveHistory=true` supported) |
| `/api/documents/:id/reprocess` | `POST` | Yes | Retry processing for a failed document |
| `/api/documents/:id/append` | `POST` | Yes | Append fallback concept to document guide |
| `/api/chat/:documentId` | `POST` | Yes | Grounded RAG Q&A with two-stage fallback |
| `/api/quiz/generate` | `POST` | Yes | Generate diagnostic quiz from document chunks |
| `/api/quiz/submit` | `POST` | Yes | Submit attempt for server-side evaluation |
| `/api/analytics/dashboard` | `GET` | Yes | Retrieve rolling mastery & weak topic diagnostics |
| `/health` | `GET` | No | Server health and liveness probe |

---

## 👥 Credits & Acknowledgments

**AnchorAI** was architected and developed by **[Om Biswas](https://github.com/ombiswas)**.

Special thanks to the open-source projects, tools, and platforms that power AnchorAI:

- **AI & Inference:** [Groq](https://groq.com/) for ultra-fast LPU inference & [OpenAI](https://openai.com/) for embeddings and vision OCR.
- **Vector Search:** [MongoDB Atlas Vector Search](https://www.mongodb.com/products/platform/atlas-vector-search) for managed cloud vector retrieval.
- **Document Processing:** [Tesseract.js](https://tesseract.projectnaptha.com/) for client/server WebAssembly OCR & [js-tiktoken](https://github.com/dqbd/tiktoken) for OpenAI BPE tokenization.
- **Typography:** [Fontshare](https://www.fontshare.com/) for **Satoshi** & [Google Fonts](https://fonts.google.com/) for **IBM Plex Sans** and **IBM Plex Mono**.
- **Icons & UI:** [Lucide Icons](https://lucide.dev/) & [Heroicons](https://heroicons.com/).

---

## 📄 License

This project is open-source and licensed under the **[MIT License](LICENSE)**.
