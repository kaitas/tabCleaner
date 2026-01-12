/**
 * updates.js
 * Checks for new versions on GitHub.
 */

const GITHUB_REPO = 'kaitas/tabCleaner';
const CHECK_INTERVAL_MINUTES = 60 * 24; // Daily

export async function checkForUpdates() {
    try {
        const manifest = chrome.runtime.getManifest();
        const currentVersion = manifest.version;

        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (!response.ok) return null;

        const data = await response.json();
        const latestTag = data.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present

        if (compareVersions(latestTag, currentVersion) > 0) {
            return {
                hasUpdate: true,
                latestVersion: latestTag,
                url: data.html_url
            };
        }

        return { hasUpdate: false };
    } catch (e) {
        console.error('Update check failed:', e);
        return null;
    }
}

function compareVersions(v1, v2) {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const n1 = p1[i] || 0;
        const n2 = p2[i] || 0;
        if (n1 > n2) return 1;
        if (n1 < n2) return -1;
    }
    return 0;
}
