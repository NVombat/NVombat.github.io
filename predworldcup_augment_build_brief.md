# Augment Code Build Brief: `/predworldcup` World Cup Prediction Game

## Goal

Add a new page / pages to the existing website at:

```text
/predworldcup
```

This page should allow a group of people to submit World Cup knockout-stage predictions before the tournament begins. Each person enters their name and selects a set of teams along with the round they predict each team will reach. The website should automatically calculate points once actual team progress is entered or updated.

The game should support private entries before the World Cup starts. Users should be able to submit their own entry, but they should **not be able to view other people’s entries until the countdown ends**.

The countdown deadline is:

```text
12 June 2026, 12:30 AM IST
```

In code, use this exact timestamp:

```ts
2026-06-12T00:30:00+05:30
```

---

## 1. Page route

Create a new page/route:

```text
/predworldcup
```

The implementation should follow the routing conventions of the existing project.

Examples:

If this is a Next.js App Router project:

```text
app/predworldcup/page.tsx
```

If this is a Next.js Pages Router project:

```text
pages/predworldcup.tsx
```

If this is React Router:

```text
/predworldcup
```

Use the existing website layout, styling, header, footer, design system, and UI components wherever possible.

---

## 2. Game name

Use this title on the page:

```text
World Cup Prediction Game
```

Subtitle:

```text
Pick the teams. Predict their journey. Score points when they reach your chosen stage.
```

---

## 3. Main game rule

Each participant submits one entry using their name.

Each entry consists of a fixed set of team predictions.

A prediction has:

```text
Team + Predicted Round
```

Example:

```text
Portugal — Semi-final
Brazil — Winner
Japan — Round of 16
```

A person cannot select the same team more than once in their own entry.

For example, this is invalid:

```text
Portugal — Round of 16
Portugal — Semi-final
```

This is valid:

```text
Portugal — Semi-final
Brazil — Final
Japan — Round of 16
```

---

## 4. Prediction stages

The allowed prediction stages are:

```ts
[
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
  "Winner"
]
```

Use these exact labels in the UI.

---

## 5. Scoring rules

The scoring system should be:

| Predicted stage | Points |
|---|---:|
| Round of 32 | 1 |
| Round of 16 | 3 |
| Quarter-final | 6 |
| Semi-final | 10 |
| Final | 15 |
| Winner | 22 |

Represent this in code as:

```ts
const STAGE_POINTS = {
  "Round of 32": 1,
  "Round of 16": 3,
  "Quarter-final": 6,
  "Semi-final": 10,
  "Final": 15,
  "Winner": 22
};
```

---

## 6. How a prediction becomes correct

A prediction is correct if the team reaches **at least** the predicted stage.

Examples:

```text
Portugal — Round of 16
```

If Portugal reaches the Round of 16, Quarter-final, Semi-final, Final, or wins the World Cup, the prediction is correct.

```text
Portugal — Semi-final
```

If Portugal reaches the Semi-final, Final, or wins the World Cup, the prediction is correct.

```text
Portugal — Winner
```

This is correct only if Portugal wins the World Cup.

---

## 7. Important scoring clarification

Do not award cumulative points.

If someone predicts:

```text
Portugal — Semi-final
```

and Portugal reaches the semi-final, they get:

```text
10 points
```

They should **not** get:

```text
1 + 3 + 6 + 10
```

Each prediction is worth only the point value of the selected stage.

---

## 8. Recommended entry format

Each player should submit **8 predictions**.

Use this structure:

| Prediction type | Number of picks | Points per correct pick |
|---|---:|---:|
| Round of 32 | 2 | 1 |
| Round of 16 | 2 | 3 |
| Quarter-final | 1 | 6 |
| Semi-final | 1 | 10 |
| Final | 1 | 15 |
| Winner | 1 | 22 |

Total predictions per player:

```text
8
```

Maximum possible score:

```text
61 points
```

The form should enforce this structure.

---

## 9. Entry form requirements

The page should include a form where a person can submit their entry.

The form should have:

```text
Name
Round of 32 team 1
Round of 32 team 2
Round of 16 team 1
Round of 16 team 2
Quarter-final team
Semi-final team
Final team
Winner team
```

Each team input can be a dropdown or searchable select.

The same team cannot be selected twice in one entry.

If the user tries to select the same team twice, show a validation error:

```text
You have already selected this team. Each team can only be used once.
```

The submit button should be disabled until:

```text
1. Name is filled
2. All 8 team selections are filled
3. No duplicate teams are selected
```

---

## 10. Team list

Use the 48 World Cup teams as options.

Create the team list in one central location so it is easy to update later.

Suggested structure:

```ts
const TEAMS = [
  "Mexico",
  "South Africa",
  "Republic of Korea",
  "Czechia",
  "Canada",
  "Switzerland",
  "Qatar",
  "Bosnia and Herzegovina",
  "Brazil",
  "Morocco",
  "Scotland",
  "Haiti",
  "USA",
  "Paraguay",
  "Australia",
  "Turkey",
  "Germany",
  "Ecuador",
  "Ivory Coast",
  "Curaçao",
  "Netherlands",
  "Japan",
  "Sweden",
  "Tunisia",
  "Belgium",
  "Egypt",
  "Iran",
  "New Zealand",
  "Spain",
  "Uruguay",
  "Saudi Arabia",
  "Cape Verde",
  "France",
  "Senegal",
  "Norway",
  "Iraq",
  "Argentina",
  "Austria",
  "Algeria",
  "Jordan",
  "Portugal",
  "Colombia",
  "DR Congo",
  "Uzbekistan",
  "England",
  "Croatia",
  "Ghana",
  "Panama"
];
```

Note: The final confirmed list of 48 teams may need to be updated later if the tournament field changes or if some qualification/playoff spots are not final in the current source data. Keep the team list centralized so it is easy to revise.

---

## 11. Countdown and privacy lock

Before the World Cup starts, show a countdown to:

```ts
const REVEAL_DEADLINE = "2026-06-12T00:30:00+05:30";
```

Before this deadline, users should be able to:

```text
1. Submit their own entry
2. See a confirmation after submitting
3. See the countdown timer
```

Before this deadline, users should not be able to:

```text
1. See the full table of everyone’s entries
2. See the leaderboard
3. See other people’s predictions
```

Instead, show this message:

```text
Entries are hidden until the World Cup begins.
All predictions will be revealed on 12 June 2026 at 12:30 AM IST.
```

After this deadline, users should be able to see:

```text
1. Full predictions table
2. Leaderboard
3. Each person’s total score
```

---

## 12. Submission lock

Once the countdown reaches the deadline, submissions should close.

After:

```text
12 June 2026, 12:30 AM IST
```

hide or disable the form and show:

```text
Entries are now closed. Predictions are locked.
```

This prevents users from submitting predictions after the tournament has started.

---

## 13. Data storage requirement

The entries must be stored persistently.

Use the existing project’s backend/database if available.

If no backend exists yet, implement the feature in a way that can easily be connected later.

Minimum data model:

```ts
type PredictionStage =
  | "Round of 32"
  | "Round of 16"
  | "Quarter-final"
  | "Semi-final"
  | "Final"
  | "Winner";

type Prediction = {
  team: string;
  predictedStage: PredictionStage;
  pointsPossible: number;
  isCorrect?: boolean;
  pointsAwarded?: number;
};

type Entry = {
  id: string;
  name: string;
  predictions: Prediction[];
  totalScore: number;
  submittedAt: string;
};
```

---

## 14. Actual results data model

The website needs a way to calculate scores automatically based on how far each team actually went.

Create a central object for actual team progress.

Example:

```ts
const ACTUAL_RESULTS = {
  "Portugal": "Quarter-final",
  "Brazil": "Semi-final",
  "Argentina": "Winner"
};
```

Use the same stages:

```ts
[
  "Group Stage",
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
  "Winner"
]
```

The actual result should represent the deepest stage reached by each team.

For example:

```text
If Portugal loses in the quarter-final, their actual result is "Quarter-final".
If Brazil loses in the semi-final, their actual result is "Semi-final".
If Argentina wins the World Cup, their actual result is "Winner".
```

---

## 15. Stage ranking logic

To calculate whether a prediction is correct, assign each stage a rank.

```ts
const STAGE_RANK = {
  "Group Stage": 0,
  "Round of 32": 1,
  "Round of 16": 2,
  "Quarter-final": 3,
  "Semi-final": 4,
  "Final": 5,
  "Winner": 6
};
```

A prediction is correct if:

```ts
STAGE_RANK[actualStage] >= STAGE_RANK[predictedStage]
```

Example:

```text
Predicted: Semi-final
Actual: Final
Correct: yes
```

Example:

```text
Predicted: Winner
Actual: Final
Correct: no
```

---

## 16. Points calculation function

Implement a function like this:

```ts
function calculatePredictionPoints(predictedStage, actualStage) {
  if (!actualStage) return 0;

  const predictedRank = STAGE_RANK[predictedStage];
  const actualRank = STAGE_RANK[actualStage];

  if (actualRank >= predictedRank) {
    return STAGE_POINTS[predictedStage];
  }

  return 0;
}
```

Then calculate a player’s total score by summing the points from all 8 predictions.

---

## 17. Predictions table

After the reveal deadline, show a table of all entries.

Columns:

```text
Name
Round of 32 Picks
Round of 16 Picks
Quarter-final Pick
Semi-final Pick
Final Pick
Winner Pick
Total Score
Submitted At
```

Example:

| Name | R32 | R16 | QF | SF | Final | Winner | Score |
|---|---|---|---|---|---|---|---:|
| Nikhill | USA, Ghana | Portugal, Japan | Netherlands | France | Brazil | Argentina | 39 |

Sort by:

```text
Highest total score first
```

---

## 18. Leaderboard

After the reveal deadline, show a leaderboard.

Columns:

```text
Rank
Name
Total Score
Correct Predictions
```

Sort by:

```text
Total Score descending
```

If two people have the same score, use tie-breakers.

---

## 19. Tie-breakers

Use this order:

```text
1. Higher total score
2. Correct winner prediction
3. Correct finalist prediction
4. Correct semi-final prediction
5. Most total correct predictions
6. Earlier submitted entry
```

---

## 20. Page sections

The `/predworldcup` page should have these sections:

```text
1. Hero section
2. Countdown section
3. Rules section
4. Submit entry form
5. Hidden entries message before deadline
6. Predictions table after deadline
7. Leaderboard after deadline
```

---

## 21. Rules section text for website

Use this text on the page:

```text
How the game works

Each player selects 8 teams and predicts how far each team will go in the World Cup.

You must make:
- 2 Round of 32 picks
- 2 Round of 16 picks
- 1 Quarter-final pick
- 1 Semi-final pick
- 1 Final pick
- 1 Winner pick

You cannot select the same team more than once.

If a team reaches at least the stage you predicted, you score the points for that stage.

Points:
- Round of 32: 1 point
- Round of 16: 3 points
- Quarter-final: 6 points
- Semi-final: 10 points
- Final: 15 points
- Winner: 22 points

Example:
If you choose Portugal to reach the Semi-final and Portugal reaches the Final, you get 10 points.

The prediction table and leaderboard will remain hidden until the World Cup begins.
Entries close on 12 June 2026 at 12:30 AM IST.
```

---

## 22. UI expectations

The page should be clean, fun, and easy to use.

Suggested design:

```text
World Cup / football theme
Cards for scoring rules
Countdown timer prominently displayed
Clear form layout
Tables should be responsive on mobile
Use badges or chips for team names
Use highlighted cards for leaderboard ranks 1, 2, and 3
```

The page should work well on:

```text
Desktop
Tablet
Mobile
```

---

## 23. Validation rules

The form should validate:

```text
Name is required
All 8 picks are required
No duplicate teams within the same entry
Submission is blocked after the deadline
Submitted entries should not be publicly visible before the deadline
```

---

## 24. Admin/result update requirement

Add a clean place in the code where actual results can be updated.

It can be simple for now.

For example:

```ts
const ACTUAL_RESULTS = {};
```

Later, the admin can update this as the tournament progresses:

```ts
const ACTUAL_RESULTS = {
  "Mexico": "Round of 16",
  "Brazil": "Quarter-final",
  "France": "Final",
  "Argentina": "Winner"
};
```

Whenever this object changes, all scores should recalculate automatically.

---

## 25. Acceptance criteria

The feature is complete when:

```text
1. /predworldcup loads successfully.
2. Users can submit their name and 8 predictions.
3. The same team cannot be selected twice by the same user.
4. Points are calculated automatically using the scoring rules.
5. Before 12 June 2026, 12:30 AM IST, the full table and leaderboard are hidden.
6. Before the deadline, the countdown timer is visible.
7. After the deadline, the full prediction table is visible.
8. After the deadline, the leaderboard is visible.
9. After the deadline, new submissions are disabled.
10. The page is responsive and follows the existing site design.
```

---

## 26. Important implementation note

Before coding, inspect the existing repository structure and determine:

```text
1. What framework the website uses
2. How routes/pages are created
3. Whether there is an existing database/backend
4. Whether there are existing UI components to reuse
5. How deployment is currently handled
```

Then implement the feature using the project’s existing conventions.


