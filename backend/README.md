# 🏆 World Cup Prediction Game - Complete Documentation

## Overview

Full-stack World Cup prediction game with email confirmation, SQL database, and admin panel.

**How it works:**
- Users submit predictions (name, email, 8 teams)
- Backend checks if email already submitted (prevents duplicates)
- If NEW email: Saves to database + sends ₹500 contractual confirmation email
- Email is LOCKED: Same email cannot submit again
- After June 12, 2026 12:30 AM IST: Form closes, leaderboard shows
- Admin can update tournament results, scores auto-calculate

---

## ✅ Features Implemented

- **Username Field**: Each user has a unique username (3-20 chars, alphanumeric+@_)
- **Leaderboard Design**: Shows @username + score, clickable to view predictions
- **Predictions Modal**: Clean popup showing all predictions with status indicators:
  - **✓ Green** = Team reached at least predicted stage (correct)
  - **✗ Red** = Team exited before predicted stage (wrong)
  - **❓ Orange** = Stage not yet reached (pending)
- **Email-Locked Submissions**: Same email cannot submit twice (database UNIQUE constraint)
- **Contractual Emails**: Confirmation includes ₹500 fee mention and "hunted down" payment language
- **Form Reappears**: After submission, form resets for next user
- **Deadline Management**: Form closes June 12, 2026 12:30 AM IST, leaderboard shows
- **Admin Panel**: View predictions, update results stage-by-stage, view logs
- **Automatic Scoring**: Points recalculated when tournament results updated
- **Security**: Prepared statements, token authentication, audit logging

---

## 🚀 Quick Start (macOS Setup)

### Prerequisites
Before starting, make sure you have:
- [ ] Node.js installed (`node --version` should show version)
- [ ] MySQL installed (`mysql --version` should show version)
- [ ] Any email address (Gmail, Outlook, Yahoo, etc.)

**Need to install?**
- Node.js: https://nodejs.org/ (choose LTS version)
- MySQL: `brew install mysql` (if you have Homebrew)
- Homebrew: https://brew.sh/ (if needed)

### Step 1: Create Database (First Time Only)
```bash
mysql -u root
CREATE DATABASE worldcup_predictions;
EXIT;
```

Additional Commands
```
SHOW DATABASES;

DROP DATABASE db_name
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Update .env File
Edit `backend/.env` with your settings:

```
# Database
DB_PASSWORD=                    # Leave blank (or your MySQL password)

# Email Settings
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# Admin Settings
ADMIN_TOKEN=winnerwinner$$chickendinner#token  # Change this!
```

**Email Provider SMTP Settings:**
- Gmail: `smtp.gmail.com` (use regular password, not app password)
- Outlook: `smtp-mail.outlook.com`
- Yahoo: `smtp.mail.yahoo.com`

### Step 4: Start MySQL
```bash
brew services start mysql
```

Verify:
```bash
mysql -u root    # Should connect successfully
exit             # Type exit to quit
```

### Step 5: Start Backend (Terminal 1)
```bash
# From backend folder
npm run dev
```

Should show:
```
🚀 World Cup Prediction Backend running on http://localhost:5001
📧 Email service: Gmail
🗄️  Database: localhost
✅ Database initialized successfully
```

**IMPORTANT: Keep this terminal open!**

### Step 6: Start Frontend Server (Terminal 2 - NEW)
```bash
# From project root directory
python3 -m http.server 8000
```

Should show:
```
Serving HTTP on 0.0.0.0 port 8000
```

### Step 7: Access the Website
Open your browser and go to:
```
http://localhost:8000/pages/predworldcup.html
```

### Step 8: Test Everything
1. **Test user submission:**
   - Fill name, username (@username), email, select 8 teams
   - Click "Submit"
   - Check your email for confirmation (includes ₹500 mention)
   - Try same email again (should error: "Email already submitted")
   - Try different email (should work, form reappears)

2. **Test leaderboard:**
   - After deadline (June 12, 2026 12:30 AM IST), form hides
   - Leaderboard shows @username cards sorted by score
   - Click @username to open modal
   - Modal shows all predictions with status icons:
     - ✓ Green = correct predictions
     - ✗ Red = wrong predictions
     - ❓ Orange = stage not reached yet

3. **Test admin panel:**
   - Go to: `http://localhost:8000/backend/admin-panel.html`
   - Enter token: `winnerwinner$$chickendinner#token`
   - Select "Round of 32" stage, enter 2 teams
   - Click "Update Results & Recalculate Scores"
   - Scores update automatically
   - Modal icons change to show correct/wrong predictions
   - Repeat for each stage

---

## 📋 Environment Variables Explained

| Variable | Purpose | Default | Notes |
|----------|---------|---------|-------|
| `PORT` | Server port | 5000 | Change if port is in use |
| `NODE_ENV` | Development/production | development | Keep as development |
| `DB_HOST` | MySQL host | localhost | Usually localhost |
| `DB_USER` | MySQL username | root | Your MySQL user |
| `DB_PASSWORD` | MySQL password | root | Your MySQL password |
| `DB_NAME` | Database name | worldcup_predictions | Auto-created |
| `SMTP_HOST` | Email server | smtp.gmail.com | Use your email provider's SMTP |
| `SMTP_PORT` | Email server port | 587 | Usually 587 for TLS |
| `SMTP_SECURE` | Use SSL encryption | false | false for TLS, true for SSL |
| `SMTP_USER` | Sender email | your-email@gmail.com | Your email address |
| `SMTP_PASSWORD` | Email password | your-password | Your actual email password |
| `ADMIN_EMAIL` | Admin contact | your-email@gmail.com | For admin notifications |
| `ADMIN_TOKEN` | Admin panel password | wc2026admin$secure#token | Change to your own |
| `FRONTEND_URL` | Frontend location | http://localhost:8000 | For CORS |
| `REVEAL_DEADLINE` | Entry deadline | 2026-06-12T00:30:00+05:30 | Do not change |
| `ENTRY_FEE` | Entry cost | 500 | In Rupees (INR) |
| `CURRENCY` | Currency code | INR | Indian Rupees |

---

## 📧 Email Configuration

The system uses simple SMTP to send emails. Works with any email provider.

**Common SMTP Settings:**

| Provider | SMTP Host | Port | Secure |
|----------|-----------|------|--------|
| Gmail | smtp.gmail.com | 587 | false |
| Outlook | smtp-mail.outlook.com | 587 | false |
| Yahoo | smtp.mail.yahoo.com | 587 | false |
| Custom | Check your provider | 587 or 465 | false or true |

**Just use your email and password** - no app passwords needed!

---

## 📁 Project Structure

```
backend/
├── .env                    ← Configuration (EDIT THIS)
├── server.js              ← Express server
├── package.json           ← Dependencies
├── admin-panel.html       ← Admin dashboard
├── config/
│   └── database.js        ← MySQL setup
├── services/
│   └── emailService.js    ← Email sending
└── routes/
    ├── predictions.js     ← POST /api/predictions/submit
    ├── admin.js           ← Admin endpoints
    └── email.js           ← Resend confirmation
```

---

## 🔄 User Flow

### Submission Flow
1. User fills form (name, email, 8 team predictions)
2. Backend checks if email already exists
3. If NEW email:
   - Save to database
   - Send confirmation email (with ₹500 mention)
   - Show success message
   - Form reappears after 7 seconds
4. If DUPLICATE email:
   - Return error: "Email already submitted"
   - Form stays open
   - User can try different email

### Email Contents
- Official entry confirmation
- **"Entry Fee: ₹500 (Five Hundred Indian Rupees)"**
- **"We will hunt you down for this!" (payment threat)**
- All predictions listed
- Confirmation code
- Status: LOCKED (cannot be changed)

### Deadline Flow
**Before June 12, 2026 12:30 AM IST:**
- Form visible
- Users can submit
- Countdown shows

**After deadline:**
- Form hidden: "Entries are now closed"
- Leaderboard shows all predictions
- Scores visible
- No new submissions allowed

---

## 🎮 Admin Panel

**Access**: Click "Admin" link at bottom of prediction page

**URL**: `http://localhost:8000/backend/admin-panel.html`

**Authentication**: Enter ADMIN_TOKEN from .env

**How to Update Results:**

### Method 1: Stage-by-Stage (Recommended)
1. Select stage from dropdown (Round of 32, R16, QF, SF, Final, Winner)
2. Input fields appear (1-2 teams based on stage)
3. Enter team names
4. Click "Update Results & Recalculate Scores"
5. All scores auto-calculate
6. Leaderboard updates live
7. Modal status icons change (✓/✗/❓)

### Method 2: JSON (Bulk Update)
Paste full tournament results:
```json
{
  "Brazil": "Final",
  "Argentina": "Winner",
  "France": "Semi-final",
  "England": "Quarter-final"
}
```

**Capabilities**:
1. **View Predictions** - See all submissions with scores
2. **Update Results** - Stage-by-stage or JSON format
3. **View Logs** - Audit trail of all updates
4. **Delete Predictions** - Remove entries if needed

**Scoring Logic**:
- Team reaches AT LEAST predicted stage = points awarded
- Round of 32: 1 pt | Round of 16: 3 pts | QF: 6 pts
- Semi-final: 10 pts | Final: 15 pts | Winner: 22 pts (max 61)

---

## 📊 Database Schema

### predictions table
```sql
- id (UUID PRIMARY KEY)
- player_name (VARCHAR)
- player_username (VARCHAR) ← Unique username for leaderboard
- player_email (VARCHAR UNIQUE) ← Prevents duplicate submissions
- r32_1, r32_2 (VARCHAR - Team names)
- r16_1, r16_2 (VARCHAR - Team names)
- qf, sf, final_team, winner (VARCHAR - Team names)
- total_score (INT) ← Auto-calculated from actual results
- email_confirmed (BOOLEAN)
- confirmation_code (VARCHAR)
- submitted_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

### actual_results table
```sql
- team_name (VARCHAR PRIMARY KEY)
- actual_stage (VARCHAR) ← Stage team reached (R32, R16, QF, SF, Final, Winner)
```

### admin_logs table
```sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- action (VARCHAR) ← UPDATE_RESULTS, DELETE_PREDICTION, etc.
- details (TEXT) ← JSON details of the action
- created_at (TIMESTAMP)
```

---

## 🔒 Email Locking System

**How it prevents duplicates:**

1. **Database Level**: UNIQUE constraint on player_email
2. **Backend Level**: Query checks if email exists before insert
3. **Error Response**: Returns 409 status with "Email already submitted"

**Result**: Same email locked forever. Different emails allowed.

---

## 🔑 Scoring System

**Current Points**:
- Round of 32: 1 pt each
- Round of 16: 3 pts each
- Quarter-final: 6 pts
- Semi-final: 10 pts
- Final: 15 pts
- Winner: 22 pts
- **Maximum**: 61 points

**How it works**:
1. User predicts team will reach specific stage
2. Admin updates actual tournament results
3. Scores auto-calculate based on predictions vs actual
4. Leaderboard updates

---

## 🔧 API Endpoints

### Public

**POST /api/predictions/submit** - Submit entry
```json
Request: { playerName, playerUsername, playerEmail, predictions }
Response: { success, message, confirmationCode, predictionId }
```

**GET /api/predictions/all** - Get all predictions
```json
Response: [{ player_name, player_username, r32_1, r32_2, r16_1, r16_2, qf, sf, final_team, winner, total_score }]
```

**GET /api/predictions/leaderboard** - Get leaderboard (with teams for modal)
```json
Response: [{ player_name, player_username, r32_1, r32_2, r16_1, r16_2, qf, sf, final_team, winner, total_score }]
```

### Admin (Requires x-admin-token header)

- `GET /api/admin/predictions` - View all predictions with details
- `POST /api/admin/update-results` - Update tournament results
- `GET /api/admin/results` - View current tournament results
- `GET /api/admin/logs` - View action audit trail
- `DELETE /api/admin/predictions/:id` - Delete an entry

---

## 📧 Email Configuration (SMTP)

**Supports any email provider** - Gmail, Outlook, Yahoo, custom servers, etc.

**Variables needed**:
- `SMTP_HOST` - Your email provider's SMTP server
- `SMTP_PORT` - Usually 587 or 465
- `SMTP_SECURE` - false for TLS, true for SSL
- `SMTP_USER` - Your email address
- `SMTP_PASSWORD` - Your email password

**Email includes**:
- ✅ Entry confirmation
- ✅ ₹500 fee mention
- ✅ "Hunted down" payment language
- ✅ Confirmation code
- ✅ Locked status
- ✅ Submission timestamp

**Templates**: `backend/services/emailService.js`

**Troubleshooting**:
- If Gmail doesn't work, enable "Less secure app access" in Gmail settings
- OR use an app password instead of regular password
- For other providers, verify SMTP settings are correct

---

## 🧪 Testing

### Test User Submission
1. Go to `/pages/predworldcup.html`
2. Fill form: name, email, 8 teams
3. Submit
4. Check email for confirmation
5. Try same email again (should error)
6. Try different email (should work)

### Test Admin Panel
1. Click "Admin" at page bottom
2. Enter ADMIN_TOKEN
3. View predictions
4. Update results with JSON
5. Check leaderboard updates

### Test API
```bash
# Check backend
curl http://localhost:5000/api/health

# Check database
curl http://localhost:5000/api/db-status
```

---

## ⚠️ Important Notes

- **Email is permanent**: Cannot change after submission
- **Duplicate prevention**: Same email blocked at database level
- **Admin token**: Keep secret, used for all admin operations
- **Deadline**: After June 12, form hidden completely
- **Leaderboard**: Only shows after deadline
- **Scoring**: Auto-calculates when results updated

---

## 📝 File Locations

**Frontend**:
- Main page: `/pages/predworldcup.html`
- Styles: `/css/predworldcup.css`
- Logic: `/js/predworldcup.js`

**Backend**:
- Server: `/backend/server.js`
- Database: `/backend/config/database.js`
- Email: `/backend/services/emailService.js`
- APIs: `/backend/routes/`
- Admin: `/backend/admin-panel.html`
- Config: `/backend/.env`

**Documentation**:
- This file: `/backend/docs/README.md`

---

## 🚨 Troubleshooting (macOS)

### "npm: command not found"
- Node.js not installed or terminal not restarted
- **Fix**: Install Node.js from https://nodejs.org/, restart terminal

### "mysql: command not found"
- MySQL not installed
- **Fix**: `brew install mysql`

### "Cannot connect to MySQL"
- MySQL not running
- **Fix**: `brew services start mysql`

### "Access denied for user 'root'@'localhost'"
- Wrong MySQL password in .env
- **Fix**: Check your MySQL password or update `DB_PASSWORD=` in .env

### "Unknown database 'worldcup_predictions'"
- Database not created yet
- **Fix**: Run `mysql -u root` then `CREATE DATABASE worldcup_predictions;`

### "Email not sending"
- Wrong SMTP credentials
- **Fix**: Verify email/password in .env, enable "Less secure apps" for Gmail
- **Alternative**: Use an app-specific password instead of regular password

### "Port 5001 already in use"
- Another app is using that port
- **Fix 1**: Change PORT in .env to 5002 or 5003
- **Fix 2**: Kill the process: `lsof -i :5001` then `kill -9 <PID>`

### "Admin token rejected"
- Wrong token entered or .env not updated
- **Fix**: Verify token matches exactly (case-sensitive): `winnerwinner$$chickendinner#token`

### "Cannot find predworldcup.html"
- Wrong URL
- **Fix**: Use `http://localhost:8000/pages/predworldcup.html` (NOT port 5001)

### "Form not submitting"
- Backend not running
- **Fix**: Ensure `npm run dev` is running in Terminal 1

### "No email received after submission"
- Check spam folder first
- Email takes 5-10 seconds to arrive
- Check .env SMTP settings are correct

---

## 🔄 Data Consistency

**Property Name Mapping**:
The frontend handles both localStorage format and API response format:
- `username` (local) ↔ `player_username` (database)
- `name` (local) ↔ `player_name` (database)
- `totalScore` (local) ↔ `total_score` (database)

**Frontend automatically maps these properties**, so the leaderboard and modal work correctly whether data comes from localStorage or the backend API.

---

## 📝 Important Notes for Local Development

### Running Locally
- **Backend MUST stay running** in your terminal
- Close backend = users get connection errors
- Keep Terminal 1 (backend) and Terminal 2 (frontend) both open

### After June 12, 2026 12:30 AM IST
- Form automatically hides
- Leaderboard shows all predictions
- No new submissions allowed

### Email Locking
- Same email = LOCKED permanently (cannot submit again)
- Different email = CAN submit again (form reappears after 7 seconds)

### For Production (Railway)
- Backend deploys to Railway (auto-running 24/7)
- Frontend stays on GitHub Pages (your website)
- No need for your Mac to be on

---

## ✨ You're Ready!

1. ✅ .env is pre-filled
2. ✅ Run `npm run dev` to start
3. ✅ Users submit via `/pages/predworldcup.html`
4. ✅ Admin access via "Admin" link (bottom of page)
5. ✅ Leaderboard shows after June 12, 2026

**Everything is working! Time to test and deploy.** 🏆
