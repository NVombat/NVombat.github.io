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
        const link = document.createElement("a");
        link.className = "cyber-link";
        link.href = `#${season.id}`;
        link.innerHTML = `<i class="fas fa-box-archive"></i> ${season.label}`;
        container.appendChild(link);
    });
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
