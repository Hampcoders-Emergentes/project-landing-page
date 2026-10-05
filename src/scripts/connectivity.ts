/**
 * Connection awareness (US02 · scenarios 2–3, US03 · scenario 3): an offline
 * notice with retry that keeps already loaded content usable, and a
 * limited-connectivity mode that pauses decorative motion and live previews.
 */

interface NetworkInformationLike extends EventTarget {
  effectiveType?: string;
  saveData?: boolean;
}

interface ConnectivityOptions {
  offline: HTMLElement;
  limited: HTMLElement;
  restored: HTMLElement;
  announce: (message: string, politeness?: "polite" | "assertive") => void;
}

const LIMITED_DISMISSED_KEY = "electrolink:limited-notice-dismissed";
const PROBE_TIMEOUT_MS = 5000;

async function probe(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(location.href, { method: "HEAD", cache: "no-store", signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function readFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage unavailable; the notice simply reappears on the next page load.
  }
}

export function initConnectivity({ offline, limited, restored, announce }: ConnectivityOptions): void {
  const root = document.documentElement;
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  const offlineStatus = offline.querySelector<HTMLElement>("[data-offline-status]");
  const retry = offline.querySelector<HTMLButtonElement>("[data-offline-retry]");
  let restoredTimer: number | undefined;
  let limitedAnnounced = false;

  const notify = () => document.dispatchEvent(new CustomEvent("electrolink:connectivity"));

  const showOffline = () => {
    if (!offline.hidden) return;
    restored.hidden = true;
    offline.hidden = false;
    if (offlineStatus) offlineStatus.textContent = "";
    announce(offline.dataset.msg ?? "", "assertive");
  };

  const showOnline = () => {
    if (offline.hidden) return;
    offline.hidden = true;
    restored.hidden = false;
    announce(restored.textContent?.trim() ?? "");
    clearTimeout(restoredTimer);
    restoredTimer = window.setTimeout(() => {
      restored.hidden = true;
    }, 4000);
  };

  const updateLimited = () => {
    const isLimited = Boolean(
      connection && (connection.saveData || connection.effectiveType === "slow-2g" || connection.effectiveType === "2g"),
    );
    if (isLimited) root.dataset.connection = "limited";
    else delete root.dataset.connection;

    const showNotice = isLimited && !readFlag(LIMITED_DISMISSED_KEY);
    limited.hidden = !showNotice;
    if (showNotice && !limitedAnnounced) {
      limitedAnnounced = true;
      announce(limited.dataset.msg ?? "");
    }
    notify();
  };

  window.addEventListener("offline", showOffline);
  window.addEventListener("online", showOnline);
  if (!navigator.onLine) showOffline();

  retry?.addEventListener("click", async () => {
    retry.setAttribute("aria-busy", "true");
    if (offlineStatus) offlineStatus.textContent = offlineStatus.dataset.msgChecking ?? "";
    const online = await probe();
    retry.removeAttribute("aria-busy");
    if (online) showOnline();
    else if (offlineStatus) offlineStatus.textContent = offlineStatus.dataset.msgStillOffline ?? "";
  });

  limited.querySelector("[data-notice-dismiss]")?.addEventListener("click", () => {
    writeFlag(LIMITED_DISMISSED_KEY);
    limited.hidden = true;
  });

  connection?.addEventListener("change", updateLimited);
  updateLimited();
}
