# World Cup Prediction Game - Admin Guide

## Updating Tournament Results

The World Cup Prediction Game automatically calculates scores based on actual tournament results. Here's how to update them.

## Admin Interface Location

Open `/js/predworldcup.js` and find this section (around line 70-75):

```javascript
// Admin: Update actual results here
let ACTUAL_RESULTS = {};
```

## How to Update Results

As teams are eliminated or advance, update the `ACTUAL_RESULTS` object with the deepest stage each team reached.

### Example: After Round of 16

```javascript
let ACTUAL_RESULTS = {
    "Portugal": "Quarter-final",
    "Brazil": "Round of 16",
    "Japan": "Round of 32",
    "USA": "Round of 32",
    "Argentina": "Quarter-final",
    "France": "Semi-final"
};
```

### Possible Values

Teams can reach these stages:

- `"Group Stage"` - Eliminated in group stage (0 points)
- `"Round of 32"` - Reached Round of 32 (1 point)
- `"Round of 16"` - Reached Round of 16 (3 points)
- `"Quarter-final"` - Reached Quarter-final (6 points)
- `"Semi-final"` - Reached Semi-final (10 points)
- `"Final"` - Reached Final (15 points)
- `"Winner"` - Won the tournament (22 points)

## Update Rules

1. **Only include teams that have been eliminated or won**: You don't need to list every team
2. **Use the exact team names**: Match the team names in the TEAMS array exactly
3. **Deepest stage reached**: Record only the deepest stage a team reached, not every stage
4. **Case-sensitive**: Team names must match exactly

## Examples

### Correct
```javascript
let ACTUAL_RESULTS = {
    "Portugal": "Semi-final",
    "Brazil": "Final"
};
```

### Incorrect ❌
```javascript
// Wrong stage name
let ACTUAL_RESULTS = {
    "Portugal": "Semifinal"  // Should be "Semi-final"
};

// Wrong team name
let ACTUAL_RESULTS = {
    "portugual": "Semi-final"  // Misspelled, should be "Portugal"
};
```

## How Scoring Works

When you update `ACTUAL_RESULTS`:

1. The game **automatically recalculates** all scores
2. A prediction is **correct** if the team reached **at least** the predicted stage
3. Players earn points **only for the stage they predicted**, not cumulative

### Example Calculation

If you update:
```javascript
let ACTUAL_RESULTS = {
    "Portugal": "Final"
};
```

A player who predicted "Portugal → Semi-final" gets:
- **10 points** (Semi-final points)
- NOT 1 + 3 + 6 + 10 points (cumulative)

## Leaderboard Updates

After updating `ACTUAL_RESULTS`:

1. Refresh the browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. All scores automatically recalculate
3. Leaderboard re-sorts based on new scores
4. Tie-breakers apply (see tie-breaker rules in main README)

## Testing

To test the scoring system during development:

```javascript
let ACTUAL_RESULTS = {
    "Portugal": "Winner",
    "Brazil": "Final",
    "Argentina": "Semi-final",
    "France": "Quarter-final",
    "Germany": "Round of 16",
    "England": "Round of 32"
};
```

## Important Notes

⚠️ **Data is stored in browser localStorage**

- Entries are stored locally on each user's device
- If deploying to a server with a backend, integrate with the backend database
- Currently, there's no backend, so data is device-specific

## Future Enhancements

When integrating with a backend:

1. Move `ACTUAL_RESULTS` to server/database
2. Create an admin panel for updating results
3. Add authentication for admin access
4. Store all entries in database instead of localStorage
5. Enable cross-device access to predictions

## Contact

For questions about updating results, see the main portfolio website.
