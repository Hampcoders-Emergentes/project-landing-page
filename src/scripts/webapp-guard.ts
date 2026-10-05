/**
 * Checks that the web application responds before leaving the landing page
 * (US01, US04, US06 · "unresponsive web application link"). Without
 * JavaScript, `[data-webapp-link]` anchors are ordinary links.
 */

const TIMEOUT_MS = 6000;

export async function isReachable(href: string): Promise<boolean> {
  const url = new URL(href, location.href);
  const sameOrigin = url.origin === location.origin;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      // Cross-origin apps answer with an opaque response: we can only tell
      // that the server is reachable, not its status code.
      mode: sameOrigin ? "same-origin" : "no-cors",
      cache: "no-store",
      credentials: sameOrigin ? "same-origin" : "omit",
      signal: controller.signal,
    });
    return response.type === "opaque" || response.ok || response.status === 405;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

interface GuardOptions {
  notice: HTMLElement;
  announce: (message: string, politeness?: "polite" | "assertive") => void;
}

export function initWebAppGuard({ notice, announce }: GuardOptions): void {
  const retry = notice.querySelector<HTMLButtonElement>("[data-webapp-retry]");
  const dismiss = notice.querySelector<HTMLButtonElement>("[data-notice-dismiss]");
  let checking = false;
  let lastHref = "";

  const open = async (href: string, trigger: HTMLElement) => {
    if (checking) return;
    checking = true;
    lastHref = href;
    trigger.setAttribute("aria-busy", "true");
    announce(notice.dataset.msgChecking ?? "");

    const reachable = await isReachable(href);

    trigger.removeAttribute("aria-busy");
    checking = false;

    if (reachable) {
      notice.hidden = true;
      location.assign(href);
      return;
    }

    notice.hidden = false;
    announce(notice.dataset.msgFailure ?? "", "assertive");
    retry?.focus();
  };

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[data-webapp-link]");
    if (!link || (link.target && link.target !== "_self")) return;

    event.preventDefault();
    void open(link.href, link);
  });

  retry?.addEventListener("click", () => {
    if (lastHref) void open(lastHref, retry);
  });
  dismiss?.addEventListener("click", () => {
    notice.hidden = true;
  });
}
