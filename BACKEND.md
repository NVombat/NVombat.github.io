# 🚀 Backend Migration Guide

## Part 1: Shift Backend to Separate Repo

### Step 1: Create New GitHub Repo
1. Go to github.com → New repository
2. Name it: `worldcup-prediction-backend`
3. Description: "Backend API for World Cup Prediction Game"
4. Make it **Private** (you only)
5. **DO NOT** initialize with README/gitignore
6. Click "Create repository"

### Step 2: Copy Backend Files
```bash
# On your local machine, go to your website repo
cd /path/to/NVombat.github.io

# Create a backup first
cp -r backend backend-backup

# Create new directory for new repo
mkdir ~/worldcup-prediction-backend
cd ~/worldcup-prediction-backend

# Copy all backend files
cp -r ../NVombat.github.io/backend/* .

# List files to verify
ls -la
# Should see: server.js, config/, routes/, services/, .env, package.json, README.md
```

### Step 3: Initialize Git in New Repo
```bash
cd ~/worldcup-prediction-backend

# Initialize git
git init
git add .
git commit -m "Initial commit: Backend API"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/worldcup-prediction-backend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Update Frontend API URL
After deploying to Railway (see Part 2), update the frontend:

**In `/js/predworldcup.js` (around line 177):**
```javascript
// OLD:
const response = await fetch('http://localhost:5001/api/predictions/submit', {

// NEW (replace with your Railway URL):
const response = await fetch('https://your-railway-app.up.railway.app/api/predictions/submit', {
```

**Update ALL API calls** (search for `localhost:5001`):
- `/api/predictions/submit`
- `/api/predictions/all`
- `/api/predictions/leaderboard`
- `/api/admin/predictions`
- `/api/admin/update-results`

---

## Part 2: Deploy to Railway

### Prerequisites
- GitHub account (already done above)
- Railway account: https://railway.app (free tier available)
- Credit card (only charges if you exceed free tier)

### Step 1: Connect Railway to GitHub
1. Go to https://railway.app
2. Sign up/Log in
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Connect your GitHub account
6. Select `worldcup-prediction-backend` repo
7. Click **"Deploy Now"**

Railway will automatically detect Node.js and start building!

### Step 2: Configure Environment Variables
1. In Railway dashboard, click your project
2. Go to **"Variables"** tab
3. Add these variables:
   ```
   DB_HOST=          # Will configure next
   DB_USER=root
   DB_PASSWORD=      # Your MySQL password
   DB_NAME=worldcup_predictions
   PORT=5001
   NODE_ENV=production
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ADMIN_TOKEN=winnerwinner$$chickendinner
   ADMIN_EMAIL=your-email@gmail.com
   FRONTEND_URL=https://nvombat.github.io
   ```

### Step 3: Setup Railway MySQL
1. In Railway dashboard, click **"+ New"**
2. Select **"MySQL"**
3. Railway creates MySQL service
4. Go to MySQL service **"Variables"** tab
5. Copy the `DATABASE_URL` value
6. Parse it to get connection details
7. Update above variables with correct `DB_HOST`, `DB_PASSWORD`

### Step 4: Get Railway Domain
1. Click your Node.js service
2. Go to **"Settings"**
3. Find **"Public Networking"** section
4. Copy the Railway URL (looks like: `https://yourapp-production.up.railway.app`)
5. This is your backend domain

### Step 5: Update Frontend
In `/js/predworldcup.js`, replace all `localhost:5001` with your Railway URL:

```javascript
// Replace this everywhere:
fetch('http://localhost:5001/...

// With:
fetch('https://yourapp-production.up.railway.app/...
```

Also update in `/backend/routes/` if there are any hardcoded URLs.

### Step 6: Enable CORS
Your backend CORS must allow `https://nvombat.github.io`. In backend code:

```javascript
// Make sure this is set in server.js
app.use(cors({
  origin: ['https://nvombat.github.io', 'http://localhost:8000'],
  credentials: true
}));
```

### Step 7: Database Initialization
Railway MySQL starts fresh. You need to initialize tables:

**Option A: Run init script** (best way)
```bash
# Connect to Railway MySQL from local machine
mysql -h [railway-host] -u root -p [database-name]

# Run the initialization queries from backend/config/database.js
# Or let the backend auto-init on first run
```

**Option B: Backend auto-initializes** (if your code has initializeDatabase())
- Deploy backend
- Backend should auto-create tables on startup
- Check Railway logs to verify

### Troubleshooting Railway Deployment

**"Cannot connect to database"**
- Verify `DB_HOST` is Railway MySQL hostname
- Check `DB_PASSWORD` matches Railway MySQL password
- Ensure MySQL service is running in Railway

**"CORS error"**
- Update `FRONTEND_URL` in environment
- Check CORS middleware in backend

**"Email not sending"**
- Verify Gmail app password (not regular password)
- Enable "Less secure app access" if using regular password

**View logs in Railway:**
```
Dashboard → Your Project → Node.js Service → Logs
```

---

## Part 3: Testing & Verification

1. **Test form submission**
   - Go to your website
   - Submit an entry
   - Confirm email arrives

2. **Test leaderboard** (after June 12)
   - Check leaderboard loads
   - Verify scores calculate
   - Click usernames to see predictions

3. **Test admin panel**
   - Go to admin panel
   - Login with token
   - Update tournament results
   - Verify scores update

---

## Rollback Plan
If something breaks:
```bash
# Go back to local backend
# Stop Railway deployment
# Use backend-backup folder
# Update frontend to localhost:5001
# Test locally first before re-deploying
```

---

**Questions?** Check Railway docs: https://docs.railway.app
