const plBackendMeta = document.querySelector('meta[name="backend-url"]');
const plIsLocalFrontend = ["localhost", "127.0.0.1", "0.0.0.0"].includes(
    window.location.hostname
);
const PL_BACKEND_URL = plIsLocalFrontend
    ? `http://${window.location.hostname}:5001`
    : plBackendMeta?.content?.replace(/\/$/, "")
        || "https://worldcup-prediction-backend-production.up.railway.app";

async function readPlJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function renderPlArchives(seasons) {
    const container = document.getElementById("plArchiveList");
    if (!container) return;
    container.replaceChildren();

    const archivedSeasons = Array.isArray(seasons)
        ? seasons.filter(season => season.archiveAvailable)
        : [];

    if (archivedSeasons.length === 0) {
        const empty = document.createElement("span");
        empty.className = "cyber-link disabled-link";
        empty.setAttribute("aria-disabled", "true");
        empty.innerHTML = '<i class="fas fa-folder-open"></i> No archives yet';
        container.appendChild(empty);
        return;
    }

    archivedSeasons.forEach(season => {
        const button = document.createElement("button");
        button.className = "cyber-link archive-link-button";
        button.type = "button";
        button.innerHTML = `<i class="fas fa-box-archive"></i> ${season.label}`;
        button.addEventListener("click", () => loadPlArchiveSeason(season));
        container.appendChild(button);
    });
}

function appendPlArchiveText(parent, tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = String(text ?? "");
    if (className) element.className = className;
    parent.appendChild(element);
    return element;
}

function appendPlArchiveRuleCard(container, card) {
    const article = document.createElement("article");
    article.className = "archive-rule-card";

    if (card.icon) {
        const icon = document.createElement("div");
        icon.className = "archive-rule-icon";
        icon.innerHTML = `<i class="fas fa-${card.icon}"></i>`;
        article.appendChild(icon);
    }

    appendPlArchiveText(article, "h3", card.title);

    if (card.body) {
        appendPlArchiveText(article, "p", card.body);
    }

    if (Array.isArray(card.scoring) && card.scoring.length > 0) {
        const scoringList = document.createElement("div");
        scoringList.className = "scoring-grid";
        card.scoring.forEach(({ stage, points }) => {
            const row = document.createElement("div");
            row.className = "score-row";
            appendPlArchiveText(row, "span", stage, "score-stage");
            appendPlArchiveText(row, "span", `${points} ${Number(points) === 1 ? "pt" : "pts"}`, "score-points");
            scoringList.appendChild(row);
        });
        article.appendChild(scoringList);
    }

    if (Array.isArray(card.bullets) && card.bullets.length > 0) {
        const list = document.createElement("ul");
        list.className = "rules-list";
        card.bullets.forEach(rule => {
            const item = document.createElement("li");
            item.textContent = rule;
            list.appendChild(item);
        });
        article.appendChild(list);
    }

    container.appendChild(article);
}

function renderPlArchiveRules(rules) {
    const container = document.getElementById("plArchiveRulesContainer");
    if (!container) return;
    container.replaceChildren();

    if (!rules) {
        appendPlArchiveText(container, "p", "Rules are not available for this archive yet.", "disabled-link");
        return;
    }

    if (Array.isArray(rules.cards) && rules.cards.length > 0) {
        rules.cards.forEach(card => appendPlArchiveRuleCard(container, card));
        return;
    }

    const scoringCard = document.createElement("article");
    scoringCard.className = "archive-rule-card";
    appendPlArchiveText(scoringCard, "h3", "Scoring");
    const scoringList = document.createElement("div");
    scoringList.className = "scoring-grid";
    (Array.isArray(rules.predictionSlots) ? rules.predictionSlots : []).forEach(({ stage, points }) => {
        const row = document.createElement("div");
        row.className = "score-row";
        appendPlArchiveText(row, "span", stage, "score-stage");
        appendPlArchiveText(row, "span", `${points} ${Number(points) === 1 ? "pt" : "pts"}`, "score-points");
        scoringList.appendChild(row);
    });
    scoringCard.appendChild(scoringList);

    const summaryCard = document.createElement("article");
    summaryCard.className = "archive-rule-card";
    appendPlArchiveText(summaryCard, "h3", "Rules");
    const list = document.createElement("ul");
    list.className = "rules-list";
    [
        rules.scoringNote,
        rules.maxScore ? `Max score: ${rules.maxScore} points` : "",
        "Each archived season preserves the rules used for that year's game."
    ].filter(Boolean).forEach(rule => {
        const item = document.createElement("li");
        item.textContent = rule;
        list.appendChild(item);
    });
    summaryCard.appendChild(list);

    container.append(scoringCard, summaryCard);
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

        const panel = document.getElementById("plArchiveResults");
        const title = document.getElementById("plArchiveTitle");
        const summary = document.getElementById("plArchiveSummary");
        const rulesTitle = document.getElementById("plArchiveRulesTitle");
        if (!panel || !title || !summary || !rulesTitle) return;

        title.textContent = `${archive.label} Results`;
        summary.textContent = archive.summary
            ? `${archive.summary.entryCount || 0} entries archived.`
            : "Season results are archived.";
        rulesTitle.innerHTML = `<i class="fas fa-book"></i> ${archive.label} Rules`;
        renderPlArchiveRules(archive.payload.rules);
        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        console.error("Failed to load PL archive season:", error);
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

document.addEventListener("DOMContentLoaded", loadPlArchives);
