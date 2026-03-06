# Deployment Guide — Vercel + Backend Service

This guide covers deploying **CP-GPT** to production using Vercel for the frontend and a separate service for the backend.

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────────┐
│  Vercel         │         │  Backend Service     │
│  (Frontend)     │◄────────►│  (Railway/Render)    │
│  React + Vite   │ CORS     │  FastAPI + Python    │
└─────────────────┘         └──────────────────────┘
       ↓                            ↓
   Static Files               Database + Cache
                              (Neon DB + Redis)
```

---

## Part 1: Deploy Frontend to Vercel

### Prerequisites

- [Vercel Account](https://vercel.com)
- GitHub/GitLab/Bitbucket repository with your code
- Node.js 18+ installed locally

### Step 1: Push to Git Repository

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Create Vercel Project

1. Go to [dashboard.vercel.com/new](https://dashboard.vercel.com/new)
2. Import your repository
3. Vercel auto-detects your frontend setup
4. Click **Deploy**

### Step 3: Configure Environment Variables in Vercel

After deployment, go to **Project Settings** → **Environment Variables** and add:

```
VITE_API_BASE_URL = https://your-backend-api.example.com
```

Replace `https://your-backend-api.example.com` with your backend's actual URL (determined in Part 2).

**Redeploy** to apply the environment variable:
1. Go to **Deployments**
2. Click the three dots menu on the latest deploy
3. Select **Redeploy**

Your frontend should now be available at `https://your-project.vercel.app`

---

## Part 2: Deploy Backend to a Service

> **Note:** Vercel doesn't support Python serverless functions natively. Use one of the services below.

### Option A: Railway (Recommended)

Railway is the simplest for FastAPI + PostgreSQL + Redis.

#### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **Start New Project**
3. Select **GitHub Repo** (connect your repo)
4. Railway auto-detects `Dockerfile` in `backend/`

#### Step 2: Configure Railway Environment Variables

Go to **Variables** tab and add:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host/dbname
REDIS_URL=redis://your-redis-host:6379/0
SECRET_KEY=<generate-with-openssl-rand-hex-32>
GEMINI_API_KEY=<your-gemini-api-key>
CF_API_KEY=<optional>
CF_API_SECRET=<optional>
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://your-project.vercel.app
```

#### Step 3: Attach PostgreSQL & Redis

1. Click **+ New** in Railway project
2. Add **PostgreSQL** and **Redis** services
3. Railway auto-populates `DATABASE_URL` and `REDIS_URL`

#### Step 4: Deploy

Railway auto-deploys on every push. Your backend will be available at:
```
https://your-backend-service-{xxxx}.railway.app
```

---

### Option B: Render

Great for FastAPI with managed databases.

#### Step 1: Create Render Web Service

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name:** cp-gpt-backend
   - **Root Directory:** `backend`
   - **Runtime:** Python 3.11
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`

#### Step 2: Add Environment Variables

In Service Settings → **Environment**, add the same variables as Railway (see above).

#### Step 3: Create PostgreSQL & Redis on Render

1. Click **New +** → **PostgreSQL**
2. Click **New +** → **Redis**
3. Copy connection strings into Service environment variables

#### Step 4: Deploy

Render auto-deploys on push. Your backend will be at:
```
https://cp-gpt-backend.onrender.com
```

---

### Option C: Heroku (Dyno Plan Required)

> **Note:** Heroku's free tier ended. Requires paid dyno.

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. `heroku login`
3. `heroku create cp-gpt-backend`
4. `heroku config:set DATABASE_URL=<postgresql-url>`
5. `heroku config:set OTHER_VARS=...` (see environment variables above)
6. `git push heroku main`

---

## Part 3: Configure CORS on Backend

Update `backend/app/config.py` to allow your Vercel frontend URL:

```python
ALLOWED_ORIGINS: list[str] = [
    "http://localhost:5173",  # Local dev
    "http://localhost:3000",   # Local dev
    "https://your-project.vercel.app",  # Production frontend
]
```

Redeploy the backend after this change.

---

## Part 4: Database Setup

### PostgreSQL (via Neon DB)

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a database
3. Copy the connection string:
   ```
   postgresql+asyncpg://user:password@ep-xxx.neon.tech/dbname?sslmode=require
   ```
4. Add to backend environment variables as `DATABASE_URL`

### Run Migrations

After connecting PostgreSQL, run migrations on your backend service:

#### Railway / Render:
Use the **Terminal** to run:
```bash
alembic upgrade head
```

#### Local (if you want to pre-migrate):
```bash
export DATABASE_URL="your-production-db-url"
alembic upgrade head
```

---

## Part 5: Verify Deployment

### Test Frontend

1. Visit `https://your-project.vercel.app`
2. Try registering or logging in
3. Check browser DevTools → **Network** to ensure API calls go to your backend

### Test Backend Health

```bash
curl https://your-backend-service.{railway|render|heroku}.com/health
```

Should return HTTP 200.

### Test API Endpoint

```bash
curl -X GET https://your-backend-service/api/v1/problems?page=1&limit=10
```

---

## Part 6: Post-Deployment Checklist

- [ ] Frontend deploys and loads without errors
- [ ] API base URL is set correctly in Vercel env vars
- [ ] Backend is running and accessible
- [ ] CORS is configured on backend for Vercel domain
- [ ] Database migrations are up-to-date
- [ ] Redis connection works (if using caching)
- [ ] Gemini API key is set on backend
- [ ] Users can register and log in
- [ ] AI coaching feature works (if enabled)
- [ ] Codeforces sync is running (check logs)

---

## Common Issues & Fixes

### "CORS Error: Cannot POST /api/v1/auth/login"

**Cause:** `ALLOWED_ORIGINS` doesn't include your Vercel domain.

**Fix:**
1. Update `backend/app/config.py`
2. Add your Vercel URL: `https://your-project.vercel.app`
3. Redeploy backend

---

### "VITE_API_BASE_URL is undefined"

**Cause:** Environment variable not set in Vercel.

**Fix:**
1. Go to Vercel Project Settings → **Environment Variables**
2. Add `VITE_API_BASE_URL=https://your-backend-url`
3. **Redeploy** the project

---

### Database Connection Timeout

**Cause:** Backend can't reach PostgreSQL.

**Fix:**
1. Verify `DATABASE_URL` is correct
2. Check if database accepts connections from your backend's region
3. For Neon DB: enable **Allow Passwordless Auth** in settings

---

### Redis Connection Issues

**Cause:** Backend can't reach Redis.

**Fix:**
1. Use **managed Redis** (Railway Redis, Render Redis, or Redis Cloud)
2. Update `REDIS_URL` environment variable
3. Some services provide **connection pooling** settings

---

## Local Development

To develop with the remote backend:

```bash
# In frontend/ directory
VITE_API_BASE_URL=https://your-backend-url npm run dev
```

Or update `frontend/.env`:
```env
VITE_API_BASE_URL=https://your-backend-api.example.com
```

---

## Troubleshooting Logs

### Railway
Go to **Logs** tab in your service.

### Render
Go to **Logs** → **Web Service Logs**.

### Heroku
```bash
heroku logs --tail
```

---

## Next Steps

1. Set up monitoring & alerts (Sentry, Datadog, etc.)
2. Add SSL/TLS certificate (automatic with Vercel & managed services)
3. Set up CI/CD for automated testing
4. Monitor database usage and optimize queries
5. Consider adding a CDN for static assets

---

## Reference

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/concepts/)
