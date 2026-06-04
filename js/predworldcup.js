// World Cup Prediction Game - Core Logic

// Constants
const REVEAL_DEADLINE = new Date("2026-06-12T00:30:00+05:30");

const TEAMS = [
    "Mexico",
    "South Africa",
    "Korea Republic",
    "Czechia",
    "Canada",
    "Bosnia and Herzegovina",
    "Qatar",
    "Switzerland",
    "Brazil",
    "Morocco",
    "Haiti",
    "Scotland",
    "United States",
    "Paraguay",
    "Australia",
    "Türkiye",
    "Germany",
    "Curaçao",
    "Ivory Coast",
    "Ecuador",
    "Netherlands",
    "Japan",
    "Sweden",
    "Tunisia",
    "Belgium",
    "Egypt",
    "Iran",
    "New Zealand",
    "Spain",
    "Cape Verde",
    "Saudi Arabia",
    "Uruguay",
    "France",
    "Senegal",
    "Iraq",
    "Norway",
    "Argentina",
    "Algeria",
    "Austria",
    "Jordan",
    "Portugal",
    "DR Congo",
    "Uzbekistan",
    "Colombia",
    "England",
    "Croatia",
    "Ghana",
    "Panama"
];

const STAGE_POINTS = {
    "Round of 32": 1,
    "Round of 16": 3,
    "Quarter-final": 6,
    "Semi-final": 10,
    "Final": 15,
    "Winner": 22
};

const STAGE_RANK = {
    "Group Stage": 0,
    "Round of 32": 1,
    "Round of 16": 2,
    "Quarter-final": 3,
    "Semi-final": 4,
    "Final": 5,
    "Winner": 6
};

// Backend API base URL (Railway production)
const BACKEND_URL = "https://worldcup-prediction-backend-production.up.railway.app";

// For LOCAL TESTING ONLY: temporarily swap this to "http://localhost:5001"
// Make sure to revert to Railway URL before pushing to GitHub Pages!

// Populated from backend: { teamName: actualStage }
let ACTUAL_RESULTS = {};

// Test Mode: Add ?testmode=true to URL to see leaderboard before deadline
const urlParams = new URLSearchParams(window.location.search);
const TEST_MODE = urlParams.get('testmode') === 'true';

// Form Elements
const playerNameInput = document.getElementById("playerName");
const playerUsernameInput = document.getElementById("playerUsername");
const predictionForm = document.getElementById("predictionForm");
const submitBtn = document.getElementById("submitBtn");
const teamSelects = document.querySelectorAll(".team-select");
const closedMessage = document.getElementById("closedMessage");
const successMessage = document.getElementById("successMessage");
const globalError = document.getElementById("globalError");
const formSection = document.getElementById("formSection");
const leaderboardSection = document.getElementById("leaderboardSection");
const predictionsModal = document.getElementById("predictionsModal");

// Initialize
function init() {
    populateTeamSelects();
    addEventListeners();
    updateCountdown();
    setInterval(updateCountdown, 1000);
    checkDeadlineAndUpdate();
}

// Populate team dropdowns
function populateTeamSelects() {
    teamSelects.forEach(select => {
        select.innerHTML = '<option value="">-- Select a team --</option>';
        TEAMS.forEach(team => {
            const option = document.createElement("option");
            option.value = team;
            option.textContent = team;
            select.appendChild(option);
        });
    });
}

// Add event listeners
function addEventListeners() {
    playerNameInput.addEventListener("input", validateForm);
    playerUsernameInput.addEventListener("input", validateForm);
    const playerEmailInput = document.getElementById("playerEmail");
    if (playerEmailInput) {
        playerEmailInput.addEventListener("input", validateForm);
    }
    teamSelects.forEach(select => {
        select.addEventListener("change", validateForm);
    });
    predictionForm.addEventListener("submit", handleSubmit);
}

// Validate form
function validateForm() {
    const name = playerNameInput.value.trim();
    const username = playerUsernameInput.value.trim();
    const email = document.getElementById("playerEmail")?.value.trim();
    const selections = Array.from(teamSelects)
        .map(s => s.value)
        .filter(v => v);

    // Clear previous errors
    document.querySelectorAll(".error-message").forEach(el => el.textContent = "");
    globalError.style.display = "none";

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailValid = email && emailRegex.test(email);

    // Validate username (alphanumeric, @, underscore, 3-20 chars)
    const usernameRegex = /^[@a-zA-Z0-9_]{3,20}$/;
    const usernameValid = username && usernameRegex.test(username);

    // Check if form is complete
    const isComplete = name && username && usernameValid && emailValid && selections.length === 8;

    if (isComplete) {
        // Check for duplicates
        const hasDuplicates = new Set(selections).size !== selections.length;
        if (hasDuplicates) {
            globalError.textContent = "You have already selected this team. Each team can only be used once.";
            globalError.style.display = "block";
            submitBtn.disabled = true;
            return;
        }
    }

    submitBtn.disabled = !isComplete;
}

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    if (new Date() > REVEAL_DEADLINE) {
        alert("Entries are now closed!");
        return;
    }

    const name = playerNameInput.value.trim();
    const username = playerUsernameInput.value.trim().toLowerCase(); // Normalize to lowercase
    const email = document.getElementById("playerEmail")?.value.trim();
    const predictions = [];

    if (!name) {
        globalError.textContent = "Name is required";
        globalError.style.display = "block";
        return;
    }

    if (!username) {
        globalError.textContent = "Username is required";
        globalError.style.display = "block";
        return;
    }

    if (!email) {
        globalError.textContent = "Email is required";
        globalError.style.display = "block";
        return;
    }

    if (!isValidEmail(email)) {
        globalError.textContent = "Please enter a valid email address (e.g., user@example.com)";
        globalError.style.display = "block";
        return;
    }

    teamSelects.forEach(select => {
        if (select.value) {
            const stage = select.dataset.stage;
            predictions.push({
                team: select.value,
                predictedStage: stage,
                pointsPossible: STAGE_POINTS[stage],
                isCorrect: false,
                pointsAwarded: 0
            });
        }
    });

    // Disable submit button during submission
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        // Send to backend
        const response = await fetch(`${BACKEND_URL}/api/predictions/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerName: name,
                playerUsername: username,
                playerEmail: email,
                predictions: predictions
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to submit predictions');
        }

        // Show success message
        successMessage.style.display = "block";
        document.getElementById("successName").textContent = `Thank you, ${name}!`;
        predictionForm.style.display = "none";
        globalError.style.display = "none";

        // Remove any existing email message (prevent accumulation on rapid resubmits)
        const existingEmailMsg = successMessage.querySelector('p');
        if (existingEmailMsg) {
            existingEmailMsg.remove();
        }

        // Add message about confirmation email
        const emailMsg = document.createElement('p');
        emailMsg.innerHTML = `<i class="fas fa-envelope"></i> A confirmation email has been sent to <strong>${email}</strong>`;
        emailMsg.style.marginTop = '1rem';
        emailMsg.style.color = 'var(--secondary-color)';
        successMessage.appendChild(emailMsg);

        // Hide success after 7 seconds
        setTimeout(() => {
            successMessage.style.display = "none";
            predictionForm.style.display = "flex";
            predictionForm.reset();
            validateForm();
            emailMsg.remove();
        }, 7000);

    } catch (error) {
        console.error('Submission error:', error);
        globalError.textContent = error.message || 'Failed to submit predictions. Please try again.';
        globalError.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Calculate points for a prediction
function calculatePredictionPoints(predictedStage, actualStage) {
    if (!actualStage) return 0;

    const predictedRank = STAGE_RANK[predictedStage];
    const actualRank = STAGE_RANK[actualStage];

    if (actualRank >= predictedRank) {
        return STAGE_POINTS[predictedStage];
    }

    return 0;
}

// Fetch actual tournament results from backend; populates ACTUAL_RESULTS
async function fetchActualResults() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/predictions/results`);
        if (!res.ok) return;
        const rows = await res.json();
        ACTUAL_RESULTS = {};
        rows.forEach(r => { ACTUAL_RESULTS[r.team_name] = r.actual_stage; });
    } catch (err) {
        console.error('Failed to fetch actual results:', err);
    }
}

// Fetch leaderboard from backend
async function fetchLeaderboard() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/predictions/leaderboard`);
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        return [];
    }
}

// Update countdown timer
function updateCountdown() {
    const now = new Date();
    const diff = REVEAL_DEADLINE - now;

    if (diff <= 0) {
        document.getElementById("days").textContent = "0";
        document.getElementById("hours").textContent = "0";
        document.getElementById("minutes").textContent = "0";
        document.getElementById("seconds").textContent = "0";
        checkDeadlineAndUpdate();
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("days").textContent = String(days).padStart(2, "0");
    document.getElementById("hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

// Check deadline and update UI
async function checkDeadlineAndUpdate() {
    const now = new Date();
    const isAfterDeadline = now > REVEAL_DEADLINE;

    if (isAfterDeadline || TEST_MODE) {
        // After deadline (or test mode): hide form, show closed message + leaderboard
        formSection.style.display = "block";
        predictionForm.style.display = "none";
        closedMessage.style.display = "block";

        // Fetch latest results + leaderboard from backend
        await fetchActualResults();
        const entries = await fetchLeaderboard();
        renderLeaderboard(entries);
    } else {
        // Before deadline: form visible, leaderboard hidden
        closedMessage.style.display = "none";
        formSection.style.display = "block";
        predictionForm.style.display = "flex";
        leaderboardSection.style.display = "none";
    }
}

// Render leaderboard from backend entries (API format: player_username, total_score, etc.)
function renderLeaderboard(entries) {
    const container = document.getElementById("leaderboardContainer");

    if (!entries || entries.length === 0) {
        container.innerHTML = "<p style='text-align: center;'>No predictions yet</p>";
        leaderboardSection.style.display = "block";
        return;
    }

    // Normalize each entry: map API field names + build predictions array
    entries.forEach(entry => {
        entry.username = entry.player_username || entry.username || 'user';
        entry.name = entry.player_name || entry.name || 'Player';
        entry.predictions = [];
        if (entry.r32_1) entry.predictions.push({ team: entry.r32_1, predictedStage: "Round of 32" });
        if (entry.r32_2) entry.predictions.push({ team: entry.r32_2, predictedStage: "Round of 32" });
        if (entry.r16_1) entry.predictions.push({ team: entry.r16_1, predictedStage: "Round of 16" });
        if (entry.r16_2) entry.predictions.push({ team: entry.r16_2, predictedStage: "Round of 16" });
        if (entry.qf) entry.predictions.push({ team: entry.qf, predictedStage: "Quarter-final" });
        if (entry.sf) entry.predictions.push({ team: entry.sf, predictedStage: "Semi-final" });
        if (entry.final_team) entry.predictions.push({ team: entry.final_team, predictedStage: "Final" });
        if (entry.winner) entry.predictions.push({ team: entry.winner, predictedStage: "Winner" });
        // Recompute from current ACTUAL_RESULTS so the UI reflects fresh admin updates
        entry.totalScore = entry.predictions.reduce(
            (sum, p) => sum + calculatePredictionPoints(p.predictedStage, ACTUAL_RESULTS[p.team]),
            0
        );
    });

    // Sort: score desc, then correct winner, then correct finalist, then earliest submission
    entries.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        const aWinner = a.predictions.find(p => p.predictedStage === "Winner");
        const bWinner = b.predictions.find(p => p.predictedStage === "Winner");
        const aWinnerCorrect = aWinner && ACTUAL_RESULTS[aWinner.team] === "Winner" ? 1 : 0;
        const bWinnerCorrect = bWinner && ACTUAL_RESULTS[bWinner.team] === "Winner" ? 1 : 0;
        if (bWinnerCorrect !== aWinnerCorrect) return bWinnerCorrect - aWinnerCorrect;
        const aFinal = a.predictions.find(p => p.predictedStage === "Final");
        const bFinal = b.predictions.find(p => p.predictedStage === "Final");
        const aFinalCorrect = aFinal && (ACTUAL_RESULTS[aFinal.team] === "Final" || ACTUAL_RESULTS[aFinal.team] === "Winner") ? 1 : 0;
        const bFinalCorrect = bFinal && (ACTUAL_RESULTS[bFinal.team] === "Final" || ACTUAL_RESULTS[bFinal.team] === "Winner") ? 1 : 0;
        if (bFinalCorrect !== aFinalCorrect) return bFinalCorrect - aFinalCorrect;
        return new Date(a.submitted_at) - new Date(b.submitted_at);
    });

    container.innerHTML = entries.map((entry, index) => {
        const rank = index + 1;
        let rankClass = "";
        let rankEmoji = "🏅";

        if (rank === 1) {
            rankClass = "rank-1";
            rankEmoji = "🥇";
        } else if (rank === 2) {
            rankClass = "rank-2";
            rankEmoji = "🥈";
        } else if (rank === 3) {
            rankClass = "rank-3";
            rankEmoji = "🥉";
        }

        // Handle both property names
        const username = entry.username || entry.player_username || 'user';
        const totalScore = entry.totalScore || entry.total_score || 0;

        return `
            <div class="leaderboard-card ${rankClass}" data-entry-index="${index}">
                <div class="rank-badge">${rankEmoji}</div>
                <div class="rank-badge number">#${rank}</div>
                <div class="leaderboard-username">@${username}</div>
                <div class="leaderboard-score">${totalScore}</div>
                <div class="leaderboard-click">Click to view predictions</div>
            </div>
        `;
    }).join("");

    // Attach click listeners to leaderboard cards (safer than inline onclick)
    document.querySelectorAll(".leaderboard-card").forEach((card, index) => {
        card.addEventListener("click", () => {
            showPredictionsModal(entries[index]);
        });
        card.style.cursor = "pointer";
    });

    leaderboardSection.style.display = "block";
}

// Modal Functions
function showPredictionsModal(entry) {
    const modal = document.getElementById("predictionsModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    const playerName = entry.name || entry.player_name || 'Player';
    const username = entry.username || entry.player_username || 'user';
    const totalScore = entry.totalScore || entry.total_score || 0;

    modalTitle.textContent = `${playerName} (@${username}) - ${totalScore} pts`;

    // Use global constants (defined at top of file)
    const actualResults = ACTUAL_RESULTS || {};

    // Build predictions display
    const predictions = [
        { stage: "Round of 32", teams: [entry.r32_1, entry.r32_2].filter(t => t), points: 1 },
        { stage: "Round of 16", teams: [entry.r16_1, entry.r16_2].filter(t => t), points: 3 },
        { stage: "Quarter-final", teams: [entry.qf].filter(t => t), points: 6 },
        { stage: "Semi-final", teams: [entry.sf].filter(t => t), points: 10 },
        { stage: "Final", teams: [entry.final_team].filter(t => t), points: 15 },
        { stage: "Winner", teams: [entry.winner].filter(t => t), points: 22 }
    ];

    let html = '<div class="predictions-display">';
    predictions.forEach(pred => {
        if (pred.teams.length > 0) {
            const teamsWithStatus = pred.teams.map(team => {
                const actualStage = actualResults[team];
                let icon = "❓"; // Default: stage not yet reached
                let status = "not-started";

                if (actualStage) {
                    const predictedRank = STAGE_RANK[pred.stage] || 0;
                    const actualRank = STAGE_RANK[actualStage] || 0;

                    if (actualRank >= predictedRank) {
                        // Team reached at least predicted stage = CORRECT
                        icon = "✓";
                        status = "correct";
                    } else {
                        // Team exited before predicted stage = WRONG
                        icon = "✗";
                        status = "wrong";
                    }
                }

                return `<span class="team-with-status ${status}">${team} <span class="status-icon">${icon}</span></span>`;
            }).join(", ");

            html += `
                <div class="prediction-row">
                    <span class="prediction-stage">${pred.stage}</span>
                    <span class="prediction-teams">${teamsWithStatus}</span>
                    <span class="prediction-points">${pred.points} pts</span>
                </div>
            `;
        }
    });
    html += '</div>';

    modalBody.innerHTML = html;
    modal.style.display = "flex";
}

function closePredictionsModal() {
    const modal = document.getElementById("predictionsModal");
    modal.style.display = "none";
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById("predictionsModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
