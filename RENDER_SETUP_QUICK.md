# Render Deployment — Changes Needed

Quick summary: **Almost nothing!** Your app is already Render-ready.

## What Changed

### ✅ New: `render.yaml`
- Blueprint file for deploying both services at once
- **Optional** — you can also deploy manually

### ✅ Code Already Set Up
- Frontend: Dockerfile builds & serves with nginx ✓
- Backend: Dockerfile runs FastAPI ✓
- API client: Supports `VITE_API_BASE_URL` env var ✓
- Config: Supports production environment ✓

---

## What You Need to Do

### 1. Set Environment Variables

**Backend Service:**
```env
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<openssl-rand-hex-32>
GEMINI_API_KEY=<your-key>
ALLOWED_ORIGINS=https://cp-gpt-frontend.onrender.com
```

**Frontend Service:**
```env
VITE_API_BASE_URL=https://cp-gpt-backend.onrender.com
```

### 2. Create Services on Render

- [ ] PostgreSQL (free - Render creates it)
- [ ] Redis (free - Render creates it)
- [ ] Backend Web Service
- [ ] Frontend Static Site

### 3. Run Migrations

```bash
alembic upgrade head
```

---

## Deployment Paths

### Path A: Manual (10 minutes)
1. Create backend service → set env vars → add PostgreSQL/Redis
2. Create frontend service → set env vars
3. Run migrations
4. Done! ✅

### Path B: Blueprint (5 minutes)
1. Use `render.yaml` → let Render set up both
2. Just add secrets in dashboard
3. Done! ✅

---

## No Code Changes Needed

✅ Dockerfiles work as-is  
✅ API client works as-is  
✅ Backend config works as-is  
✅ Database migrations ready  
✅ CORS already configured  

---

## Quick Render URLs

After deployment:
- Frontend: `https://cp-gpt-frontend.onrender.com`
- Backend: `https://cp-gpt-backend.onrender.com`

---

## Cost

| Service | Cost |
|---------|------|
| Frontend (Static) | Free |
| Backend (Web) | $7/month |
| Database (Free) | Free |
| Redis (Free) | Free |
| **Total** | **$7/month** |

---

## Get Started

👉 **Read [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for full step-by-step guide**

---

**Key Point:** Your code is already production-ready for Render. Just:
1. Connect repo
2. Set environment variables
3. Deploy!

That's literally it. No code changes required. 🚀
