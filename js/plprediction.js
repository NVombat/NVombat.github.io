const plBackendMeta = document.querySelector('meta[name="backend-url"]');
const plIsLocalFrontend = ["localhost", "127.0.0.1", "0.0.0.0"].includes(
    window.location.hostname
);
const PL_BACKEND_URL = plIsLocalFrontend
    ? `http://${window.location.hostname}:5001`
    : plBackendMeta?.content?.replace(/\/$/, "")
        || "https://worldcup-prediction-backend-production.up.railway.app";

const PL_DEFAULT_DEADLINE = new Date("2026-08-21T19:00:00Z");
const PL_TEAM_COUNT = 20;
const PL_RULES_FALLBACK = {
    cards: [
        {
            icon: "table-list",
            title: "Predict the Table",
            body: "Place all 20 Premier League teams from first to twentieth before the season begins."
        },
        {
            icon: "calculator",
            title: "Table Scoring",
            bullets: [
                "Each team earns 1 / (absolute position difference + 1) points.",
                "A correct position therefore earns 1 point.",
                "Correctly predicting first or twentieth place earns 2 points instead.",
                "The maximum table score is 22 points."
            ]
        },
        {
            icon: "award",
            title: "Season Awards",
            bullets: [
                "Predict the Golden Boot winner.",
                "Predict the Golden Glove winner.",
                "Predict the team that scores the most goals.",
                "Predict the Player of the Season."
            ]
        },
        {
            icon: "lock",
            title: "Entry Rules",
            bullets: [
                "One entry per username and email for this season.",
                "Every team must appear exactly once in the predicted table.",
                "Entries lock when the Premier League season begins.",
                "Award point values will be added when that scoring is finalized."
            ]
        }
    ]
};

let plDeadline = new Date(PL_DEFAULT_DEADLINE);
let plTeams = [];
let plPlayers = [];
let plSubmissionsOpen = false;
let plCountdownTimer = null;
let plModalReturnFocus = null;

const plForm = document.getElementById("plPredictionForm");
const plSubmitButton = document.getElementById("plSubmitButton");
const plDataNotice = document.getElementById("plDataNotice");
const plClosedMessage = document.getElementById("plClosedMessage");
const plGlobalError = document.getElementById("plGlobalError");
const plSuccessMessage = document.getElementById("plSuccessMessage");
const plAdminLink = document.getElementById("plAdminLink");
const plPredictionsModal = document.getElementById("plPredictionsModal");
const plModalClose = document.getElementById("plModalClose");

if (plAdminLink) plAdminLink.href = `${PL_BACKEND_URL}/admin`;

function appendPlText(parent, tag, value, className = "") {
    const element = document.createElement(tag);
    element.textContent = String(value ?? "");
    if (className) element.className = className;
    parent.appendChild(element);
    return element;
}

async function readPlJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function renderPlRules(rules = PL_RULES_FALLBACK) {
    const container = document.getElementById("plRulesContainer");
    if (!container) return;
    container.replaceChildren();
    const cards = Array.isArray(rules?.cards) && rules.cards.length
        ? rules.cards
        : PL_RULES_FALLBACK.cards;

    cards.forEach(card => {
        const article = document.createElement("article");
        article.className = "rule-card";
        const icon = document.createElement("div");
        icon.className = "rule-icon";
        const iconElement = document.createElement("i");
        const safeIcon = /^[a-z0-9-]+$/i.test(card.icon || "") ? card.icon : "circle-info";
        iconElement.className = `fas fa-${safeIcon}`;
        icon.appendChild(iconElement);
        article.appendChild(icon);
        appendPlText(article, "h3", card.title);
        if (card.body) appendPlText(article, "p", card.body);
        if (Array.isArray(card.bullets)) {
            const list = document.createElement("ul");
            list.className = "rules-list";
            card.bullets.forEach(item => appendPlText(list, "li", item));
            article.appendChild(list);
        }
        container.appendChild(article);
    });
}

function teamName(teamId) {
    return plTeams.find(team => team.id === Number(teamId))?.name || "";
}

function playerOptionLabel(player) {
    const club = teamName(player.teamId);
    return club ? `${player.name} - ${club}` : player.name;
}

function addSelectOptions(select, options, labelForOption) {
    select.replaceChildren(new Option("-- Select --", ""));
    options.forEach(item => select.add(new Option(labelForOption(item), String(item.id))));
}

function renderPlFormOptions() {
    const rankingRows = document.getElementById("plRankingRows");
    rankingRows.replaceChildren();
    for (let position = 1; position <= PL_TEAM_COUNT; position += 1) {
        const row = document.createElement("div");
        row.className = "pl-ranking-row";
        appendPlText(row, "span", position, "pl-position");
        const select = document.createElement("select");
        select.id = `plPosition${position}`;
        select.dataset.position = String(position);
        select.setAttribute("aria-label", `Predicted position ${position}`);
        select.required = true;
        addSelectOptions(select, plTeams, team => team.name);
        select.addEventListener("change", refreshPlTeamAvailability);
        row.appendChild(select);
        rankingRows.appendChild(row);
    }

    const allPlayers = [...plPlayers].sort((a, b) => (
        playerOptionLabel(a).localeCompare(playerOptionLabel(b)) || a.id - b.id
    ));
    const goalkeepers = allPlayers.filter(player => player.position === "Goalkeeper");
    addSelectOptions(
        document.getElementById("plGoldenBoot"),
        allPlayers,
        playerOptionLabel
    );
    addSelectOptions(
        document.getElementById("plGoldenGlove"),
        goalkeepers,
        playerOptionLabel
    );
    addSelectOptions(
        document.getElementById("plMostGoals"),
        plTeams,
        team => team.name
    );
    addSelectOptions(
        document.getElementById("plPlayerOfSeason"),
        allPlayers,
        playerOptionLabel
    );
}

function rankingSelects() {
    return Array.from(document.querySelectorAll("#plRankingRows select"));
}

function refreshPlTeamAvailability() {
    const selects = rankingSelects();
    selects.forEach(select => {
        const selectedElsewhere = new Set(
            selects.filter(other => other !== select).map(other => other.value).filter(Boolean)
        );
        Array.from(select.options).forEach(option => {
            if (option.value) option.disabled = selectedElsewhere.has(option.value);
        });
    });
}

function setPlFormState(dataReady) {
    if (!plSubmissionsOpen) {
        plDataNotice.hidden = true;
        plClosedMessage.hidden = false;
        plForm.hidden = true;
        return;
    }
    if (!dataReady) {
        plDataNotice.hidden = false;
        plDataNotice.querySelector("i").className = "fas fa-database";
        plDataNotice.querySelector("p").textContent =
            "Team and player selections are being prepared. Please check back shortly.";
        plClosedMessage.hidden = true;
        plForm.hidden = true;
        return;
    }
    plDataNotice.hidden = true;
    plClosedMessage.hidden = true;
    plForm.hidden = false;
}

function updatePlCountdown() {
    const remaining = Math.max(0, plDeadline.getTime() - Date.now());
    const seconds = Math.floor(remaining / 1000);
    const values = {
        plDays: Math.floor(seconds / 86400),
        plHours: Math.floor((seconds % 86400) / 3600),
        plMinutes: Math.floor((seconds % 3600) / 60),
        plSeconds: seconds % 60
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value).padStart(2, "0");
    });
    document.getElementById("plCountdownSection").hidden = remaining === 0;
    if (remaining === 0 && plSubmissionsOpen) {
        plSubmissionsOpen = false;
        setPlFormState(plTeams.length === PL_TEAM_COUNT && plPlayers.length > 0);
        loadPlLeaderboard();
    }
}

function formatPlDeadline() {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "full",
        timeStyle: "short"
    }).format(plDeadline);
}

async function loadPlGame() {
    renderPlRules();
    try {
        const response = await fetch(`${PL_BACKEND_URL}/api/pl/config`, {
            headers: { Accept: "application/json" }
        });
        const data = await readPlJson(response);
        if (!response.ok) throw new Error(data.error || "PL game configuration is unavailable");

        plDeadline = new Date(data.season.submissionDeadline);
        if (Number.isNaN(plDeadline.getTime())) plDeadline = new Date(PL_DEFAULT_DEADLINE);
        plSubmissionsOpen = Boolean(data.submissionsOpen);
        plTeams = Array.isArray(data.teams)
            ? [...data.teams].sort((a, b) => a.name.localeCompare(b.name))
            : [];
        plPlayers = Array.isArray(data.players) ? data.players : [];
        renderPlRules(data.rules);
        document.getElementById("plSeasonTitle").textContent = data.season.label;
        document.getElementById("plSeasonStatus").textContent =
            plSubmissionsOpen ? "Entries open" : data.season.status;
        document.getElementById("plDeadlineText").textContent =
            `Deadline: Friday, August 21, 2026 at 20:00 BST (${formatPlDeadline()} local time)`;

        const dataReady = Boolean(data.dataReady)
            && plTeams.length === PL_TEAM_COUNT
            && plPlayers.length > 0;
        if (dataReady) renderPlFormOptions();
        setPlFormState(dataReady);
        if (!plSubmissionsOpen) await loadPlLeaderboard();
    } catch (error) {
        console.error("Failed to load PL game:", error);
        plSubmissionsOpen = false;
        plDataNotice.hidden = false;
        plDataNotice.querySelector("i").className = "fas fa-triangle-exclamation";
        plDataNotice.querySelector("p").textContent =
            "Could not reach the prediction service. Please try again.";
        plForm.hidden = true;
    }
    updatePlCountdown();
}

function showPlError(message) {
    plGlobalError.textContent = message;
    plGlobalError.hidden = !message;
    if (message) plGlobalError.scrollIntoView({ behavior: "smooth", block: "center" });
}

function buildPlSubmission() {
    const table = rankingSelects().map(select => ({
        teamId: Number(select.value),
        predictedPosition: Number(select.dataset.position)
    }));
    if (table.some(prediction => !prediction.teamId)) {
        throw new Error("Select a team for every table position.");
    }
    if (new Set(table.map(prediction => prediction.teamId)).size !== PL_TEAM_COUNT) {
        throw new Error("Every team must appear exactly once in your table.");
    }

    const username = document.getElementById("plPlayerUsername").value.trim();
    const normalizedUsername = username.startsWith("@") ? username.slice(1) : username;
    if (!/^[A-Za-z0-9_]{3,20}$/.test(normalizedUsername)) {
        throw new Error("Username must be 3-20 letters, numbers, or underscores.");
    }

    return {
        seasonKey: "2026-2027",
        playerName: document.getElementById("plPlayerName").value.trim(),
        playerUsername: username,
        playerEmail: document.getElementById("plPlayerEmail").value.trim(),
        table,
        awards: {
            goldenBootPlayerId: Number(document.getElementById("plGoldenBoot").value),
            goldenGlovePlayerId: Number(document.getElementById("plGoldenGlove").value),
            mostGoalsTeamId: Number(document.getElementById("plMostGoals").value),
            playerOfSeasonPlayerId: Number(document.getElementById("plPlayerOfSeason").value)
        }
    };
}

async function submitPlPredictions(event) {
    event.preventDefault();
    showPlError("");
    if (!plForm.reportValidity()) return;

    let submission;
    try {
        submission = buildPlSubmission();
        if (Object.values(submission.awards).some(value => !value)) {
            throw new Error("Select all four season predictions.");
        }
    } catch (error) {
        showPlError(error.message);
        return;
    }

    if (!window.confirm("Submit and lock these PL2026-2027 predictions?")) return;
    plSubmitButton.disabled = true;
    plSubmitButton.textContent = "Submitting...";

    try {
        const response = await fetch(`${PL_BACKEND_URL}/api/pl/entries`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(submission)
        });
        const data = await readPlJson(response);
        if (!response.ok) throw new Error(data.error || "Submission failed");

        plForm.hidden = true;
        plSuccessMessage.hidden = false;
        document.getElementById("plSuccessText").textContent =
            `${data.message}. Confirmation code: ${data.confirmationCode}`;
        plSuccessMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
        showPlError(error.message || "Could not submit predictions. Please try again.");
        plSubmitButton.disabled = false;
        plSubmitButton.innerHTML =
            '<i class="fas fa-paper-plane"></i> Submit My PL Predictions';
    }
}

function appendPlCell(row, tag, text, className = "") {
    const cell = document.createElement(tag);
    cell.textContent = String(text ?? "");
    if (className) cell.className = className;
    row.appendChild(cell);
    return cell;
}

function formatPlScore(value) {
    return Number(value || 0).toFixed(3);
}

function renderPlParticipantTable(entries) {
    const container = document.getElementById("plLeaderboardContainer");
    container.replaceChildren();
    if (entries.length === 0) {
        appendPlText(container, "p", "No entries are available.", "pl-table-empty");
        return;
    }

    const table = document.createElement("table");
    table.className = "pl-data-table pl-participant-table";
    const head = table.createTHead().insertRow();
    appendPlCell(head, "th", "Rank", "pl-rank-column");
    appendPlCell(head, "th", "Player");
    appendPlCell(head, "th", "Score", "pl-score-column");
    const body = table.createTBody();

    entries.forEach((entry, index) => {
        const row = body.insertRow();
        if (index < 3) row.classList.add(`pl-rank-${index + 1}`);
        const rankCell = appendPlCell(row, "td", index + 1, "pl-rank-column");
        rankCell.setAttribute("data-label", "Rank");

        const playerCell = document.createElement("td");
        playerCell.setAttribute("data-label", "Player");
        const button = document.createElement("button");
        button.className = "pl-username-button";
        button.type = "button";
        button.textContent = `@${String(entry.player_username || "").replace(/^@/, "")}`;
        button.setAttribute("aria-haspopup", "dialog");
        button.addEventListener("click", event => {
            plModalReturnFocus = event.currentTarget;
            showPlPredictions(entry);
        });
        playerCell.appendChild(button);
        row.appendChild(playerCell);

        const scoreCell = appendPlCell(
            row,
            "td",
            formatPlScore(entry.total_score),
            "pl-score-column"
        );
        scoreCell.setAttribute("data-label", "Score");
    });
    container.appendChild(table);
}

function renderPlLiveTable(tableRows, metadata = {}) {
    const section = document.getElementById("plLiveTableSection");
    const container = document.getElementById("plLiveTableContainer");
    container.replaceChildren();
    if (!Array.isArray(tableRows) || tableRows.length !== PL_TEAM_COUNT) {
        section.hidden = true;
        return;
    }

    const table = document.createElement("table");
    table.className = "pl-data-table pl-live-table";
    const headers = [
        ["Pos", "pl-live-position"],
        ["Club", "pl-live-club"],
        ["Pl", "pl-live-played"],
        ["W", "pl-live-wide"],
        ["D", "pl-live-wide"],
        ["L", "pl-live-wide"],
        ["GF", "pl-live-wide"],
        ["GA", "pl-live-wide"],
        ["GD", "pl-live-gd"],
        ["Pts", "pl-live-points"]
    ];
    const head = table.createTHead().insertRow();
    headers.forEach(([label, className]) => appendPlCell(head, "th", label, className));
    const body = table.createTBody();

    tableRows.forEach(team => {
        const row = body.insertRow();
        if (team.position <= 4) row.classList.add("pl-europe-place");
        if (team.position >= 18) row.classList.add("pl-relegation-place");
        const hasStats = team.source === "fpl_api";
        const values = [
            [team.position, "pl-live-position"],
            [team.teamName, "pl-live-club"],
            [hasStats ? team.played : "-", "pl-live-played"],
            [hasStats ? team.won : "-", "pl-live-wide"],
            [hasStats ? team.drawn : "-", "pl-live-wide"],
            [hasStats ? team.lost : "-", "pl-live-wide"],
            [hasStats ? team.goalsFor : "-", "pl-live-wide"],
            [hasStats ? team.goalsAgainst : "-", "pl-live-wide"],
            [
                hasStats && Number(team.goalDifference) > 0
                    ? `+${team.goalDifference}`
                    : hasStats ? team.goalDifference : "-",
                "pl-live-gd"
            ],
            [hasStats ? team.points : "-", "pl-live-points"]
        ];
        values.forEach(([value, className]) => appendPlCell(row, "td", value, className));
    });
    container.appendChild(table);

    const updated = document.getElementById("plLiveTableUpdated");
    const updatedAt = new Date(metadata.tableUpdatedAt);
    updated.textContent = Number.isNaN(updatedAt.getTime())
        ? "Latest synchronized standings"
        : `Updated ${updatedAt.toLocaleString()}`;
    section.hidden = false;
}

function showPlPredictions(entry) {
    const modalTitle = document.getElementById("plModalTitle");
    const modalBody = document.getElementById("plModalBody");
    const username = String(entry.player_username || "").replace(/^@/, "");
    modalTitle.textContent = `@${username}`;
    modalBody.replaceChildren();

    const summary = document.createElement("div");
    summary.className = "pl-modal-summary";
    appendPlText(summary, "span", "Leaderboard score");
    appendPlText(summary, "strong", formatPlScore(entry.total_score));
    modalBody.appendChild(summary);

    const predictions = Array.isArray(entry.predictions) ? entry.predictions : [];
    const tablePredictions = predictions
        .filter(prediction => prediction.type === "league_position")
        .sort((a, b) => a.position - b.position);
    appendPlText(modalBody, "h3", "Predicted Final Table");
    const tableShell = document.createElement("div");
    tableShell.className = "pl-modal-table-shell";
    const table = document.createElement("table");
    table.className = "pl-prediction-table";
    const head = table.createTHead().insertRow();
    appendPlCell(head, "th", "Pos");
    appendPlCell(head, "th", "Club");
    const body = table.createTBody();
    tablePredictions.forEach(prediction => {
        const row = body.insertRow();
        appendPlCell(row, "td", prediction.position);
        appendPlCell(row, "td", prediction.subjectName);
    });
    tableShell.appendChild(table);
    modalBody.appendChild(tableShell);

    appendPlText(modalBody, "h3", "Season Predictions");
    const awardLabels = {
        golden_boot: "Golden Boot",
        golden_glove: "Golden Glove",
        most_goals: "Most Goals",
        player_of_season: "Player of the Season"
    };
    const awardList = document.createElement("dl");
    awardList.className = "pl-modal-awards";
    predictions
        .filter(prediction => prediction.type !== "league_position")
        .forEach(prediction => {
            appendPlText(
                awardList,
                "dt",
                awardLabels[prediction.type] || prediction.type
            );
            appendPlText(awardList, "dd", prediction.subjectName);
        });
    modalBody.appendChild(awardList);

    plPredictionsModal.hidden = false;
    document.body.classList.add("pl-modal-open");
    plModalClose.focus();
}

function closePlPredictions() {
    if (!plPredictionsModal || plPredictionsModal.hidden) return;
    plPredictionsModal.hidden = true;
    document.body.classList.remove("pl-modal-open");
    plModalReturnFocus?.focus();
    plModalReturnFocus = null;
}

async function loadPlLeaderboard() {
    try {
        const response = await fetch(`${PL_BACKEND_URL}/api/pl/leaderboard`);
        const data = await readPlJson(response);
        if (!response.ok) return;
        const entries = Array.isArray(data.entries) ? data.entries : [];
        renderPlParticipantTable(entries);
        renderPlLiveTable(data.liveTable, data.metadata);
        document.getElementById("plLeaderboardSection").hidden = false;
    } catch (error) {
        console.error("Failed to load PL leaderboard:", error);
    }
}

function renderPlArchives(seasons) {
    const container = document.getElementById("plArchiveList");
    container.replaceChildren();
    const archived = Array.isArray(seasons)
        ? seasons.filter(season => season.archiveAvailable)
        : [];
    if (archived.length === 0) {
        appendPlText(container, "p", "No previous Premier League seasons yet.", "stage-result-empty");
        return;
    }
    archived.forEach(season => {
        const button = document.createElement("button");
        button.className = "cyber-link archive-link-button";
        button.type = "button";
        button.textContent = `${season.label} Results`;
        button.addEventListener("click", () => loadPlArchiveSeason(season));
        container.appendChild(button);
    });
}

function renderPlArchiveRules(rules) {
    const container = document.getElementById("plArchiveRulesContainer");
    container.replaceChildren();
    (Array.isArray(rules?.cards) ? rules.cards : []).forEach(card => {
        const article = document.createElement("article");
        article.className = "archive-rule-card";
        appendPlText(article, "h3", card.title);
        if (card.body) appendPlText(article, "p", card.body);
        if (Array.isArray(card.bullets)) {
            const list = document.createElement("ul");
            list.className = "rules-list";
            card.bullets.forEach(item => appendPlText(list, "li", item));
            article.appendChild(list);
        }
        container.appendChild(article);
    });
}

async function loadPlArchiveSeason(season) {
    try {
        const response = await fetch(
            `${PL_BACKEND_URL}/api/archives/${season.competitionSlug}/${season.seasonSlug}`
        );
        const archive = await readPlJson(response);
        if (!response.ok || !archive.archiveAvailable || !archive.payload) {
            throw new Error(archive.error || "Archive data unavailable");
        }
        document.getElementById("plArchiveTitle").textContent = `${archive.label} Results`;
        const summary = document.getElementById("plArchiveSummary");
        summary.replaceChildren();
        appendPlText(
            summary,
            "p",
            `${archive.summary?.entryCount || 0} entries archived.`
        );
        const entries = archive.payload?.leaderboard?.entries;
        if (Array.isArray(entries) && entries.length) {
            appendPlText(summary, "h3", "Final Leaderboard");
            entries.forEach((entry, index) => {
                appendPlText(
                    summary,
                    "p",
                    `${index + 1}. ${entry.player_username} - ${Number(entry.total_score).toFixed(3)} points`
                );
            });
        }
        document.getElementById("plArchiveRulesTitle").textContent = `${archive.label} Rules`;
        renderPlArchiveRules(archive.payload.rules);
        const panel = document.getElementById("plArchiveResults");
        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        console.error("Failed to load PL archive:", error);
    }
}

async function loadPlArchives() {
    try {
        const response = await fetch(`${PL_BACKEND_URL}/api/archives/premier-league`);
        const data = await readPlJson(response);
        if (!response.ok) throw new Error(data.error || "Archive unavailable");
        renderPlArchives(data.seasons);
    } catch (error) {
        console.error("Failed to load PL archives:", error);
        renderPlArchives([]);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    plForm?.addEventListener("submit", submitPlPredictions);
    plModalClose?.addEventListener("click", closePlPredictions);
    plPredictionsModal
        ?.querySelector(".pl-modal-backdrop")
        ?.addEventListener("click", closePlPredictions);
    await Promise.all([loadPlGame(), loadPlArchives()]);
    plCountdownTimer = window.setInterval(updatePlCountdown, 1000);
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closePlPredictions();
});

window.addEventListener("beforeunload", () => {
    if (plCountdownTimer) window.clearInterval(plCountdownTimer);
});
