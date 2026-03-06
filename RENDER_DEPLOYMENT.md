# Render Full-Stack Deployment Guide

Deploy **both frontend and backend** on Render in ~10 minutes.

## Architecture

```
https://cp-gpt-frontend.onrender.com  ← Static site (React)
         ↓
         └─→  https://cp-gpt-backend.onrender.com  ← FastAPI
                     ↓
                PostgreSQL + Redis
```

---

## Step 1: Connect Repository

1. Go to [render.com](https://render.com)
2. Click **New +** (top right)
3. Select **Blueprint** (or individual services)
4. Connect your GitHub repo
5. Grant access to the repository

---

## Step 2: Deploy Backend (FastAPI)

### Option A: Auto-Deploy with Blueprint (Recommended)

If you have `render.yaml` in your repo root:
1. Render detects it automatically
2. Click **Deploy**
3. Go to **Environment** and fill in secrets

### Option B: Manual Service Creation

1. Click **New +** → **Web Service**
2. Select your GitHub repo
3. Configure:
   - **Name:** `cp-gpt-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3.12
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - **Plan:** Starter ($7/month)

4. Click **Create Web Service**

### Add Environment Variables

1. Go to **Environment** tab
2. Add:
   ```env
   ENVIRONMENT=production
   DEBUG=false
   SECRET_KEY=<generate-with-openssl-rand-hex-32>
   GEMINI_API_KEY=<your-key>
   CF_API_KEY=<optional>
   CF_API_SECRET=<optional>
   ALLOWED_ORIGINS=https://cp-gpt-frontend.onrender.com
   ```

3. Click **Save**

### Add PostgreSQL

1. Click **New +** → **PostgreSQL**
2. Configure:
   - **Name:** `cp-gpt-postgres`
   - **Plan:** Free
3. Click **Create Database**
4. Render auto-populates `DATABASE_URL` in backend env vars

### Add Redis

1. Click **New +** → **Redis**
2. Configure:
   - **Name:** `cp-gpt-redis`
   - **Plan:** Free
3. Click **Create Redis**
4. Copy connection string, add to backend as `REDIS_URL`

**Note the backend service URL:**
```
https://cp-gpt-backend.onrender.com
```

---

## Step 3: Deploy Frontend (React)

### Option A: Static Site (Recommended)

1. Click **New +** → **Static Site**
2. Select your GitHub repo
3. Configure:
   - **Name:** `cp-gpt-frontend`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
   - **Plan:** Free

4. Click **Create Static Site**

### Add Environment Variables

1. Go to **Environment** tab
2. Add:
   ```env
   VITE_API_BASE_URL=https://cp-gpt-backend.onrender.com
   ```
3. Click **Save** and **Redeploy**

**Note the frontend service URL:**
```
https://cp-gpt-frontend.onrender.com
```

---

### Option B: Web Service (if you want more control)

If you prefer web service over static site:
1. Click **New +** → **Web Service**
2. Select GitHub repo
3. **Root Directory:** `frontend`
4. **Runtime:** Node
5. **Build Command:** `npm install && npm run build`
6. **Start Command:** `npm run preview` or serve static files

---

## Step 4: Configure CORS

Update backend ALLOWED_ORIGINS with your actual frontend URL:

1. Go to backend service → **Environment**
2. Update:
   ```env
   ALLOWED_ORIGINS=https://cp-gpt-frontend.onrender.com
   ```
3. Click **Save** (auto-redeploys)

---

## Step 5: Run Migrations

After PostgreSQL is created, run Alembic migrations:

1. Go to backend service → **Shell** tab
2. Run:
   ```bash
   alembic upgrade head
   ```

Or manually via backend dashboard, run in the terminal:
```bash
alembic upgrade head
```

---

## Step 6: Test Deployment

### Test Backend
```bash
curl https://cp-gpt-backend.onrender.com/health
# Should return: {"status":"ok"}
```

### Test Frontend
Visit: https://cp-gpt-frontend.onrender.com

### Test API Connection
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try registering or logging in
4. API calls should go to your backend URL

---

## Environment Variables Checklist

### Backend Service
- [ ] `ENVIRONMENT=production`
- [ ] `DEBUG=false`
- [ ] `SECRET_KEY=<generated>`
- [ ] `GEMINI_API_KEY=<your-key>`
- [ ] `ALLOWED_ORIGINS=https://cp-gpt-frontend.onrender.com`
- [ ] `DATABASE_URL` (auto from PostgreSQL)
- [ ] `REDIS_URL` (auto from Redis or manual)

### Frontend Service
- [ ] `VITE_API_BASE_URL=https://cp-gpt-backend.onrender.com`

---

## Common Issues

### "CORS Error" or "Cannot POST /api/v1/..."

**Cause:** Frontend URL not in `ALLOWED_ORIGINS`

**Fix:**
1. Backend service → **Environment**
2. Update `ALLOWED_ORIGINS` with exact frontend URL
3. Redeploy

---

### "API returns 404"

**Cause:** `VITE_API_BASE_URL` is incorrect or not set

**Fix:**
1. Frontend service → **Environment**
2. Check `VITE_API_BASE_URL=https://cp-gpt-backend.onrender.com`
3. Redeploy

---

### "Database connection error"

**Cause:** PostgreSQL not connected

**Fix:**
1. Check backend has `DATABASE_URL` env var
2. Verify PostgreSQL service created and running
3. Backend service → **Logs** tab to see error details

---

### Cold Starts / Slow First Request

Render free tier PostgreSQL/Redis spin down after 15min inactivity. This is normal.

**Solution:** Use paid plans for always-on services.

---

## Service URLs After Deployment

```
Frontend:  https://cp-gpt-frontend.onrender.com
Backend:   https://cp-gpt-backend.onrender.com
Database:  Managed by Render (internal only)
Redis:     Managed by Render (internal only)
```

---

## Continuous Deployment

Both services auto-redeploy when you push to GitHub:

```bash
git add .
git commit -m "Update auth"
git push origin main
# ✅ Render auto-deploys both frontend and backend
```

---

## Cost Estimate

| Service | Plan | Cost |
|---------|------|------|
| Frontend | Static Site | Free |
| Backend | Web Service | $7/month |
| PostgreSQL | Free | Free |
| Redis | Free | Free |
| **Total** | | **$7/month** |

---

## Upgrading Plans

To enable SSL, custom domains, or faster performance:

1. Go to service → **Settings**
2. Change **Plan** from Free to Starter/Standard
3. Render upgrades and redeploys

---

## Monitoring & Logs

### View Logs
- Backend: Service → **Logs**
- Frontend: Service → **Logs**

### View Metrics
- Service dashboard shows CPU, memory, requests

### View Errors
- Logs tab shows all errors and warnings

---

## Custom Domain

1. Service → **Settings** → **Custom Domain**
2. Add your domain: `api.yourdomain.com`
3. Update DNS records from Render's instructions
4. Update `ALLOWED_ORIGINS` with your frontend domain
5. Update `VITE_API_BASE_URL` with your backend domain

---

## Backup & Restore

### PostgreSQL Backups
Render auto-backups daily for paid plans. Free plan backups weekly.

To download:
1. Go to PostgreSQL service → **Settings**
2. Look for **Backups** section

### Manual Backup
```bash
# Connect to backend service shell
pg_dump $DATABASE_URL > backup.sql
```

---

## FAQ

**Q: Can I use render.yaml for all services?**  
A: Recommended to deploy manually first, then set up render.yaml for repeatable deployments.

**Q: Do I need to change any code?**  
A: No! The code is already Render-ready. Just set environment variables.

**Q: How do I update my code?**  
A: Push to GitHub, Render auto-redeploys.

**Q: Can I use custom domains?**  
A: Yes, for $12/month per service.

**Q: What if I need more environment variables?**  
A: Service → **Environment** tab, add any variable from `backend/.env.example`

---

## Next Steps

1. ✅ Create static site for frontend
2. ✅ Create web service for backend
3. ✅ Add PostgreSQL and Redis
4. ✅ Set all environment variables
5. ⭐ Run migrations
6. ⭐ Test all endpoints
7. ⭐ Monitor logs
8. ⭐ Set up alerts/monitoring

---

## Support

- [Render Docs](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Deployment](https://vitejs.dev/guide/static-deploy.html#render)

---

All set! Your app will be live in ~10 minutes. 🚀
