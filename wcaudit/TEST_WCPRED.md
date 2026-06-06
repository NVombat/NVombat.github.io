# World Cup Prediction Game - Complete Testing Guide

## System Overview

**Frontend**: https://nvombat.github.io/pages/predworldcup.html
**Backend**: https://worldcup-prediction-backend-production.up.railway.app
**Admin Panel**: https://worldcup-prediction-backend-production.up.railway.app/admin

---

## Architecture

### Frontend (GitHub Pages)
- **HTML**: pages/predworldcup.html (289 lines)
- **CSS**: css/predworldcup.css (908 lines)
- **JS**: js/predworldcup.js (591 lines)

### Backend (Railway)
- **routes/predictions.js** (206 lines): Submit, leaderboard, results endpoints
- **routes/admin.js** (194 lines): Admin panel, score recalculation
- **services/emailService.js**: Confirmation emails with ₹500 fee mention
- **config/database.js**: MySQL connection pool

---

## Core Functionality

### User Submission Flow
1. User enters name, username, email
2. Selects 8 teams across 6 tournament stages
3. Form validates: unique teams, valid email, username 3-20 chars
4. Frontend submits to `/api/predictions/submit`
5. Backend validates the canonical eight-slot payload and checks duplicate email/username
6. Frontend handles `200`, `202`, `403`, and `429` separately
7. A `202` entry still counts and shows a resend option for the email receipt

### Leaderboard & Real-Time Updates
1. **Before Deadline** (June 12, 2026 12:30 AM IST):
   - Countdown timer visible
   - Submission form active
   - No leaderboard shown

2. **After Deadline**:
   - Countdown hidden
   - Leaderboard appears at top
   - Real-time polling: Every 5 seconds
   - Form shows "Entries are now closed"

3. **Stage-Dependent Sorting**:
   - **Before R32 Results**: Alphabetical by username
   - **After R32 Results**: By total_score DESC, then earliest submission
   - Backend detects R32 via actual_results table
   - Frontend respects backend metadata

### Scoring System
- **Round of 32**: 1 point each (2 teams)
- **Round of 16**: 3 points each (2 teams)
- **Quarter-final**: 6 points (1 team)
- **Semi-final**: 10 points (1 team)
- **Final**: 15 points (1 team)
- **Winner**: 22 points (1 team)
- **Max Score**: 61 points
- **Logic**: Team must reach AT LEAST predicted stage to earn points

---

## Testing Scenarios

### Test 1: Form Validation
```
URL: https://nvombat.github.io/pages/predworldcup.html

✓ Name field required
✓ Username required (3-20 chars, alphanumeric + @_)
✓ Email required (valid format)
✓ All 8 teams required
✓ No duplicate teams allowed
✓ Submit button disabled until form complete
```

### Test 2: Before Deadline
```
Expected:
- Countdown timer visible
- Submission form visible
- Leaderboard hidden
- Countdown updates every second

Verify:
- Days, hours, minutes, seconds count down
- Form fields accept input
- Submit button enables when complete
```

### Test 3: After Deadline
```
For local testing, set the backend `REVEAL_DEADLINE` to a past ISO-8601
timestamp, restart the backend, and open:
http://localhost:8000/pages/predworldcup.html

Expected:
- Countdown section hidden
- Leaderboard visible at top
- Form shows "Entries are now closed"
- Leaderboard shows all users
- Click user card to view their predictions
```

### Test 4: Leaderboard Sorting (Before R32)
```
Setup: No R32 results entered

Expected Order:
- Users sorted alphabetically by username
- All scores show 0

Verify:
- Backend returns metadata.hasR32Results: false
- Frontend uses alphabetical sort
- Usernames in A-Z order
```

### Test 5: Leaderboard Sorting (After R32)
```
Setup: Admin adds R32 results, backend recalculates scores

Expected:
- Users sorted by score DESC
- Highest scorers at top
- Equal scores are ordered by earliest submission

Verify:
- Backend returns metadata.hasR32Results: true
- Frontend uses score-based sort
- Leaderboard updates within 5 seconds
```

### Test 6: Real-Time Updates
```
Setup:
1. Open leaderboard on page
2. Admin updates tournament result
3. Watch for update within 5 seconds

Expected:
- Leaderboard refreshes automatically
- Scores update
- User order may change
- No page reload needed

Verify (in Console):
- Network tab shows /leaderboard requests every 5s
- Frontend extracts metadata correctly
- renderLeaderboard() re-executes
```

### Test 7: Metadata Synchronization
```
Open Browser Console → Network Tab → Filter: leaderboard

Response Format:
{
  "entries": [{ player_username, total_score, r32_1, r32_2, ... }],
  "metadata": {
    "hasR32Results": boolean,
    "sortBy": "score" | "username"
  }
}

Verify:
- entries array contains users
- metadata.hasR32Results matches sorting strategy
- Frontend uses this metadata (line 454 in js)
```

### Test 8: Modal - View Predictions
```
Setup: Click any leaderboard user card

Expected Modal Shows:
- Player name and username
- Total points
- Each predicted team
- Status: ✓ (correct), ✗ (eliminated), ❓ (pending)
- Points value for each stage

Close Modal:
- Click outside modal
- Modal disappears
```

### Test 9: Email Confirmation
```
Setup: Submit a new prediction

Expected:
- `200` response includes `emailSent: true`
- Confirmation email sent within 30 seconds
- Email contains:
  - Player name
  - Predicted teams
  - Points possible
  - Configured entry fee
  - Confirmation code
```

### Test 10: Email Delivery Failure and Resend
```
Setup: Make SMTP delivery fail for a new submission

Expected:
- Submission returns 202 with emailSent: false
- UI explains that the entry was accepted
- UI explains that the entry still appears on the leaderboard
- "Resend confirmation" button is visible
- A successful resend shows the backend's generic success message
- Unknown and registered emails receive the same generic resend response
```

### Test 11: Deadline and Rate-Limit Responses
```
Expected:
- Frontend loads revealDeadline from GET /api/health
- A submit 403 updates the local deadline and closes the form
- A submit/resend 429 displays the backend rate-limit message
- The static June 12 deadline is used only when the health request is unavailable
```

### Test 12: Admin Panel
```
URL: https://worldcup-prediction-backend-production.up.railway.app/admin

Setup: Login with admin token from env vars

Actions:
1. View all predictions
2. View current results
3. Update results (e.g., France → Final)
4. Verify scores recalculate
5. Verify leaderboard reflects change (5s)
6. View admin logs
```

---

## Code Quality Verification

✅ **Frontend**: No console errors (diagnostics clean)
✅ **Sorting Logic**: Backend ordering is authoritative
✅ **Metadata Flow**: Backend → Frontend properly synced
✅ **Real-time Polling**: 5-second interval controlled
✅ **Form Validation**: Canonical eight-slot order and unique-team validation
✅ **Security**: XSS protection, input sanitization
✅ **Responsive Design**: Works on mobile and desktop
✅ **Modal**: Event-based (no inline onclick)
✅ **Game config**: Teams, stages, points, and deadline load from the backend
✅ **Database**: Unique constraints on email and username

---

## Production Checklist

- [x] Frontend code reviewed and optimized
- [x] Backend code reviewed and verified
- [x] All 48 World Cup teams listed
- [x] Scoring system matches documentation
- [x] Deadline set to June 12, 2026 12:30 AM IST
- [x] Email service configured
- [x] Admin token authentication working
- [x] Real-time leaderboard updates implemented
- [x] Stage-dependent sorting implemented
- [x] Backend score ordering and submission-time tie ordering displayed accurately
- [x] Rules card accurately describes game
- [x] No stale code or commented-out logic
- [x] Frontend-backend communication verified
- [x] Metadata properly synchronized

---

## Status: READY FOR PRODUCTION

All tests pass. System is production-ready. Deploy with confidence.\n
