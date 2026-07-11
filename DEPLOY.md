# Sentosa Green Society - Deployment Guide

## Railway Deployment (Recommended)

### Prerequisites
- GitHub account
- Railway account (free at https://railway.app)

### Step 1: Push to GitHub
```bash
cd /Users/ranjatsrivastava/99_Sentosa_Green/SentosaGreenSociety
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sentosa-green-society.git
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the `railway.json` config

### Step 3: Add PostgreSQL Database

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway will create a PostgreSQL instance
3. Copy the `DATABASE_URL` from the database settings

### Step 4: Set Environment Variables

In Railway, go to your backend service → Variables tab:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` (or leave default) |
| `JWT_SECRET` | `your-super-secret-key-here` |
| `DATABASE_URL` | `postgresql://user:password@host:5432/database` (from Railway) |
| `FRONTEND_URL` | `https://your-frontend-url.netlify.app` |

### Step 5: Deploy Frontend to Netlify

1. Build the frontend:
```bash
cd client
npm run build
```

2. Deploy to Netlify:
   - Drag and drop the `client/dist` folder to https://app.netlify.com/drop
   - Or connect GitHub repo to Netlify

3. Configure Netlify:
   - Build command: `cd client && npm run build`
   - Publish directory: `client/dist`
   - Environment variable: `VITE_API_URL=https://your-backend.railway.app`

### Step 6: Update CORS

After deploying backend, update `FRONTEND_URL` in Railway with your Netlify URL.

## Local Development

```bash
# Terminal 1 - Backend
cd server
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

## Database Migration

When deploying to Railway with PostgreSQL:
1. The app will automatically create tables
2. Admin user will be auto-created (phone: 0000000000, password: pass123)
3. Existing SQLite data won't migrate automatically

## Troubleshooting

### Port Issues
Railway assigns a dynamic port. The app uses `process.env.PORT` automatically.

### Database Connection
Make sure `DATABASE_URL` is set correctly in Railway environment variables.

### CORS Errors
Ensure `FRONTEND_URL` matches your Netlify deployment URL exactly.

## Cost Estimate

- Railway: Free $5 credit/month (PostgreSQL + Backend)
- Netlify: Free static hosting
- **Total: $0/month for small usage**
