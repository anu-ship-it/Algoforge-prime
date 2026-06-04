# AlgoForge Prime — AI Mock Interview Platform

A full-stack AI-powered coding interview platform. An AI interviewer powered by **Llama 3 (local, free)** asks follow-ups based on your actual code, challenges your complexity claims, and generates a full debrief report after every session.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, Monaco Editor |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL 16 |
| Cache / Session | Redis 7 |
| AI Interviewer | Ollama + Llama 3 (local, free) |
| Code Execution | Judge0 (self-hosted, sandboxed) |
| Proxy | Nginx |
| Container | Docker Compose |

---

## Prerequisites

- Docker + Docker Compose installed
- 8GB+ RAM (Llama 3 needs ~5GB)
- 10GB+ free disk space (model weights)

---

## Quick Start

```bash
# 1. Clone / enter the project
cd algoforge-prime

# 2. Start everything
docker compose up --build

# First boot takes 5–10 minutes:
# - Pulls all Docker images
# - Downloads Llama 3 model (~4.7GB) via Ollama
# - Runs DB migrations and seeds problems

# 3. Open the app
open http://localhost:3000
```

---

## Services & Ports

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Nginx (unified) | http://localhost:80 |
| Judge0 | http://localhost:2358 |
| Ollama | http://localhost:11434 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Architecture

```
Browser
  │
  ├── HTTP/REST ──► Nginx ──► Next.js (port 3000)
  │                      └──► Express API (port 4000)
  │
  └── WebSocket ──────────► Socket.io (port 4000)
                                 │
                          ┌──────┴──────┐
                          ▼             ▼
                       Ollama        Judge0
                     (Llama 3)   (code sandbox)
                          │             │
                          └──────┬──────┘
                                 ▼
                           PostgreSQL + Redis
```

### How the interview loop works

1. User starts a session → backend creates a session record, builds the interviewer system prompt, stores it in Redis
2. User types a message → Socket.io emits `candidate_message` with their current code snapshot
3. Backend injects code snapshot into LLM context, calls Ollama `/api/chat`
4. Ollama responds in character → stored in DB, emitted back via socket
5. Every 30s: Monaco editor auto-snapshots code to Redis
6. Session ends → backend triggers debrief generation via Ollama
7. Debrief stored in PostgreSQL, rendered on `/debrief/[id]`

---

## Environment Variables

Backend (set in `docker-compose.yml`):

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | postgres://... | PostgreSQL connection string |
| `REDIS_URL` | redis://... | Redis connection string |
| `OLLAMA_URL` | http://ollama:11434 | Ollama service URL |
| `JUDGE0_URL` | http://judge0:2358 | Judge0 service URL |
| `JWT_SECRET` | change_in_prod | JWT signing secret |
| `JWT_REFRESH_SECRET` | change_in_prod | Refresh token secret |

---

## Supported Languages

JavaScript, Python, Java, C++, C, Go, Rust, TypeScript, Ruby, Swift, Kotlin

---

## Interviewer Personas

| Persona | Style |
|---|---|
| Generic | Professional, balanced |
| Google | Scalability-focused, pushes for optimal |
| Amazon | Edge cases, operational thinking |
| Meta | Fast-paced, expects optimal fast |
| Microsoft | Collaborative, design-focused |

---

## Development

```bash
# Rebuild a single service
docker compose up --build backend

# View logs
docker compose logs -f backend
docker compose logs -f ollama

# Shell into backend
docker compose exec backend sh

# Reset DB (wipes all data)
docker compose down -v
docker compose up --build
```

---

## Adding Problems

Insert directly into PostgreSQL:

```sql
INSERT INTO problems (title, slug, description, difficulty, topic, company_tags, starter_code, test_cases, constraints, hints)
VALUES (
  'My Problem',
  'my-problem',
  'Problem description here.',
  'medium',
  'graphs',
  ARRAY['google'],
  '{"javascript": "function solve(n) {\n  // your code\n}"}',
  '[{"input": {"n": 5}, "expected": 10}]',
  '1 <= n <= 1000',
  ARRAY['Think BFS', 'Use a visited set']
);
```

---

## Production Notes

Before deploying:
1. Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to random 64-char strings
2. Change all database passwords
3. Enable HTTPS in Nginx config
4. Set `NODE_ENV=production`
5. Consider Ollama GPU support for faster inference (`--gpus all` in compose)
