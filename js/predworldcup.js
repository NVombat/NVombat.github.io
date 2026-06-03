// World Cup Prediction Game - Core Logic

// Constants
const REVEAL_DEADLINE = new Date("2026-06-12T00:30:00+05:30");

const TEAMS = [
    "Mexico", "South Africa", "Republic of Korea", "Czechia", "Canada", "Switzerland",
    "Qatar", "Bosnia and Herzegovina", "Brazil", "Morocco", "Scotland", "Haiti",
    "USA", "Paraguay", "Australia", "Turkey", "Germany", "Ecuador", "Ivory Coast",
    "Curaçao", "Netherlands", "Japan", "Sweden", "Tunisia", "Belgium", "Egypt",
    "Iran", "New Zealand", "Spain", "Uruguay", "Saudi Arabia", "Cape Verde",
    "France", "Senegal", "Norway", "Iraq", "Argentina", "Austria", "Algeria",
    "Jordan", "Portugal", "Colombia", "DR Congo", "Uzbekistan", "England",
    "Croatia", "Ghana", "Panama"
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

// Admin: Update actual results here
let ACTUAL_RESULTS = {};

// Storage
const STORAGE_KEY = "worldcup_predictions";

// Form Elements
const playerNameInput = document.getElementById("playerName");
const predictionForm = document.getElementById("predictionForm");
const submitBtn = document.getElementById("submitBtn");
const teamSelects = document.querySelectorAll(".team-select");
const closedMessage = document.getElementById("closedMessage");
const successMessage = document.getElementById("successMessage");
const globalError = document.getElementById("globalError");
const formSection = document.getElementById("formSection");
const entriesMessage = document.getElementById("entriesMessage");
const predictionsSection = document.getElementById("predictionsSection");
const leaderboardSection = document.getElementById("leaderboardSection");

// Initialize
function init() {
    populateTeamSelects();
    addEventListeners();
    updateCountdown();
    setInterval(updateCountdown, 1000);
    checkDeadlineAndUpdate();
    renderPredictions();
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

    // Check if form is complete
    const isComplete = name && emailValid && selections.length === 8;

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

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    if (new Date() > REVEAL_DEADLINE) {
        alert("Entries are now closed!");
        return;
    }

    const name = playerNameInput.value.trim();
    const email = document.getElementById("playerEmail")?.value.trim();
    const predictions = [];

    if (!email) {
        globalError.textContent = "Email is required";
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
        const response = await fetch('http://localhost:5000/api/predictions/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerName: name,
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

// Load entries from storage
function loadEntries() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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

// Calculate total score for an entry
function calculateTotalScore(predictions) {
    return predictions.reduce((total, pred) => {
        const actualStage = ACTUAL_RESULTS[pred.team];
        const points = calculatePredictionPoints(pred.predictedStage, actualStage);
        return total + points;
    }, 0);
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
function checkDeadlineAndUpdate() {
    const now = new Date();
    const isAfterDeadline = now > REVEAL_DEADLINE;

    if (isAfterDeadline) {
        // Hide form and show locked message
        formSection.style.display = "block";
        predictionForm.style.display = "none";
        closedMessage.style.display = "block";
        entriesMessage.style.display = "none";

        // Show predictions and leaderboard
        renderPredictions();
        renderLeaderboard();
    } else {
        // Before deadline
        closedMessage.style.display = "none";
        formSection.style.display = "block";
        predictionForm.style.display = "flex";

        if (loadEntries().length > 0) {
            entriesMessage.style.display = "block";
            predictionsSection.style.display = "none";
            leaderboardSection.style.display = "none";
        } else {
            entriesMessage.style.display = "none";
        }
    }
}

// Render predictions table
function renderPredictions() {
    const entries = loadEntries();
    const tableBody = document.getElementById("predictionsTableBody");

    if (entries.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='8' style='text-align: center; padding: 2rem;'>No predictions yet</td></tr>";
        return;
    }

    // Sort by score descending
    entries.sort((a, b) => {
        const scoreA = calculateTotalScore(a.predictions);
        const scoreB = calculateTotalScore(b.predictions);
        return scoreB - scoreA;
    });

    tableBody.innerHTML = entries.map(entry => {
        const predictions = entry.predictions;
        const r32 = predictions.filter(p => p.predictedStage === "Round of 32").map(p => p.team);
        const r16 = predictions.filter(p => p.predictedStage === "Round of 16").map(p => p.team);
        const qf = predictions.find(p => p.predictedStage === "Quarter-final")?.team || "-";
        const sf = predictions.find(p => p.predictedStage === "Semi-final")?.team || "-";
        const final = predictions.find(p => p.predictedStage === "Final")?.team || "-";
        const winner = predictions.find(p => p.predictedStage === "Winner")?.team || "-";
        const score = calculateTotalScore(predictions);

        const formatTeams = (teams) => teams.length > 0 ? teams.join(", ") : "-";

        return `
            <tr>
                <td><strong>${entry.name}</strong></td>
                <td class="picks-col">${formatTeams(r32)}</td>
                <td class="picks-col">${formatTeams(r16)}</td>
                <td class="picks-col">${qf}</td>
                <td class="picks-col">${sf}</td>
                <td class="picks-col">${final}</td>
                <td class="picks-col">${winner}</td>
                <td class="score-col">${score}</td>
            </tr>
        `;
    }).join("");

    predictionsSection.style.display = "block";
}

// Render leaderboard
function renderLeaderboard() {
    const entries = loadEntries();

    if (entries.length === 0) {
        leaderboardSection.innerHTML = "<p style='text-align: center;'>No predictions yet</p>";
        return;
    }

    // Calculate scores and sort
    entries.forEach(entry => {
        entry.totalScore = calculateTotalScore(entry.predictions);
        entry.correctCount = entry.predictions.filter(p => {
            const actualStage = ACTUAL_RESULTS[p.team];
            return calculatePredictionPoints(p.predictedStage, actualStage) > 0;
        }).length;
    });

    entries.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        // Tie-breaker: correct winner
        const aWinner = a.predictions.find(p => p.predictedStage === "Winner");
        const bWinner = b.predictions.find(p => p.predictedStage === "Winner");
        const aWinnerCorrect = aWinner && ACTUAL_RESULTS[aWinner.team] === "Winner" ? 1 : 0;
        const bWinnerCorrect = bWinner && ACTUAL_RESULTS[bWinner.team] === "Winner" ? 1 : 0;
        if (bWinnerCorrect !== aWinnerCorrect) return bWinnerCorrect - aWinnerCorrect;
        // Tie-breaker: correct finalist
        const aFinal = a.predictions.find(p => p.predictedStage === "Final");
        const bFinal = b.predictions.find(p => p.predictedStage === "Final");
        const aFinalCorrect = aFinal && (ACTUAL_RESULTS[aFinal.team] === "Final" || ACTUAL_RESULTS[aFinal.team] === "Winner") ? 1 : 0;
        const bFinalCorrect = bFinal && (ACTUAL_RESULTS[bFinal.team] === "Final" || ACTUAL_RESULTS[bFinal.team] === "Winner") ? 1 : 0;
        if (bFinalCorrect !== aFinalCorrect) return bFinalCorrect - aFinalCorrect;
        return a.submittedAt - b.submittedAt;
    });

    const container = document.getElementById("leaderboardContainer");
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

        return `
            <div class="leaderboard-card ${rankClass}">
                <div class="rank-badge">${rankEmoji}</div>
                <div class="rank-badge number">#${rank}</div>
                <h3>${entry.name}</h3>
                <div class="leaderboard-score">${entry.totalScore}</div>
                <div class="leaderboard-correct">${entry.correctCount} correct predictions</div>
            </div>
        `;
    }).join("");

    leaderboardSection.style.display = "block";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
