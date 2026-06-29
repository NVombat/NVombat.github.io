// World Cup Prediction Game - frontend integration

const DEFAULT_REVEAL_DEADLINE = new Date("2026-06-12T00:30:00+05:30");

const FALLBACK_TEAMS = [
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

const FALLBACK_PREDICTION_SLOTS = [
    { id: "r32-1", stage: "Round of 32", points: 1 },
    { id: "r32-2", stage: "Round of 32", points: 1 },
    { id: "r16-1", stage: "Round of 16", points: 3 },
    { id: "r16-2", stage: "Round of 16", points: 3 },
    { id: "qf", stage: "Quarter-final", points: 6 },
    { id: "sf", stage: "Semi-final", points: 10 },
    { id: "final", stage: "Final", points: 15 },
    { id: "winner", stage: "Winner", points: 22 }
];

const STAGE_RANK = {
    "Group Stage": 0,
    "Round of 32": 1,
    "Round of 16": 2,
    "Quarter-final": 3,
    "Semi-final": 4,
    "Final": 5,
    "Winner": 6
};

const FALLBACK_STAGE_TEAM_COUNTS = {
    "Round of 32": 32,
    "Round of 16": 16,
    "Quarter-final": 8,
    "Semi-final": 4,
    "Final": 2,
    "Winner": 1
};

const backendMeta = document.querySelector('meta[name="backend-url"]');
const isLocalFrontend = ["localhost", "127.0.0.1", "0.0.0.0"].includes(
    window.location.hostname
);
const BACKEND_URL = isLocalFrontend
    ? `http://${window.location.hostname}:5001`
    : backendMeta?.content?.replace(/\/$/, "")
        || "https://worldcup-prediction-backend-production.up.railway.app";
const adminLink = document.getElementById("adminLink");
if (adminLink) adminLink.href = `${BACKEND_URL}/admin`;

let revealDeadline = new Date(DEFAULT_REVEAL_DEADLINE);
let TEAMS = [...FALLBACK_TEAMS].sort((a, b) => a.localeCompare(b));
let PREDICTION_SLOTS = FALLBACK_PREDICTION_SLOTS.map(slot => ({ ...slot }));
let STAGE_TEAM_COUNTS = { ...FALLBACK_STAGE_TEAM_COUNTS };
let actualResults = {};
let leaderboardRefreshInterval = null;
let deadlineState = null;

const playerNameInput = document.getElementById("playerName");
const playerUsernameInput = document.getElementById("playerUsername");
const playerEmailInput = document.getElementById("playerEmail");
const predictionForm = document.getElementById("predictionForm");
const submitBtn = document.getElementById("submitBtn");
const teamSelects = Array.from(document.querySelectorAll(".team-select"));
const closedMessage = document.getElementById("closedMessage");
const successMessage = document.getElementById("successMessage");
const submissionStatus = document.getElementById("submissionStatus");
const globalError = document.getElementById("globalError");
const formSection = document.getElementById("formSection");
const leaderboardSection = document.getElementById("leaderboardSection");
const stageResultsContainer = document.getElementById("stageResultsContainer");
const countdownSection = document.getElementById("countdownSection");
const predictionsModal = document.getElementById("predictionsModal");
const modalClose = document.getElementById("modalClose");

async function init() {
    await syncGameConfig();
    populateTeamSelects();
    addEventListeners();
    updateCountdown();
    await checkDeadlineAndUpdate();
    window.setInterval(updateCountdown, 1000);
}

async function syncGameConfig() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/game-config`, {
            headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error(`Game config request returned ${response.status}`);
        const data = await readJson(response);
        const slots = Array.isArray(data.predictionSlots) ? data.predictionSlots : [];
        const validTeams = Array.isArray(data.teams)
            && data.teams.length === 48
            && new Set(data.teams).size === data.teams.length
            && data.teams.every(team => typeof team === "string" && team.trim());
        const validSlots = slots.length === FALLBACK_PREDICTION_SLOTS.length
            && slots.every((slot, index) => (
                slot?.stage === FALLBACK_PREDICTION_SLOTS[index].stage
                && Number(slot?.points) === FALLBACK_PREDICTION_SLOTS[index].points
            ));
        const stageTeamCounts = data.stageTeamCounts;
        const validStageTeamCounts = stageTeamCounts
            && Object.entries(FALLBACK_STAGE_TEAM_COUNTS).every(
                ([stage, count]) => Number(stageTeamCounts[stage]) === count
            );
        if (!validTeams || !validSlots || !validStageTeamCounts) {
            throw new Error("Backend returned invalid game configuration");
        }

        TEAMS = [...data.teams].sort((a, b) => a.localeCompare(b));
        PREDICTION_SLOTS = slots.map((slot, index) => ({
            id: FALLBACK_PREDICTION_SLOTS[index].id,
            stage: slot.stage,
            points: Number(slot.points)
        }));
        STAGE_TEAM_COUNTS = Object.fromEntries(
            Object.entries(stageTeamCounts).map(([stage, count]) => [stage, Number(count)])
        );
        if (!setRevealDeadline(data.revealDeadline)) {
            throw new Error("Backend returned an invalid reveal deadline");
        }
    } catch (error) {
        console.warn("Using fallback game configuration:", error);
        await syncRevealDeadline();
    }
}

function populateTeamSelects() {
    teamSelects.forEach(select => {
        select.replaceChildren(new Option("-- Select a team --", ""));
        TEAMS.forEach(team => select.appendChild(new Option(team, team)));
    });
}

function addEventListeners() {
    [playerNameInput, playerUsernameInput, playerEmailInput].forEach(input => {
        input.addEventListener("input", validateForm);
    });
    teamSelects.forEach(select => select.addEventListener("change", validateForm));
    predictionForm.addEventListener("submit", handleSubmit);
    modalClose.addEventListener("click", closePredictionsModal);
    predictionsModal.addEventListener("click", event => {
        if (event.target === predictionsModal) closePredictionsModal();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closePredictionsModal();
    });
}

async function readJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function setRevealDeadline(value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    revealDeadline = parsed;
    updateDeadlineText();
    return true;
}

async function syncRevealDeadline() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`, {
            headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error(`Health request returned ${response.status}`);
        const data = await readJson(response);
        if (!setRevealDeadline(data.revealDeadline)) {
            throw new Error("Backend returned an invalid reveal deadline");
        }
    } catch (error) {
        console.warn("Using fallback reveal deadline:", error);
        updateDeadlineText();
    }
}

function updateDeadlineText() {
    const deadlineText = document.getElementById("deadlineText");
    const deadlineRuleText = document.getElementById("deadlineRuleText");
    const formatted = new Intl.DateTimeFormat("en-IN", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Kolkata"
    }).format(revealDeadline);
    deadlineText.textContent = `${formatted} IST`;
    deadlineRuleText.textContent = `Check the leaderboard after ${formatted} IST to see rankings`;
}

function normalizeUsername(value) {
    const username = value.trim().toLowerCase();
    return username.startsWith("@") ? username.slice(1) : username;
}

function collectPredictions() {
    return PREDICTION_SLOTS.map(slot => {
        const select = document.getElementById(slot.id);
        return {
            team: select.value,
            predictedStage: slot.stage,
            pointsPossible: slot.points
        };
    });
}

function validateForm() {
    const name = playerNameInput.value.trim();
    const username = normalizeUsername(playerUsernameInput.value);
    const email = playerEmailInput.value.trim();
    const predictions = collectPredictions();
    const selectedTeams = predictions.map(prediction => prediction.team).filter(Boolean);

    document.querySelectorAll(".error-message").forEach(element => {
        element.textContent = "";
    });
    hideGlobalError();

    const nameValid = name.length >= 2 && name.length <= 100
        && !/[\u0000-\u001F\u007F]/.test(name);
    const usernameValid = /^[A-Za-z0-9_]{3,20}$/.test(username);
    const emailValid = email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const hasAllPredictions = selectedTeams.length === PREDICTION_SLOTS.length;
    const hasUniqueTeams = new Set(selectedTeams).size === selectedTeams.length;
    const usesCanonicalTeams = selectedTeams.every(team => TEAMS.includes(team));
    const isBeforeDeadline = Date.now() < revealDeadline.getTime();

    if (hasAllPredictions && !hasUniqueTeams) {
        showGlobalError("Each team can only be selected once.");
    }

    submitBtn.disabled = !(
        nameValid
        && usernameValid
        && emailValid
        && hasAllPredictions
        && hasUniqueTeams
        && usesCanonicalTeams
        && isBeforeDeadline
    );

    return !submitBtn.disabled;
}

function showGlobalError(message) {
    globalError.textContent = message;
    globalError.style.display = "block";
}

function hideGlobalError() {
    globalError.textContent = "";
    globalError.style.display = "none";
}

function setSubmitLoading(isLoading) {
    submitBtn.replaceChildren();
    const icon = document.createElement("i");
    icon.className = isLoading ? "fas fa-spinner fa-spin" : "fas fa-paper-plane";
    submitBtn.append(icon, document.createTextNode(
        isLoading ? " Submitting..." : " Submit My Predictions"
    ));
    submitBtn.disabled = isLoading;
}

async function handleSubmit(event) {
    event.preventDefault();
    hideGlobalError();

    if (Date.now() >= revealDeadline.getTime()) {
        await checkDeadlineAndUpdate(true);
        return;
    }
    if (!validateForm()) {
        showGlobalError("Please complete every field and select eight unique teams.");
        return;
    }

    const name = playerNameInput.value.trim();
    const username = normalizeUsername(playerUsernameInput.value);
    const email = playerEmailInput.value.trim().toLowerCase();
    const predictions = collectPredictions();
    setSubmitLoading(true);

    try {
        const response = await fetch(`${BACKEND_URL}/api/predictions/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                playerName: name,
                playerUsername: username,
                playerEmail: email,
                predictions
            })
        });
        const data = await readJson(response);

        if (response.status === 403) {
            if (data.revealDeadline) setRevealDeadline(data.revealDeadline);
            showGlobalError(data.error || "Submissions are closed.");
            await checkDeadlineAndUpdate(true);
            return;
        }
        if (response.status === 429) {
            showGlobalError(data.error || "Too many attempts. Please wait and try again.");
            return;
        }
        if (!response.ok) {
            showGlobalError(data.error || "Failed to submit predictions.");
            return;
        }

        const emailEnabled = data.emailEnabled !== false;
        const emailSent = emailEnabled
            && response.status === 200
            && data.emailSent === true;
        showSubmissionOutcome({ name, email, emailEnabled, emailSent });
    } catch (error) {
        console.error("Submission error:", error);
        showGlobalError("Could not reach the prediction service. Please try again.");
    } finally {
        setSubmitLoading(false);
    }
}

function showSubmissionOutcome({ name, email, emailEnabled, emailSent }) {
    predictionForm.style.display = "none";
    successMessage.style.display = "block";
    document.getElementById("successName").textContent = `Thank you, ${name}!`;
    submissionStatus.replaceChildren();

    const message = document.createElement("p");
    message.className = emailSent || !emailEnabled
        ? "submission-confirmed"
        : "submission-warning";
    message.textContent = !emailEnabled
        ? "Your entry is accepted. Email confirmations are currently disabled."
        : emailSent
            ? `Your entry is accepted. A confirmation email was sent to ${email}.`
            : "Your entry is accepted and will appear on the leaderboard. "
                + "The confirmation email could not be sent, so you can retry the receipt below.";
    submissionStatus.appendChild(message);

    if (!emailEnabled || emailSent) {
        window.setTimeout(resetForAnotherEntry, 7000);
        return;
    }

    const actions = document.createElement("div");
    actions.className = "submission-actions";
    const resendButton = createActionButton("Resend confirmation", async () => {
        await resendConfirmation(email, resendButton, message);
    });
    const anotherEntryButton = createActionButton("Submit another entry", resetForAnotherEntry);
    actions.append(resendButton, anotherEntryButton);
    submissionStatus.appendChild(actions);
}

function createActionButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "status-action-button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
}

async function resendConfirmation(email, button, message) {
    button.disabled = true;
    button.textContent = "Sending...";
    try {
        const response = await fetch(`${BACKEND_URL}/api/email/resend-confirmation`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({ playerEmail: email })
        });
        const data = await readJson(response);
        if (response.status === 429) {
            message.textContent = data.error || "Too many resend attempts. Please wait.";
            return;
        }
        if (!response.ok) {
            message.textContent = data.error || "Unable to resend right now. Please try again.";
            return;
        }
        message.className = "submission-confirmed";
        message.textContent = data.message
            || "If a submission exists for that email, a confirmation email will be sent.";
        button.remove();
    } catch (error) {
        console.error("Resend error:", error);
        message.textContent = "Could not reach the email service. Please try again.";
    } finally {
        if (button.isConnected) {
            button.disabled = false;
            button.textContent = "Resend confirmation";
        }
    }
}

function resetForAnotherEntry() {
    successMessage.style.display = "none";
    submissionStatus.replaceChildren();
    predictionForm.reset();
    if (Date.now() >= revealDeadline.getTime()) {
        checkDeadlineAndUpdate(true);
        return;
    }
    predictionForm.style.display = "flex";
    validateForm();
}

async function fetchActualResults() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/predictions/results`);
        if (!response.ok) return;
        const rows = await readJson(response);
        actualResults = Object.fromEntries(
            (Array.isArray(rows) ? rows : []).map(row => [row.team_name, row.actual_stage])
        );
    } catch (error) {
        console.error("Failed to fetch actual results:", error);
    }
}

async function fetchLeaderboard() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/predictions/leaderboard`);
        const data = await readJson(response);
        if (response.status === 403 && data.revealDeadline) {
            setRevealDeadline(data.revealDeadline);
            await checkDeadlineAndUpdate(true);
            return { entries: [], metadata: {} };
        }
        if (!response.ok) return { entries: [], metadata: {} };
        return {
            entries: Array.isArray(data.entries) ? data.entries : [],
            metadata: data.metadata && typeof data.metadata === "object" ? data.metadata : {}
        };
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        return { entries: [], metadata: {} };
    }
}

async function fetchStageHistory() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/predictions/result-stages`);
        const data = await readJson(response);
        if (!response.ok) return [];
        return Array.isArray(data.stages) ? data.stages : [];
    } catch (error) {
        console.error("Failed to fetch stage results:", error);
        return [];
    }
}

function updateCountdown() {
    const difference = revealDeadline.getTime() - Date.now();
    if (difference <= 0) {
        ["days", "hours", "minutes", "seconds"].forEach(id => {
            document.getElementById(id).textContent = "0";
        });
        checkDeadlineAndUpdate();
        return;
    }

    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference % 86400000) / 3600000);
    const minutes = Math.floor((difference % 3600000) / 60000);
    const seconds = Math.floor((difference % 60000) / 1000);
    document.getElementById("days").textContent = String(days).padStart(2, "0");
    document.getElementById("hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

async function checkDeadlineAndUpdate(force = false) {
    const isClosed = Date.now() >= revealDeadline.getTime();
    const nextState = isClosed ? "leaderboard" : "form";
    if (!force && deadlineState === nextState) return;
    deadlineState = nextState;

    if (nextState === "leaderboard") {
        countdownSection.style.display = "none";
        leaderboardSection.style.display = "block";
        formSection.style.display = "block";
        predictionForm.style.display = "none";
        successMessage.style.display = "none";
        closedMessage.style.display = "block";
        await refreshLeaderboard();
        if (!leaderboardRefreshInterval) {
            leaderboardRefreshInterval = window.setInterval(refreshLeaderboard, 5000);
        }
        return;
    }

    countdownSection.style.display = "flex";
    leaderboardSection.style.display = "none";
    closedMessage.style.display = "none";
    formSection.style.display = "block";
    predictionForm.style.display = "flex";
    if (leaderboardRefreshInterval) {
        window.clearInterval(leaderboardRefreshInterval);
        leaderboardRefreshInterval = null;
    }
    validateForm();
}

async function refreshLeaderboard() {
    const [, leaderboard, stages] = await Promise.all([
        fetchActualResults(),
        fetchLeaderboard(),
        fetchStageHistory()
    ]);
    renderLeaderboard(leaderboard.entries, leaderboard.metadata);
    renderStageHistory(stages);
}

function renderStageHistory(stages) {
    stageResultsContainer.replaceChildren();
    (Array.isArray(stages) ? stages : []).forEach(({ label, teams }) => {
        const section = document.createElement("section");
        section.className = "stage-result";

        const heading = document.createElement("h3");
        heading.textContent = `${label} (${teams.length})`;
        const list = document.createElement("div");
        list.className = "stage-result-teams";

        teams.forEach(team => {
            const item = document.createElement("span");
            item.className = "stage-result-team";
            item.textContent = team;
            list.appendChild(item);
        });

        section.append(heading, list);
        stageResultsContainer.appendChild(section);
    });
}

function normalizeLeaderboardEntry(entry) {
    return {
        ...entry,
        name: entry.player_name || "Player",
        username: entry.player_username || "user",
        totalScore: Number(entry.total_score) || 0
    };
}

function renderLeaderboard(entries, metadata) {
    const container = document.getElementById("leaderboardContainer");
    container.replaceChildren();

    const sortStatus = document.createElement("p");
    sortStatus.className = "leaderboard-sort-status";
    sortStatus.textContent = metadata.sortBy === "score"
        ? "Ranked by score. Equal scores are ordered by username."
        : "Listed alphabetically until tournament results are recorded.";
    container.appendChild(sortStatus);

    if (!Array.isArray(entries) || entries.length === 0) {
        const empty = document.createElement("p");
        empty.className = "leaderboard-empty";
        empty.textContent = "No predictions yet.";
        container.appendChild(empty);
        return;
    }

    entries.map(normalizeLeaderboardEntry).forEach((entry, index) => {
        const rank = index + 1;
        const card = document.createElement("article");
        card.className = `leaderboard-card${rank <= 3 ? ` rank-${rank}` : ""}`;
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `View predictions for ${entry.username}`);

        const badge = document.createElement("div");
        badge.className = "rank-badge";
        badge.textContent = rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `#${rank}`;
        const username = document.createElement("div");
        username.className = "leaderboard-username";
        username.textContent = `@${entry.username}`;
        const score = document.createElement("div");
        score.className = "leaderboard-score";
        score.textContent = String(entry.totalScore);
        const instruction = document.createElement("div");
        instruction.className = "leaderboard-click";
        instruction.textContent = "Click to view predictions";

        const picks = document.createElement("div");
        picks.className = "leaderboard-picks";
        predictionRows(entry).forEach(prediction => {
            const row = document.createElement("div");
            row.className = "leaderboard-pick-row";
            const stage = document.createElement("span");
            stage.className = "leaderboard-pick-stage";
            stage.textContent = prediction.stage;
            const teams = document.createElement("span");
            teams.className = "leaderboard-pick-teams";
            prediction.teams.forEach(team => {
                teams.appendChild(createTeamStatus(team, prediction.stage));
            });
            row.append(stage, teams);
            picks.appendChild(row);
        });

        card.append(badge, username, score, picks, instruction);
        const openModal = () => showPredictionsModal(entry);
        card.addEventListener("click", openModal);
        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openModal();
            }
        });
        container.appendChild(card);
    });
}

function predictionRows(entry) {
    return [
        { stage: "Round of 32", teams: [entry.r32_1, entry.r32_2].filter(Boolean), points: 1 },
        { stage: "Round of 16", teams: [entry.r16_1, entry.r16_2].filter(Boolean), points: 3 },
        { stage: "Quarter-final", teams: [entry.qf].filter(Boolean), points: 6 },
        { stage: "Semi-final", teams: [entry.sf].filter(Boolean), points: 10 },
        { stage: "Final", teams: [entry.final_team].filter(Boolean), points: 15 },
        { stage: "Winner", teams: [entry.winner].filter(Boolean), points: 22 }
    ];
}

function showPredictionsModal(entry) {
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");
    modalTitle.textContent = `${entry.name} (@${entry.username}) - ${entry.totalScore} pts`;
    modalBody.replaceChildren();

    const display = document.createElement("div");
    display.className = "predictions-display";
    predictionRows(entry).forEach(prediction => {
        if (prediction.teams.length === 0) return;
        const row = document.createElement("div");
        row.className = "prediction-row";

        const stage = document.createElement("span");
        stage.className = "prediction-stage";
        stage.textContent = prediction.stage;
        const teams = document.createElement("span");
        teams.className = "prediction-teams";
        prediction.teams.forEach(team => {
            teams.appendChild(createTeamStatus(team, prediction.stage));
        });
        const points = document.createElement("span");
        points.className = "prediction-points";
        points.textContent = `${prediction.points} pts`;
        row.append(stage, teams, points);
        display.appendChild(row);
    });

    modalBody.appendChild(display);
    predictionsModal.style.display = "flex";
}

function createTeamStatus(team, predictedStage) {
    const actualStage = actualResults[team];
    const wrapper = document.createElement("span");
    let status = "not-started";
    let icon = "?";
    let statusLabel = "Pending";
    if (actualStage && STAGE_RANK[actualStage] >= STAGE_RANK[predictedStage]) {
        status = "correct";
        icon = "✓";
        statusLabel = "Correct";
    } else if (isStageComplete(predictedStage)) {
        status = "wrong";
        icon = "✗";
        statusLabel = "Wrong";
    }
    wrapper.className = `team-with-status ${status}`;
    wrapper.title = `${team}: ${statusLabel}`;
    wrapper.append(document.createTextNode(`${team} `));
    const statusIcon = document.createElement("span");
    statusIcon.className = "status-icon";
    statusIcon.textContent = icon;
    wrapper.appendChild(statusIcon);
    return wrapper;
}

function isStageComplete(stage) {
    const expectedCount = STAGE_TEAM_COUNTS[stage];
    const stageRank = STAGE_RANK[stage];
    if (!expectedCount || stageRank === undefined) return false;
    return Object.values(actualResults).filter(
        actualStage => STAGE_RANK[actualStage] >= stageRank
    ).length >= expectedCount;
}

function closePredictionsModal() {
    predictionsModal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", init);
