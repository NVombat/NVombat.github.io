# 🏆 World Cup Prediction Game - Complete Documentation

## Overview

Full-stack World Cup prediction game with email confirmation, SQL database, and admin panel. Users submit predictions, receive contractual confirmation emails (₹500 entry fee), and compete on a leaderboard.

---

## ✅ Features Implemented

- **Email-Locked Submissions**: Same email cannot submit twice (database UNIQUE constraint)
- **Contractual Emails**: Confirmation includes ₹500 fee mention and "hunted down" payment language
- **Form Reappears**: After submission, form resets for next user
- **Deadline Management**: Form closes June 12, 2026 12:30 AM IST, leaderboard shows
- **Admin Panel**: View predictions, update results, view logs
- **Automatic Scoring**: Points calculated when tournament results updated
- **Security**: Prepared statements, token authentication, audit logging

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment Variables
**File**: `backend/.env` (already filled with example values)

Key variables:
```
DB_HOST=localhost              # MySQL host
DB_USER=root                   # MySQL user
DB_PASSWORD=root               # MySQL password
EMAIL_USER=your-gmail@gmail.com  # For sending confirmation emails
EMAIL_PASSWORD=your-app-password # Gmail app password (16 chars)
ADMIN_TOKEN=wc2026admin$secure#token  # Admin panel password
```

**To Update .env:**
1. Edit `backend/.env`
2. Change email credentials to your Gmail
3. Change ADMIN_TOKEN to your own secure token
4. Keep DATABASE credentials matching your MySQL setup

### 3. Start Backend
```bash
npm run dev
```

Output:
```
🚀 World Cup Prediction Backend running on http://localhost:5000
✅ Database initialized successfully
```

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
| `EMAIL_SERVICE` | Email provider | gmail | Only Gmail tested |
| `EMAIL_USER` | Sender email | your-gmail@gmail.com | Your Gmail account |
| `EMAIL_PASSWORD` | Gmail app password | 16-char code | NOT regular password |
| `ADMIN_EMAIL` | Admin contact | your-gmail@gmail.com | For admin notifications |
| `ADMIN_TOKEN` | Admin panel password | wc2026admin$secure#token | Change to your own |
| `FRONTEND_URL` | Frontend location | http://localhost:8000 | For CORS |
| `REVEAL_DEADLINE` | Entry deadline | 2026-06-12T00:30:00+05:30 | Do not change |
| `ENTRY_FEE` | Entry cost | 500 | In Rupees (INR) |
| `CURRENCY` | Currency code | INR | Indian Rupees |

---

## 🔐 Getting Gmail App Password

Gmail app passwords are 16-character passwords for third-party apps:

1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" (if not already enabled)
3. Go back to Security → Find "App passwords"
4. Select: Mail → Windows Computer
5. Copy the 16-character password
6. Paste in .env as `EMAIL_PASSWORD`

**Important**: Use app password, NOT your regular Gmail password.

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

**URL**: `backend/admin-panel.html`

**Authentication**: Enter ADMIN_TOKEN from .env

**Capabilities**:
1. **View Predictions** - See all submissions with details
2. **Update Results** - Input tournament outcomes (JSON)
3. **View Logs** - See all admin actions (audit trail)
4. **Delete Predictions** - Remove entries if needed

**Example Result Update**:
```json
{
  "Brazil": "Final",
  "Argentina": "Winner",
  "France": "Semi-final"
}
```

---

## 📊 Database Schema

### predictions table
```sql
- id (UUID PRIMARY KEY)
- player_name (VARCHAR)
- player_email (VARCHAR UNIQUE) ← Prevents duplicates
- r32_1, r32_2 (Team names)
- r16_1, r16_2 (Team names)
- qf, sf, final_team, winner (Team names)
- total_score (INT)
- email_confirmed (BOOLEAN)
- confirmation_code (VARCHAR)
- submitted_at (TIMESTAMP)
```

### actual_results table
```sql
- team_name (VARCHAR PRIMARY KEY)
- actual_stage (VARCHAR)
```

### admin_logs table
```sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- action (VARCHAR)
- details (TEXT)
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
- `POST /api/predictions/submit` - Submit entry
- `GET /api/predictions/all` - Get all predictions
- `GET /api/predictions/leaderboard` - Get leaderboard

### Admin (Requires x-admin-token header)
- `GET /api/admin/predictions` - View all with details
- `POST /api/admin/update-results` - Update tournament
- `GET /api/admin/results` - View results
- `GET /api/admin/logs` - View action logs
- `DELETE /api/admin/predictions/:id` - Delete entry

---

## 📧 Email Configuration

**Service**: Gmail only (currently configured)

**Variables needed**:
- `EMAIL_USER` - Your Gmail email
- `EMAIL_PASSWORD` - Gmail app password (16 chars)

**Email includes**:
- ✅ Entry confirmation
- ✅ ₹500 fee mention
- ✅ "Hunted down" payment language
- ✅ Confirmation code
- ✅ Locked status
- ✅ Submission timestamp

**Templates**: `backend/services/emailService.js`

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

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot connect to MySQL | Start MySQL: `brew services start mysql` |
| Email not sending | Check Gmail app password (use generated one, not regular password) |
| Admin token rejected | Verify token matches .env exactly (case-sensitive) |
| Port 5000 in use | Change PORT in .env to different number |
| Database not created | Restart backend, should auto-create |
| Duplicate email error (expected) | This is correct behavior - prevents cheating |

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

## ✨ You're Ready!

1. ✅ .env is pre-filled
2. ✅ Run `npm run dev` to start
3. ✅ Users submit via `/pages/predworldcup.html`
4. ✅ Admin access via "Admin" link
5. ✅ Leaderboard shows after June 12, 2026

**Questions?** Refer to sections above or check file comments.
