const steakBackendMeta = document.querySelector('meta[name="backend-url"]');
const steakIsLocalFrontend = ["localhost", "127.0.0.1", "0.0.0.0"].includes(
    window.location.hostname
);
const STEAK_BACKEND_URL = steakIsLocalFrontend
    ? `http://${window.location.hostname}:5001`
    : steakBackendMeta?.content?.replace(/\/$/, "")
        || "https://worldcup-prediction-backend-production.up.railway.app";

async function readSteakJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function appendSteakText(parent, tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = String(text ?? "");
    if (className) element.className = className;
    parent.appendChild(element);
    return element;
}

async function loadWorldCupArchive() {
    const container = document.getElementById("wcArchiveSummary");
    if (!container) return;

    try {
        const response = await fetch(`${STEAK_BACKEND_URL}/api/predictions/archive/world-cup-2026`);
        const archive = await readSteakJson(response);
        if (!response.ok) {
            throw new Error(archive.error || "Archive unavailable");
        }
        renderWorldCupArchive(container, archive);
    } catch (error) {
        container.replaceChildren();
        appendSteakText(
            container,
            "p",
            `Could not load the archive right now: ${error.message}`,
            "steak-archive-empty"
        );
    }
}

function renderWorldCupArchive(container, archive) {
    container.replaceChildren();
    const winner = archive.winner;
    const entries = Array.isArray(archive.leaderboard?.entries)
        ? archive.leaderboard.entries
        : [];
    const stages = Array.isArray(archive.stages) ? archive.stages : [];

    const winnerCard = document.createElement("article");
    winnerCard.className = "steak-winner-card";
    appendSteakText(winnerCard, "p", "Champion", "steak-game-kicker");
    appendSteakText(
        winnerCard,
        "h3",
        winner ? `@${winner.username}` : "Winner pending"
    );
    appendSteakText(
        winnerCard,
        "p",
        winner ? `${winner.totalScore} points` : "The final leaderboard is still being completed."
    );

    const leaderboardCard = document.createElement("article");
    leaderboardCard.className = "steak-archive-card";
    appendSteakText(leaderboardCard, "h3", "Top Standings");
    const list = document.createElement("ol");
    list.className = "steak-top-list";
    entries.slice(0, 5).forEach(entry => {
        const item = document.createElement("li");
        const username = appendSteakText(item, "span", `@${entry.player_username}`);
        username.className = "steak-top-username";
        appendSteakText(item, "strong", `${Number(entry.total_score) || 0} pts`);
        list.appendChild(item);
    });
    if (list.children.length === 0) {
        appendSteakText(leaderboardCard, "p", "No archived entries yet.", "steak-archive-empty");
    } else {
        leaderboardCard.appendChild(list);
    }

    const progressCard = document.createElement("article");
    progressCard.className = "steak-archive-card";
    appendSteakText(progressCard, "h3", "Tournament Snapshot");
    const progress = document.createElement("div");
    progress.className = "steak-stage-summary";
    stages.slice(-3).forEach(stage => {
        const item = document.createElement("div");
        appendSteakText(item, "span", stage.label);
        appendSteakText(item, "strong", `${stage.teams.length} teams`);
        progress.appendChild(item);
    });
    if (progress.children.length === 0) {
        appendSteakText(progressCard, "p", "Stage results are not archived yet.", "steak-archive-empty");
    } else {
        progressCard.appendChild(progress);
    }

    const archiveLink = document.createElement("a");
    archiveLink.className = "cyber-link steak-archive-link";
    archiveLink.href = "predworldcup.html";
    archiveLink.innerHTML = '<i class="fas fa-box-archive"></i> View WCPrediction archive';

    container.append(winnerCard, leaderboardCard, progressCard, archiveLink);
}

document.addEventListener("DOMContentLoaded", loadWorldCupArchive);
