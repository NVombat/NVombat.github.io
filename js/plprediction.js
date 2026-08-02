const plBackendMeta = document.querySelector('meta[name="backend-url"]');
const plIsLocalFrontend = ["localhost", "127.0.0.1", "0.0.0.0"].includes(
    window.location.hostname
);
const PL_BACKEND_URL = plIsLocalFrontend
    ? `http://${window.location.hostname}:5001`
    : plBackendMeta?.content?.replace(/\/$/, "")
        || "https://worldcup-prediction-backend-production.up.railway.app";

const PL_TEAM_COUNT = 20;
let plMaximumSwaps = 3;
let plMaximumAffectedTeams = 6;

let plDeadline = null;
let plSeasonKey = "";
let plSeasonLabel = "Premier League";
let plTeams = [];
let plPlayers = [];
let plSubmissionsOpen = false;
let plCountdownTimer = null;
let plModalReturnFocus = null;
let plMidseason = { status: "pending" };
let plMidseasonToken = "";
let plMidseasonEntry = null;
let plSwapOriginal = [];
let plSwapWorking = [];
let plSwapSelectedPosition = null;

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

function renderPlRules(rules) {
    const container = document.getElementById("plRulesContainer");
    if (!container) return;
    container.replaceChildren();
    const cards = Array.isArray(rules?.cards) ? rules.cards : [];

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

function setupPlayerCombobox(valueId, players) {
    const wrapper = document.querySelector(`[data-player-combobox="${valueId}"]`);
    const input = wrapper?.querySelector(".pl-player-search");
    const valueInput = document.getElementById(valueId);
    const list = wrapper?.querySelector(".pl-player-options");
    if (!wrapper || !input || !valueInput || !list) return;

    const options = players.map(player => ({
        id: String(player.id),
        label: playerOptionLabel(player),
        searchText: `${player.name} ${teamName(player.teamId)}`.toLocaleLowerCase()
    }));
    let visibleOptions = [];
    let activeIndex = -1;

    function closeList() {
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
        activeIndex = -1;
    }

    function selectPlayer(option) {
        valueInput.value = option.id;
        input.value = option.label;
        input.setCustomValidity("");
        closeList();
    }

    function setActiveOption(index) {
        const optionButtons = Array.from(list.querySelectorAll(".pl-player-option"));
        if (optionButtons.length === 0) return;
        activeIndex = Math.max(0, Math.min(index, optionButtons.length - 1));
        optionButtons.forEach((button, buttonIndex) => {
            const active = buttonIndex === activeIndex;
            button.classList.toggle("active", active);
            button.setAttribute("aria-selected", String(active));
        });
        const activeButton = optionButtons[activeIndex];
        input.setAttribute("aria-activedescendant", activeButton.id);
        activeButton.scrollIntoView({ block: "nearest" });
    }

    function renderOptions(query = "") {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        visibleOptions = options
            .filter(option => !normalizedQuery || option.searchText.includes(normalizedQuery));
        list.replaceChildren();
        activeIndex = -1;
        input.removeAttribute("aria-activedescendant");

        if (visibleOptions.length === 0) {
            appendPlText(list, "p", "No matching players", "pl-player-empty");
            return;
        }

        visibleOptions.forEach((option, index) => {
            const button = document.createElement("button");
            button.className = "pl-player-option";
            button.id = `${list.id}-option-${index}`;
            button.type = "button";
            button.setAttribute("role", "option");
            button.setAttribute("aria-selected", "false");
            button.textContent = option.label;
            button.addEventListener("mousedown", event => event.preventDefault());
            button.addEventListener("click", () => selectPlayer(option));
            list.appendChild(button);
        });
    }

    function openList(query = "") {
        renderOptions(query);
        list.hidden = false;
        input.setAttribute("aria-expanded", "true");
    }

    input.addEventListener("focus", () => {
        openList(valueInput.value ? "" : input.value);
    });
    input.addEventListener("input", () => {
        valueInput.value = "";
        input.setCustomValidity(input.value.trim() ? "Select a player from the list." : "");
        openList(input.value);
    });
    input.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeList();
            return;
        }
        if (event.key === "Tab") {
            closeList();
            return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (list.hidden) openList(valueInput.value ? "" : input.value);
            const direction = event.key === "ArrowDown" ? 1 : -1;
            const startIndex = activeIndex < 0
                ? (direction > 0 ? 0 : visibleOptions.length - 1)
                : activeIndex + direction;
            setActiveOption(startIndex);
            return;
        }
        if (event.key === "Enter" && !list.hidden && activeIndex >= 0) {
            event.preventDefault();
            selectPlayer(visibleOptions[activeIndex]);
        }
    });
    input.addEventListener("invalid", () => {
        if (input.value.trim() && !valueInput.value) {
            input.setCustomValidity("Select a player from the list.");
        }
        openList(input.value);
    });
    document.addEventListener("pointerdown", event => {
        if (!wrapper.contains(event.target)) closeList();
    });
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

        const selectedTeam = document.createElement("button");
        selectedTeam.className = "pl-selected-team";
        selectedTeam.type = "button";
        selectedTeam.hidden = true;
        const selectedTeamName = appendPlText(
            selectedTeam,
            "span",
            "",
            "pl-selected-team-name"
        );
        const clearIcon = document.createElement("i");
        clearIcon.className = "fas fa-xmark";
        clearIcon.setAttribute("aria-hidden", "true");
        selectedTeam.appendChild(clearIcon);
        selectedTeam.addEventListener("click", () => {
            select.value = "";
            selectedTeamName.textContent = "";
            refreshPlTeamAvailability();
            select.focus();
        });
        row.appendChild(selectedTeam);
        rankingRows.appendChild(row);
    }

    const allPlayers = [...plPlayers].sort((a, b) => (
        playerOptionLabel(a).localeCompare(playerOptionLabel(b)) || a.id - b.id
    ));
    const goalkeepers = allPlayers.filter(player => player.position === "Goalkeeper");
    setupPlayerCombobox("plGoldenBoot", allPlayers);
    setupPlayerCombobox("plGoldenGlove", goalkeepers);
    addSelectOptions(
        document.getElementById("plMostGoals"),
        plTeams,
        team => team.name
    );
    setupPlayerCombobox("plPlayerOfSeason", allPlayers);
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

        const selectedTeam = select.parentElement?.querySelector(".pl-selected-team");
        const selectedTeamName = selectedTeam?.querySelector(".pl-selected-team-name");
        const name = teamName(select.value);
        select.hidden = Boolean(name);
        if (selectedTeam && selectedTeamName) {
            selectedTeam.hidden = !name;
            selectedTeamName.textContent = name;
            selectedTeam.setAttribute(
                "aria-label",
                name
                    ? `Unselect ${name} from predicted position ${select.dataset.position}`
                    : `No team selected for predicted position ${select.dataset.position}`
            );
        }
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
    if (!(plDeadline instanceof Date) || Number.isNaN(plDeadline.getTime())) {
        document.getElementById("plCountdownSection").hidden = true;
        return;
    }
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

function formatPlDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ""
        : new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(date);
}

function showPlMidseasonMessage(message, kind = "error") {
    const element = document.getElementById("plMidseasonMessage");
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("success-message-inline", kind === "success");
    element.hidden = !message;
}

function renderPlMidseasonState() {
    const section = document.getElementById("plMidseasonSection");
    const status = document.getElementById("plMidseasonStatus");
    const notice = document.getElementById("plMidseasonNotice");
    const authForm = document.getElementById("plMidseasonAuthForm");
    const editor = document.getElementById("plSwapEditor");
    if (!section || !status || !notice || !authForm || !editor) return;

    const labels = {
        pending: "Waiting for Gameweek 19",
        open: "Update window open",
        closed: "Update window closed",
        unavailable: "Unavailable"
    };
    const midseasonStatus = plMidseason?.status || "pending";
    status.textContent = labels[midseasonStatus] || midseasonStatus;
    status.dataset.status = midseasonStatus;
    section.hidden = false;
    authForm.hidden = midseasonStatus !== "open" || Boolean(plMidseasonEntry);
    editor.hidden = !plMidseasonEntry;

    if (midseasonStatus === "pending") {
        notice.textContent =
            "Table 2 will unlock after every Gameweek 19 fixture is complete and the official midpoint table is frozen.";
    } else if (midseasonStatus === "open") {
        notice.textContent = `Confirm zero to three swaps before ${
            formatPlDate(plMidseason.closeAt)
        }. Once confirmed, Table 2 cannot be edited or undone.`;
    } else if (midseasonStatus === "closed") {
        notice.textContent =
            "The midseason update window is closed. Table 2 predictions are now visible from the leaderboard.";
    } else {
        notice.textContent =
            "The midseason update is not available because its official schedule is incomplete.";
    }
}

function calculatePlSwapMetrics(originalTable, updatedTable) {
    const original = [...originalTable].sort(
        (a, b) => a.predictedPosition - b.predictedPosition
    );
    const updated = [...updatedTable].sort(
        (a, b) => a.predictedPosition - b.predictedPosition
    );
    const targetPositionByTeam = new Map(
        updated.map(row => [row.teamId, row.predictedPosition])
    );
    let affectedTeamCount = 0;
    const permutation = new Map();
    original.forEach((row, index) => {
        if (row.teamId !== updated[index].teamId) affectedTeamCount += 1;
        permutation.set(row.predictedPosition, targetPositionByTeam.get(row.teamId));
    });
    let cycles = 0;
    const visited = new Set();
    for (let position = 1; position <= PL_TEAM_COUNT; position += 1) {
        if (visited.has(position)) continue;
        cycles += 1;
        let current = position;
        while (!visited.has(current)) {
            visited.add(current);
            current = permutation.get(current);
        }
    }
    return {
        swapCount: PL_TEAM_COUNT - cycles,
        affectedTeamCount
    };
}

function renderPlSwapEditor() {
    const container = document.getElementById("plSwapTable");
    const confirmButton = document.getElementById("plSwapConfirm");
    const resetButton = document.getElementById("plSwapReset");
    if (!container || !confirmButton || !resetButton || !plMidseasonEntry) return;

    const metrics = calculatePlSwapMetrics(plSwapOriginal, plSwapWorking);
    document.getElementById("plSwapCount").textContent =
        `${metrics.swapCount} of ${plMaximumSwaps} swaps`;
    document.getElementById("plAffectedCount").textContent =
        `${metrics.affectedTeamCount} of ${plMaximumAffectedTeams} teams affected`;
    const submitted = Boolean(plMidseasonEntry.alreadySubmitted);
    confirmButton.disabled = submitted;
    resetButton.disabled = submitted || metrics.affectedTeamCount === 0;
    confirmButton.innerHTML = submitted
        ? '<i class="fas fa-lock"></i> Table 2 Confirmed'
        : '<i class="fas fa-lock"></i> Confirm Table 2';

    const originalTeamByPosition = new Map(
        plSwapOriginal.map(row => [row.predictedPosition, row.teamId])
    );
    container.replaceChildren();
    [...plSwapWorking]
        .sort((a, b) => a.predictedPosition - b.predictedPosition)
        .forEach(prediction => {
            const button = document.createElement("button");
            button.className = "pl-swap-row";
            button.type = "button";
            button.disabled = submitted;
            button.classList.toggle(
                "changed",
                originalTeamByPosition.get(prediction.predictedPosition)
                    !== prediction.teamId
            );
            button.classList.toggle(
                "selected",
                prediction.predictedPosition === plSwapSelectedPosition
            );
            button.dataset.position = String(prediction.predictedPosition);
            appendPlText(button, "span", prediction.predictedPosition, "pl-swap-position");
            appendPlText(button, "span", prediction.teamName, "pl-swap-team");
            const state = document.createElement("i");
            state.className = button.classList.contains("changed")
                ? "fas fa-right-left"
                : "fas fa-grip-lines";
            state.setAttribute("aria-hidden", "true");
            button.appendChild(state);
            button.addEventListener("click", () => selectPlSwapPosition(
                prediction.predictedPosition
            ));
            container.appendChild(button);
        });
}

function selectPlSwapPosition(position) {
    if (!plMidseasonEntry || plMidseasonEntry.alreadySubmitted) return;
    showPlMidseasonMessage("");
    if (plSwapSelectedPosition === null) {
        plSwapSelectedPosition = position;
        renderPlSwapEditor();
        return;
    }
    if (plSwapSelectedPosition === position) {
        plSwapSelectedPosition = null;
        renderPlSwapEditor();
        return;
    }

    const first = plSwapWorking.find(
        row => row.predictedPosition === plSwapSelectedPosition
    );
    const second = plSwapWorking.find(row => row.predictedPosition === position);
    [first.teamId, second.teamId] = [second.teamId, first.teamId];
    [first.teamName, second.teamName] = [second.teamName, first.teamName];
    const metrics = calculatePlSwapMetrics(plSwapOriginal, plSwapWorking);
    if (metrics.swapCount > plMaximumSwaps
        || metrics.affectedTeamCount > plMaximumAffectedTeams) {
        [first.teamId, second.teamId] = [second.teamId, first.teamId];
        [first.teamName, second.teamName] = [second.teamName, first.teamName];
        showPlMidseasonMessage(
            "That exchange would exceed three swaps or six affected teams."
        );
    }
    plSwapSelectedPosition = null;
    renderPlSwapEditor();
}

async function authenticatePlMidseason(event) {
    event.preventDefault();
    showPlMidseasonMessage("");
    const usernameInput = document.getElementById("plMidseasonUsername");
    const tokenInput = document.getElementById("plMidseasonToken");
    const button = event.currentTarget.querySelector("button[type='submit']");
    button.disabled = true;
    try {
        const response = await fetch(`${PL_BACKEND_URL}/api/pl/midseason/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                seasonKey: plSeasonKey,
                playerUsername: usernameInput.value.trim(),
                token: tokenInput.value.trim()
            })
        });
        const data = await readPlJson(response);
        if (!response.ok) throw new Error(data.error || "Authentication failed");
        plMidseasonToken = tokenInput.value.trim();
        tokenInput.value = "";
        plMidseasonEntry = data.entry;
        plMaximumSwaps = Number(data.entry.maximumSwaps) || plMaximumSwaps;
        plMaximumAffectedTeams = Number(
            data.entry.maximumAffectedTeams
        ) || plMaximumAffectedTeams;
        plSwapOriginal = data.entry.tableOne.map(row => ({ ...row }));
        plSwapWorking = data.entry.tableTwo.map(row => ({ ...row }));
        plSwapSelectedPosition = null;
        renderPlMidseasonState();
        renderPlSwapEditor();
        if (data.entry.alreadySubmitted) {
            plMidseasonToken = "";
            showPlMidseasonMessage(
                "Your final Table 2 has already been confirmed.",
                "success"
            );
        }
    } catch (error) {
        showPlMidseasonMessage(error.message || "Could not open this prediction.");
    } finally {
        button.disabled = false;
    }
}

async function confirmPlMidseasonUpdate() {
    if (!plMidseasonEntry || !plMidseasonToken) return;
    const metrics = calculatePlSwapMetrics(plSwapOriginal, plSwapWorking);
    const confirmed = window.confirm(
        `Confirm Table 2 with ${metrics.swapCount} swap${
            metrics.swapCount === 1 ? "" : "s"
        } affecting ${metrics.affectedTeamCount} team${
            metrics.affectedTeamCount === 1 ? "" : "s"
        }? This is final and cannot be undone.`
    );
    if (!confirmed) return;
    const button = document.getElementById("plSwapConfirm");
    button.disabled = true;
    showPlMidseasonMessage("");
    try {
        const response = await fetch(`${PL_BACKEND_URL}/api/pl/midseason/swaps`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                seasonKey: plSeasonKey,
                playerUsername: plMidseasonEntry.playerUsername,
                token: plMidseasonToken,
                table: plSwapWorking.map(row => ({
                    teamId: row.teamId,
                    predictedPosition: row.predictedPosition
                }))
            })
        });
        const data = await readPlJson(response);
        if (!response.ok) throw new Error(data.error || "Update failed");
        plMidseasonToken = "";
        plMidseasonEntry.alreadySubmitted = true;
        plMidseasonEntry.update = {
            swapCount: data.swapCount,
            affectedTeamCount: data.affectedTeamCount,
            submittedAt: data.submittedAt
        };
        renderPlSwapEditor();
        showPlMidseasonMessage(data.message, "success");
    } catch (error) {
        button.disabled = false;
        showPlMidseasonMessage(error.message || "Could not confirm Table 2.");
    }
}

async function loadPlGame() {
    try {
        const response = await fetch(`${PL_BACKEND_URL}/api/pl/config`, {
            headers: { Accept: "application/json" }
        });
        const data = await readPlJson(response);
        if (!response.ok) throw new Error(data.error || "PL game configuration is unavailable");

        plDeadline = new Date(data.season.submissionDeadline);
        plSeasonKey = String(data.season.seasonKey || "").trim();
        plSeasonLabel = String(data.season.label || "").trim();
        if (Number.isNaN(plDeadline.getTime()) || !plSeasonKey || !plSeasonLabel) {
            throw new Error("PL season configuration is invalid");
        }
        plSubmissionsOpen = Boolean(data.submissionsOpen);
        plMidseason = data.season.midseason || { status: "pending" };
        plMaximumSwaps = Number(
            data.rules?.midseason?.maximumSwaps
        ) || plMaximumSwaps;
        plMaximumAffectedTeams = Number(
            data.rules?.midseason?.maximumAffectedTeams
        ) || plMaximumAffectedTeams;
        plTeams = Array.isArray(data.teams)
            ? [...data.teams].sort((a, b) => a.name.localeCompare(b.name))
            : [];
        plPlayers = Array.isArray(data.players) ? data.players : [];
        renderPlRules(data.rules);
        document.getElementById("plSeasonTitle").textContent = plSeasonLabel;
        document.getElementById("plSeasonStatus").textContent =
            plSubmissionsOpen ? "Entries open" : data.season.status;
        document.getElementById("plHeroDescription").textContent =
            `Predict the ${plSeasonLabel} Premier League season before the opening fixture.`;
        document.getElementById("plRulesContext").textContent =
            `These rules belong to ${plSeasonLabel} and will be preserved with this season's archive.`;
        document.getElementById("plFormTitle").replaceChildren();
        const formTitleIcon = document.createElement("i");
        formTitleIcon.className = "fas fa-list-ol";
        document.getElementById("plFormTitle").append(
            formTitleIcon,
            document.createTextNode(` Submit Your ${plSeasonLabel} Predictions`)
        );
        document.getElementById("plLeaderboardTitle").replaceChildren();
        const leaderboardIcon = document.createElement("i");
        leaderboardIcon.className = "fas fa-ranking-star";
        document.getElementById("plLeaderboardTitle").append(
            leaderboardIcon,
            document.createTextNode(` ${plSeasonLabel} Leaderboard`)
        );
        document.getElementById("plDeadlineText").textContent =
            `Entries close ${formatPlDeadline()} local time`;

        const dataReady = Boolean(data.dataReady)
            && plTeams.length === PL_TEAM_COUNT
            && plPlayers.length > 0;
        if (dataReady) renderPlFormOptions();
        setPlFormState(dataReady);
        renderPlMidseasonState();
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
        seasonKey: plSeasonKey,
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

    if (!window.confirm(`Submit and lock these ${plSeasonLabel} predictions?`)) return;
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

function renderPlLeaderboardPhases(metadata = {}) {
    const container = document.getElementById("plLeaderboardPhases");
    if (!container) return;
    container.replaceChildren();

    const midseasonStatus = metadata?.midseason?.status || "pending";
    const seasonFinished = ["complete", "archived"].includes(metadata?.seasonStatus);
    const phases = [
        {
            label: "Table 1",
            value: ["open", "closed"].includes(midseasonStatus) ? "Frozen" : "Live",
            active: true
        },
        {
            label: "Table 2",
            value: midseasonStatus === "closed"
                ? seasonFinished ? "Final" : "Live"
                : midseasonStatus === "open"
                    ? "Private until GW20"
                    : "Awaiting GW19",
            active: midseasonStatus === "closed"
        },
        {
            label: "Awards",
            value: seasonFinished ? "Final" : "Predictions visible",
            active: seasonFinished
        }
    ];

    phases.forEach(phase => {
        const item = document.createElement("div");
        item.className = "pl-leaderboard-phase";
        const indicator = document.createElement("span");
        indicator.className = phase.active
            ? "pl-phase-indicator is-active"
            : "pl-phase-indicator";
        indicator.setAttribute("aria-hidden", "true");
        const copy = document.createElement("div");
        appendPlText(copy, "span", phase.label);
        appendPlText(copy, "strong", phase.value);
        item.append(indicator, copy);
        container.appendChild(item);
    });
}

function renderPlParticipantTable(
    entries,
    container = document.getElementById("plLeaderboardContainer"),
    metadata = {}
) {
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
    appendPlCell(head, "th", "Table 1", "pl-score-column pl-component-column");
    appendPlCell(head, "th", "Table 2", "pl-score-column pl-component-column");
    appendPlCell(head, "th", "Awards", "pl-score-column pl-component-column");
    appendPlCell(head, "th", "Total", "pl-score-column");
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
        const username = document.createElement("span");
        username.textContent = `@${String(entry.player_username || "").replace(/^@/, "")}`;
        const detailIcon = document.createElement("i");
        detailIcon.className = "fas fa-chevron-right";
        detailIcon.setAttribute("aria-hidden", "true");
        button.append(username, detailIcon);
        button.setAttribute("aria-haspopup", "dialog");
        button.addEventListener("click", event => {
            plModalReturnFocus = event.currentTarget;
            showPlPredictions(entry);
        });
        playerCell.appendChild(button);
        row.appendChild(playerCell);

        const midseasonCell = appendPlCell(
            row,
            "td",
            formatPlScore(entry.midseason_score),
            "pl-score-column pl-component-column"
        );
        midseasonCell.setAttribute("data-label", "Table 1");
        const finalVisible = Array.isArray(entry.tableTwo)
            || metadata?.midseason?.status === "closed";
        const finalCell = appendPlCell(
            row,
            "td",
            finalVisible ? formatPlScore(entry.final_score) : "Pending",
            "pl-score-column pl-component-column"
        );
        finalCell.setAttribute("data-label", "Table 2");
        const awardsVisible = Array.isArray(entry.scoreComponents?.awards)
            && entry.scoreComponents.awards.length === 4;
        const awardsCell = appendPlCell(
            row,
            "td",
            awardsVisible ? formatPlScore(entry.award_score) : "Pending",
            "pl-score-column pl-component-column"
        );
        awardsCell.setAttribute("data-label", "Awards");
        const scoreCell = appendPlCell(
            row,
            "td",
            formatPlScore(entry.total_score),
            "pl-score-column"
        );
        scoreCell.setAttribute("data-label", "Total");
    });
    container.appendChild(table);
}

function updatePlLiveTableHeading(metadata = {}) {
    const kicker = document.getElementById("plLiveTableKicker");
    const title = document.getElementById("plLiveTableTitle");
    if (!kicker || !title) return;
    const seasonFinished = ["complete", "archived"].includes(metadata.seasonStatus);
    const hasMidseasonSnapshot = Boolean(metadata?.midseason?.snapshotAt);
    const label = seasonFinished
        ? "Final Premier League Table"
        : hasMidseasonSnapshot
            ? "Current Premier League Table"
            : "Live Premier League Table";
    kicker.textContent = seasonFinished ? "Frozen final standings" : "Automatically synced";
    const icon = document.createElement("i");
    icon.className = seasonFinished ? "fas fa-flag-checkered" : "fas fa-table-list";
    title.replaceChildren(icon, document.createTextNode(` ${label}`));
}

function renderPlLiveTable(
    tableRows,
    metadata = {},
    {
        section = document.getElementById("plLiveTableSection"),
        container = document.getElementById("plLiveTableContainer"),
        updated = document.getElementById("plLiveTableUpdated"),
        collapsible = false
    } = {}
) {
    container.replaceChildren();
    container.classList.toggle("pl-live-table-collapsible", collapsible);
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
    const middleRows = [];
    let gapRow = null;

    tableRows.forEach(team => {
        const row = body.insertRow();
        if (team.position <= 4) row.classList.add("pl-europe-place");
        if (team.position >= 18) row.classList.add("pl-relegation-place");
        if (collapsible && team.position > 5 && team.position < 18) {
            row.classList.add("pl-live-table-middle");
            middleRows.push(row);
        }
        const hasStats = String(team.source || "").startsWith("fpl_api");
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

        if (collapsible && team.position === 5) {
            gapRow = body.insertRow();
            gapRow.className = "pl-live-table-gap";
            const gapCell = gapRow.insertCell();
            gapCell.colSpan = headers.length;
            const gapIcon = document.createElement("i");
            gapIcon.className = "fas fa-ellipsis";
            gapIcon.setAttribute("aria-hidden", "true");
            gapCell.appendChild(gapIcon);
            gapCell.setAttribute("aria-label", "Positions 6 through 17 are hidden");
        }
    });

    if (collapsible) {
        const viewport = document.createElement("div");
        viewport.className = "pl-live-table-viewport";
        const tableId = `${container.id}Table`;
        table.id = tableId;
        viewport.appendChild(table);

        const controls = document.createElement("div");
        controls.className = "pl-live-table-controls";
        const toggle = document.createElement("button");
        toggle.className = "pl-live-table-toggle";
        toggle.type = "button";
        toggle.setAttribute("aria-controls", tableId);
        const toggleIcon = document.createElement("i");
        toggleIcon.setAttribute("aria-hidden", "true");
        const toggleLabel = document.createElement("span");
        toggle.append(toggleIcon, toggleLabel);
        controls.appendChild(toggle);
        container.append(viewport, controls);

        let expanded = false;
        const updateTableVisibility = () => {
            middleRows.forEach(row => {
                row.hidden = !expanded;
            });
            if (gapRow) gapRow.hidden = expanded;
            toggle.setAttribute("aria-expanded", String(expanded));
            toggleIcon.className = expanded
                ? "fas fa-compress"
                : "fas fa-table-list";
            toggleLabel.textContent = expanded
                ? "Show Top and Bottom"
                : "View Full Table";
        };
        toggle.addEventListener("click", () => {
            expanded = !expanded;
            updateTableVisibility();
        });
        updateTableVisibility();
    } else {
        container.appendChild(table);
    }

    const updatedAt = new Date(metadata.tableUpdatedAt);
    updated.textContent = Number.isNaN(updatedAt.getTime())
        ? "Latest synchronized standings"
        : `Updated ${updatedAt.toLocaleString()}`;
    if (section.id === "plLiveTableSection") {
        updatePlLiveTableHeading(metadata);
    }
    section.hidden = false;
}

function renderPlLiveAwards(
    rows,
    {
        section = document.getElementById("plLiveAwardsSection"),
        container = document.getElementById("plLiveAwardsContainer"),
        updated = document.getElementById("plLiveAwardsUpdated")
    } = {}
) {
    if (!section || !container || !updated) return;
    container.replaceChildren();
    const standings = Array.isArray(rows) ? rows : [];
    const definitions = [
        {
            type: "golden_boot",
            title: "Golden Boot",
            icon: "shoe-prints",
            metric: value => `${value} ${value === 1 ? "goal" : "goals"}`
        },
        {
            type: "golden_glove",
            title: "Golden Glove",
            icon: "hand",
            metric: value => `${value} clean ${value === 1 ? "sheet" : "sheets"}`
        },
        {
            type: "most_goals",
            title: "Team Goals",
            icon: "futbol",
            metric: value => `${value} ${value === 1 ? "goal" : "goals"}`
        }
    ];
    const hasResults = definitions.some(({ type }) => (
        standings.some(row => row.type === type)
    ));
    if (!hasResults) {
        section.hidden = true;
        return;
    }

    definitions.forEach(definition => {
        const panel = document.createElement("article");
        panel.className = "pl-live-award-panel";
        const heading = document.createElement("div");
        heading.className = "pl-live-award-heading";
        const icon = document.createElement("i");
        icon.className = `fas fa-${definition.icon}`;
        icon.setAttribute("aria-hidden", "true");
        appendPlText(heading, "h3", definition.title);
        heading.prepend(icon);
        panel.appendChild(heading);

        const typeRows = standings
            .filter(row => row.type === definition.type)
            .sort((a, b) => Number(a.rank) - Number(b.rank))
            .slice(0, 5);
        if (typeRows.length === 0) {
            appendPlText(panel, "p", "Awaiting season data.", "pl-live-award-empty");
        } else {
            const list = document.createElement("ol");
            list.className = "pl-live-award-list";
            typeRows.forEach(row => {
                const item = document.createElement("li");
                const rank = appendPlText(item, "span", row.rank, "pl-live-award-rank");
                rank.setAttribute("aria-label", `Rank ${row.rank}`);
                const subject = document.createElement("div");
                appendPlText(subject, "strong", row.subjectName);
                if (row.teamName) appendPlText(subject, "small", row.teamName);
                const value = appendPlText(
                    item,
                    "span",
                    definition.metric(Number(row.value)),
                    "pl-live-award-value"
                );
                item.insertBefore(subject, value);
                list.appendChild(item);
            });
            panel.appendChild(list);
        }
        container.appendChild(panel);
    });

    const timestamps = standings
        .map(row => new Date(row.updatedAt))
        .filter(date => !Number.isNaN(date.getTime()));
    const latest = timestamps.sort((a, b) => b - a)[0];
    updated.textContent = latest
        ? `Updated ${latest.toLocaleString()}`
        : "Latest synchronized statistics";
    section.hidden = false;
}

function showPlPredictions(entry) {
    const modalTitle = document.getElementById("plModalTitle");
    const modalBody = document.getElementById("plModalBody");
    const username = String(entry.player_username || "").replace(/^@/, "");
    modalTitle.textContent = `@${username}`;
    modalBody.replaceChildren();

    const summary = document.createElement("div");
    summary.className = "pl-modal-score-grid";
    [
        ["Table 1", entry.midseason_score],
        ["Table 2", Array.isArray(entry.tableTwo) ? entry.final_score : null],
        [
            "Awards",
            Array.isArray(entry.scoreComponents?.awards)
                && entry.scoreComponents.awards.length === 4
                ? entry.award_score
                : null
        ],
        ["Total", entry.total_score]
    ].forEach(([label, value]) => {
        const item = document.createElement("div");
        appendPlText(item, "span", label);
        appendPlText(
            item,
            "strong",
            value === null ? "Pending" : formatPlScore(value)
        );
        summary.appendChild(item);
    });
    modalBody.appendChild(summary);

    const predictions = Array.isArray(entry.predictions) ? entry.predictions : [];
    const tablePredictions = predictions
        .filter(prediction => prediction.type === "league_position")
        .sort((a, b) => a.position - b.position);
    function appendPredictionTable(title, rows, placeholder) {
        appendPlText(modalBody, "h3", title);
        if (!Array.isArray(rows) || rows.length !== PL_TEAM_COUNT) {
            const empty = document.createElement("div");
            empty.className = "pl-phase-placeholder";
            const icon = document.createElement("i");
            icon.className = "fas fa-clock";
            icon.setAttribute("aria-hidden", "true");
            appendPlText(empty, "p", placeholder);
            empty.prepend(icon);
            modalBody.appendChild(empty);
            return;
        }
        const tableShell = document.createElement("div");
        tableShell.className = "pl-modal-table-shell";
        const table = document.createElement("table");
        table.className = "pl-prediction-table";
        const head = table.createTHead().insertRow();
        appendPlCell(head, "th", "Pos");
        appendPlCell(head, "th", "Club");
        appendPlCell(head, "th", "Actual");
        appendPlCell(head, "th", "Pts");
        const body = table.createTBody();
        [...rows].sort((a, b) => a.position - b.position).forEach(prediction => {
            const row = body.insertRow();
            appendPlCell(row, "td", prediction.position);
            appendPlCell(row, "td", prediction.subjectName);
            appendPlCell(
                row,
                "td",
                prediction.actualPosition ?? "-",
                "pl-prediction-number"
            );
            appendPlCell(
                row,
                "td",
                prediction.points === null || prediction.points === undefined
                    ? "-"
                    : formatPlScore(prediction.points),
                "pl-prediction-number"
            );
        });
        tableShell.appendChild(table);
        modalBody.appendChild(tableShell);
    }

    appendPredictionTable(
        "Table 1 - Original Prediction",
        tablePredictions,
        "Table 1 is unavailable."
    );
    appendPredictionTable(
        "Table 2 - Post Gameweek 19",
        entry.tableTwo,
        plMidseason?.status === "open"
            ? "Table 2 is private while swaps are open. It will be revealed when Gameweek 20 begins."
            : "Table 2 will be created after Gameweek 19 and revealed when Gameweek 20 begins."
    );

    appendPlText(modalBody, "h3", "Season Award Predictions");
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
            const scored = prediction.correct === true || prediction.correct === false;
            appendPlText(
                awardList,
                "dd",
                scored
                    ? `${prediction.subjectName} - ${formatPlScore(prediction.points)} pts `
                        + `(${prediction.correct ? "correct" : "incorrect"})`
                    : prediction.subjectName
            );
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
        plMidseason = data.metadata?.midseason || plMidseason;
        renderPlMidseasonState();
        renderPlLeaderboardPhases(data.metadata);
        renderPlParticipantTable(entries, undefined, data.metadata);
        renderPlLiveTable(
            data.liveTable,
            data.metadata,
            { collapsible: true }
        );
        renderPlLiveTable(
            data.midseasonTable,
            { tableUpdatedAt: data.midseasonTable?.[0]?.updatedAt },
            {
                section: document.getElementById("plMidseasonTableSection"),
                container: document.getElementById("plMidseasonTableContainer"),
                updated: document.getElementById("plMidseasonTableUpdated"),
                collapsible: true
            }
        );
        renderPlLiveAwards(data.liveAwards);
        const leaderboardSection = document.getElementById("plLeaderboardSection");
        const midseasonSection = document.getElementById("plMidseasonSection");
        const rulesSection = document.querySelector(".rules-section");
        if (rulesSection) {
            rulesSection.before(
                ...[leaderboardSection, midseasonSection].filter(Boolean)
            );
        }
        leaderboardSection.hidden = false;
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
        if (card.icon) {
            const icon = document.createElement("div");
            icon.className = "archive-rule-icon";
            const iconElement = document.createElement("i");
            const safeIcon = /^[a-z0-9-]+$/i.test(card.icon)
                ? card.icon
                : "circle-info";
            iconElement.className = `fas fa-${safeIcon}`;
            icon.appendChild(iconElement);
            article.appendChild(icon);
        }
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
        const winner = archive.summary?.winner;
        if (winner?.username) {
            appendPlText(
                summary,
                "p",
                `Champion: @${winner.username} with ${formatPlScore(winner.totalScore)} points.`
            );
        }
        renderPlParticipantTable(
            Array.isArray(entries) ? entries : [],
            document.getElementById("plArchiveLeaderboardContainer"),
            archive.payload?.leaderboard?.metadata
        );
        renderPlLiveTable(
            archive.payload?.midseasonTable,
            {
                tableUpdatedAt:
                    archive.payload?.midseasonTable?.[0]?.updatedAt
            },
            {
                section: document.getElementById("plArchiveMidseasonTableSection"),
                container: document.getElementById("plArchiveMidseasonTableContainer"),
                updated: document.getElementById("plArchiveMidseasonTableUpdated")
            }
        );
        renderPlLiveTable(
            archive.payload?.liveTable,
            archive.payload?.leaderboard?.metadata,
            {
                section: document.getElementById("plArchiveTableSection"),
                container: document.getElementById("plArchiveTableContainer"),
                updated: document.getElementById("plArchiveTableUpdated")
            }
        );
        renderPlLiveAwards(
            archive.payload?.liveAwards,
            {
                section: document.getElementById("plArchiveLiveAwardsSection"),
                container: document.getElementById("plArchiveLiveAwardsContainer"),
                updated: document.getElementById("plArchiveLiveAwardsUpdated")
            }
        );
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
    document.getElementById("plMidseasonAuthForm")
        ?.addEventListener("submit", authenticatePlMidseason);
    document.getElementById("plSwapReset")?.addEventListener("click", () => {
        plSwapWorking = plSwapOriginal.map(row => ({ ...row }));
        plSwapSelectedPosition = null;
        showPlMidseasonMessage("");
        renderPlSwapEditor();
    });
    document.getElementById("plSwapConfirm")
        ?.addEventListener("click", confirmPlMidseasonUpdate);
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
