# 🗨️ SupChat — Conversational Analytics

<div align="center">

[![CI/CD](https://github.com/Heyyprakhar1/Supchat-analytics/actions/workflows/deploy.yml/badge.svg)](https://github.com/Heyyprakhar1/Supchat-analytics/actions/workflows/deploy.yml)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://hub.docker.com/u/heyyprakhar1)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?style=flat&logo=amazonaws&logoColor=white)](https://aws.amazon.com/ec2/)
[![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat&logo=grafana&logoColor=white)](https://grafana.com/)

**Ask questions in plain English. Get SQL, tables, and charts back — instantly.**

*No API key needed. Runs fully local with Ollama (tinyllama).*

</div>

---

## ✨ What is SupChat?

SupChat sits on top of a PostgreSQL blog analytics database and converts **natural language → SQL → visualizations** using a local LLM. Just type what you want to know, and SupChat figures out the query, runs it, and returns the best visual format automatically.

```
💬 "Show top trending topics in last 30 days"   →  📊 bar chart
💬 "Plot daily views trend for AI articles"      →  📈 line chart  
💬 "Compare article engagement by topic"         →  📋 table + chart
```

---

## 🏗️ Architecture

```
Browser
   │
   ▼
Nginx (port 80)
   ├── /        → Next.js frontend  (port 3000)
   └── /api/    → FastAPI backend   (port 8000)
                        │
                        ├── Ollama tinyllama  (port 11434)
                        └── PostgreSQL 15     (port 5432)

Monitoring Stack
   ├── Prometheus    :9090   ← metrics scraping
   ├── Grafana       :3001   ← dashboards
   ├── Loki          :3100   ← log aggregation
   ├── Promtail              ← log shipping
   ├── cAdvisor      :9323   ← container metrics
   └── Node Exporter :9100   ← host metrics
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React, Recharts, TailwindCSS |
| **Backend** | FastAPI, asyncpg, Ollama (tinyllama) |
| **Database** | PostgreSQL 15 |
| **Infra** | Docker, Docker Compose, Nginx |
| **Cloud** | AWS EC2 |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Prometheus, Grafana, Loki, Promtail, cAdvisor |
| **Security** | Gitleaks, Hadolint, Trivy |
| **IaC** | Terraform |

---

## 🔁 CI/CD Pipeline

Every push to `main` triggers the full pipeline automatically:

```
git push → main
      │
      ▼
  Gitleaks              ← 🔐 secret scanning
      │
      ▼
  Hadolint (×2)         ← 🐳 Dockerfile linting (api + web)
      │
      ▼
  Docker Build (×2)     ← 🔨 tagged :latest + :<git-sha>
      │
      ▼
  Trivy Scan (×2)       ← 🛡️ CVE scanning CRITICAL/HIGH
      │
      ▼
  Push → DockerHub      ← 📦 heyyprakhar1/supchat-api & web
      │
      ▼
  SSH → EC2             ← 🚀 git reset --hard + compose up
```

> Pipeline config: `.github/workflows/deploy.yml`

DockerHub images:
- [`heyyprakhar1/supchat-api:latest`](https://hub.docker.com/r/heyyprakhar1/supchat-api)
- [`heyyprakhar1/supchat-web:latest`](https://hub.docker.com/r/heyyprakhar1/supchat-web)

---

## 📁 Repo Structure

```
supchat-analytics/
└── supachat/
    ├── apps/
    │   ├── api/                    # FastAPI backend
    │   │   ├── main.py
    │   │   └── requirements.txt
    │   ├── web/                    # Next.js frontend
    │   │   ├── app/
    │   │   │   ├── page.tsx
    │   │   │   └── layout.tsx
    │   │   ├── next.config.js
    │   │   └── package.json
    │   └── agent/                  # DevOps agent
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

## 🚀 Quick Start (Local)

**Prerequisites:** Docker, Docker Compose v2, Git

```bash
# 1. Clone the repo
git clone https://github.com/Heyyprakhar1/Supchat-analytics.git
cd Supchat-analytics/supachat

# 2. Set up environment
cp .env.example .env
# Edit DATABASE_URL and other variables as needed

# 3. Start all services
docker compose -f infra/docker/docker-compose.yml up --build

# 4. Open the app
# App:     http://localhost
# Swagger: http://localhost:8000/docs
# Grafana: http://localhost:3001
```

<details>
<summary><b>Run backend only</b></summary>

```bash
cd apps/api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
</details>

<details>
<summary><b>Run frontend only</b></summary>

```bash
cd apps/web
npm install
npm run dev
# http://localhost:3000
```
</details>

---

## ☁️ EC2 Deployment

### 1. Set GitHub Secrets

| Secret | Description |
|---|---|
| `DOCKER_USERNAME` | Your DockerHub username |
| `DOCKER_PASSWORD` | DockerHub password or access token |
| `EC2_HOST` | EC2 public IP address |
| `EC2_SSH_KEY` | Full private key contents (PEM) |

### 2. First-time EC2 Setup

```bash
ssh -i your-key.pem ubuntu@<EC2-IP>

# Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu && newgrp docker

# Clone and start
git clone https://github.com/Heyyprakhar1/Supchat-analytics.git
cd Supchat-analytics/supachat/infra/docker
docker compose up -d
```

After this, every push to `main` deploys automatically. ✅

---

## 🔌 API Reference

### Health Check
```http
GET /api/health
```
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Natural Language Query
```http
POST /api/query
Content-Type: application/json
```
```json
{ "question": "Show top trending topics in last 30 days" }
```
**Response:**
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

## 📊 Monitoring

| Service | URL | Access |
|---|---|---|
| App | `http://<EC2-IP>` | Public |
| Grafana | `http://<EC2-IP>:3001` | admin / `.env` |
| Prometheus | `http://<EC2-IP>:9090` | Public |
| Health API | `http://<EC2-IP>/api/health` | Public |

Prometheus scrapes FastAPI metrics, cAdvisor container stats, and node-exporter host metrics. Logs flow: `containers → Promtail → Loki → Grafana`.

---

## 🗄️ Database Schema

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

Full schema + seed data in `infra/db/init.sql`.

---

## 🌐 Nginx

`infra/nginx/nginx.conf` handles routing and hardening:

- `/` → Next.js (port 3000)
- `/api/` → FastAPI (port 8000)
- Gzip compression
- WebSocket support (`Upgrade` headers)
- Rate limiting — 50 req/s frontend, 10 req/s API
- Security headers — `X-Frame-Options`, `X-Content-Type-Options`, XSS protection

---

## 🤖 DevOps Agent *(Bonus)*

`apps/agent/devops_agent.py` — an autonomous ops agent with three endpoints:

| Endpoint | What it does |
|---|---|
| `POST /agent/deploy` | Restarts or updates containers remotely |
| `POST /agent/analyze-logs` | GPT-4 log analysis — root cause + fix suggestion |
| `POST /agent/health-check` | Runs `docker ps`, `df`, `free`, `curl health` — returns overall status |

> `OPENAI_API_KEY` required only for log analysis. Other endpoints work without it.

---

## 🏗️ Terraform

Provisions EC2, VPC, security groups, and key pair on AWS.

```bash
cd supachat/terraform
terraform init
terraform plan -var="key_name=your-ec2-key"
terraform apply
```

---

## 🔧 Troubleshooting

<details>
<summary><b>Containers not starting</b></summary>

```bash
docker compose logs -f api
docker compose logs -f web
```
</details>

<details>
<summary><b>Database connection refused</b></summary>

- Verify `DATABASE_URL` has the correct host/port
- Check db container is healthy: `docker compose ps`
</details>

<details>
<summary><b>Frontend can't reach API</b></summary>

```bash
docker exec -it supachat-web wget -qO- http://api:8000/api/health
```
</details>

<details>
<summary><b>EC2 not reflecting latest changes after push</b></summary>

```bash
cd /opt/Supchat/supachat
git fetch origin
git reset --hard origin/main
git clean -fd
cd infra/docker
docker compose pull
docker compose up -d --remove-orphans
```
</details>

<details>
<summary><b>Ollama slow on first query</b></summary>

Normal behaviour — first query loads the model (~30–60s). Falls back to hardcoded SQL patterns automatically if Ollama is unavailable.
</details>

---

## 🛠️ Environment Variables

```bash
# Database
DATABASE_URL=postgresql://supachat:YOUR_PASSWORD@db:5432/supachat_db

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Monitoring
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=YOUR_GRAFANA_PASSWORD

# DevOps Agent (optional)
OPENAI_API_KEY=sk-...
```

> ⚠️ Never commit `.env` to git. Use GitHub Secrets for CI/CD.

---

## 🤝 AI Tools Used

| Tool | Used for |
|---|---|
| Claude | Architecture design, CI/CD pipeline, Dockerfile fixes, debugging |
| Cursor | Code generation and refactoring |
| GitHub Copilot | Boilerplate completion |

---

## 👤 Author

**Prakhar Srivastava**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/heyyprakhar1)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/Heyyprakhar1)
[![Email](https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white)](mailto:srivprak0106@gmail.com)

---

<div align="center">

⭐ **If this project helped you, consider giving it a star!** ⭐

</div>
