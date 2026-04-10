# SupChat — Conversational Analytics

[![CI/CD](https://github.com/Heyyprakhar1/Supchat/actions/workflows/deploy.yml/badge.svg)](https://github.com/Heyyprakhar1/Supchat/actions/workflows/deploy.yml)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://hub.docker.com/u/heyyprakhar1)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)

Ask questions in plain English. Get SQL, tables, and charts back.

SupaChat sits on top of a PostgreSQL blog analytics database and converts natural language queries into SQL using a local Ollama LLM (no API key needed). Results come back as chatbot responses, data tables, or Recharts visualizations depending on what the question asks for.

```
"Show top trending topics in last 30 days"   →  bar chart
"Plot daily views trend for AI articles"      →  line chart
"Compare article engagement by topic"         →  table + chart
```

---

## Architecture

```
Browser
   │
   ▼
Nginx (port 80)
   ├── /        → Next.js frontend (port 3000)
   └── /api/    → FastAPI backend  (port 8000)
                        │
                        ├── Ollama (tinyllama, port 11434)
                        └── PostgreSQL (port 5432)

Monitoring
   ├── Prometheus  :9090
   ├── Grafana     :3001
   ├── Loki        :3100
   ├── cAdvisor    :9323
   └── Node Exporter :9100
```

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, React, Recharts, TailwindCSS |
| Backend | FastAPI, asyncpg, Ollama (tinyllama) |
| Database | PostgreSQL 15 |
| Infra | Docker, Docker Compose, Nginx |
| Cloud | AWS EC2 |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus, Grafana, Loki, Promtail, cAdvisor |
| Security | Gitleaks, Hadolint, Trivy |
| IaC | Terraform |

---

## Repo Structure

```
Supchat/
└── supachat/
    ├── apps/
    │   ├── api/               # FastAPI backend
    │   │   ├── main.py
    │   │   └── requirements.txt
    │   ├── web/               # Next.js frontend
    │   │   ├── app/
    │   │   │   ├── page.tsx
    │   │   │   └── layout.tsx
    │   │   ├── next.config.js
    │   │   └── package.json
    │   └── agent/             # DevOps agent (bonus)
    │       └── devops_agent.py
    ├── infra/
    │   ├── docker/
    │   │   ├── Dockerfile.api
    │   │   ├── Dockerfile.web
    │   │   └── docker-compose.yml
    │   ├── nginx/
    │   │   └── nginx.conf
    │   ├── monitoring/
    │   │   ├── prometheus.yml
    │   │   ├── loki-config.yml
    │   │   ├── promtail-config.yml
    │   │   └── grafana-dashboard.json
    │   ├── db/
    │   │   └── init.sql
    │   └── scripts/
    │       └── backup.sh
    └── terraform/
        └── main.tf
```

---

## CI/CD Pipeline

Every push to `main` triggers this pipeline automatically:

```
Push to main
     │
     ▼
Gitleaks          ← secret scanning across the full codebase
     │
     ▼
Hadolint (x2)     ← Dockerfile linting for api + web
     │
     ▼
Docker build      ← builds api + web images tagged :latest + :<git-sha>
     │
     ▼
Trivy scan (x2)   ← CVE scanning on both built images
     │
     ▼
Push to DockerHub ← heyyprakhar1/supchat-api, heyyprakhar1/supchat-web
     │
     ▼
SSH → EC2         ← docker compose pull + up -d --remove-orphans
```

Pipeline: `.github/workflows/deploy.yml`

DockerHub images:
- `heyyprakhar1/supchat-api:latest`
- `heyyprakhar1/supchat-web:latest`

---

## Local Development

**Prerequisites:** Docker, Docker Compose v2, Git

```bash
# 1. Clone
git clone https://github.com/Heyyprakhar1/Supchat.git
cd Supchat/supachat

# 2. Copy env
cp .env.example .env
# edit DATABASE_URL to point to your PostgreSQL instance

# 3. Start everything
docker compose -f infra/docker/docker-compose.yml up --build

# 4. Open http://localhost
```

API docs (Swagger) at `http://localhost:8000/docs`.

**Backend only:**

```bash
cd apps/api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend only:**

```bash
cd apps/web
npm install
npm run dev
# http://localhost:3000
```

---

## EC2 Deployment

**GitHub Secrets needed:**

| Secret | Value |
|---|---|
| `DOCKER_USERNAME` | `heyyprakhar1` |
| `DOCKER_PASSWORD` | DockerHub password or access token |
| `EC2_HOST` | EC2 public IP |
| `EC2_SSH_KEY` | Full private key contents |

Once secrets are set, every push to `main` deploys automatically.

**Manual first-time setup on EC2:**

```bash
ssh -i your-key.pem ubuntu@<EC2-IP>

# install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu && newgrp docker

# clone and run
git clone https://github.com/Heyyprakhar1/Supchat.git
cd Supchat/supachat/infra/docker
docker compose up -d
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://supachat:password123@db:5432/supachat_test

# MCP
MCP_SERVER_COMMAND=npx
MCP_SERVER_ARGS=-y @modelcontextprotocol/server-postgres

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Monitoring
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=changeme

# DevOps Agent (optional)
OPENAI_API_KEY=sk-...
```

Never commit `.env`. Use GitHub Secrets for CI/CD.

---

## API Reference

**Health check**
```
GET /api/health
```
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Natural language query**
```
POST /api/query
Content-Type: application/json

{ "question": "Show top trending topics in last 30 days" }
```
```json
{
  "sql": "SELECT topic, SUM(views) as total_views FROM articles WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY topic ORDER BY total_views DESC LIMIT 10",
  "data": [
    { "topic": "AI", "total_views": 45000 },
    { "topic": "DevOps", "total_views": 23000 }
  ],
  "chart_type": "bar",
  "explanation": "Top trending topics by views in the last 30 days",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Monitoring

| Service | URL | Login |
|---|---|---|
| App | `http://<EC2-IP>` | public |
| Grafana | `http://<EC2-IP>:3001` | admin / from .env |
| Prometheus | `http://<EC2-IP>:9090` | public |
| Health | `http://<EC2-IP>/api/health` | public |

Prometheus scrapes FastAPI metrics, cAdvisor container stats, and node-exporter host metrics. Logs flow from containers → Promtail → Loki → Grafana.

---

## Nginx

`infra/nginx/nginx.conf` handles:

- `/` → Next.js (port 3000)
- `/api/` → FastAPI (port 8000)
- gzip compression
- WebSocket support via `Upgrade` headers
- Rate limiting — 50 req/s frontend, 10 req/s API
- Security headers (X-Frame-Options, X-Content-Type-Options, XSS)

---

## Database Schema

```sql
CREATE TABLE articles (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    topic      VARCHAR(100) NOT NULL,
    views      INTEGER DEFAULT 0,
    likes      INTEGER DEFAULT 0,
    shares     INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Full schema + sample data in `infra/db/init.sql`.

---

## DevOps Agent (Bonus)

`apps/agent/devops_agent.py` — a small FastAPI service with three endpoints:

| Endpoint | What it does |
|---|---|
| `POST /agent/deploy` | Restarts or updates containers remotely |
| `POST /agent/analyze-logs` | GPT-4 log analysis with root cause + fix suggestion |
| `POST /agent/health-check` | Runs docker ps, df, free, curl health — returns overall status |

Requires `OPENAI_API_KEY` only for log analysis. The other two endpoints work without it.

---

## Terraform

Provisions EC2, VPC, security groups, and key pair.

```bash
cd supachat/terraform
terraform init
terraform plan -var="key_name=your-ec2-key"
terraform apply
```

---

## Troubleshooting

**Containers not starting**
```bash
docker compose logs -f api
docker compose logs -f web
```

**Database connection refused**
- Check `DATABASE_URL` has correct host/port
- Verify db container is healthy: `docker compose ps`

**Frontend can't reach API**
```bash
docker exec -it supachat-web wget -qO- http://api:8000/api/health
```

**Ollama slow on first query**
- Normal — first query loads the model (~30-60s)
- Falls back to hardcoded SQL patterns automatically if Ollama is unavailable

---

## AI Tools Used

| Tool | Used for |
|---|---|
| Claude | Architecture, CI/CD pipeline, Dockerfile fixes, debugging |
| Cursor | Code generation and refactoring |
| GitHub Copilot | Boilerplate completion |

---

## Author

**Prakhar Srivastava**
[LinkedIn](https://linkedin.com/in/heyyprakhar1) · [GitHub](https://github.com/Heyyprakhar1) · srivprak0106@gmail.com
