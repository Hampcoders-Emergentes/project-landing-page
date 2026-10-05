/**
 * Store manager dashboard (US04): period and unit switches, section tabs, and
 * the dispatch / threshold / closing-alert actions.
 */
import { initTabs } from "./tabs";

type Why = { tag: string; title: string; body: string };

export function initManagerDashboard(root: HTMLElement): void {
  const find = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector);

  const status = find("[data-manager-status]");
  const announce = (message: string) => {
    if (!status) return;
    status.textContent = "";
    window.setTimeout(() => {
      status.textContent = message;
    }, 50);
  };

  // Period and unit ------------------------------------------------------
  const state = { period: "month", unit: "soles" };
  const variants = [...root.querySelectorAll<HTMLElement>("[data-variants]")].map(
    (element) => [element, JSON.parse(element.dataset.variants ?? "{}") as Record<string, string>] as const,
  );
  const widths = [...root.querySelectorAll<HTMLElement>("[data-widths]")].map(
    (element) => [element, JSON.parse(element.dataset.widths ?? "{}") as Record<string, string>] as const,
  );

  const render = () => {
    const key = `${state.period}-${state.unit}`;
    for (const [element, values] of variants) element.textContent = values[key] ?? "";
    for (const [element, values] of widths) element.style.width = values[state.period] ?? "";
  };

  root.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    const control = input.dataset.control;
    if (control === "period" || control === "unit") {
      state[control] = input.value;
      render();
    }
  });

  // Section tabs and "why it matters" -------------------------------------
  const tablist = find('[role="tablist"]');
  const why = find("[data-why]");
  const whyCopy = JSON.parse(why?.dataset.why ?? "{}") as Record<string, Why>;
  const whyTag = find("[data-why-tag]");
  const whyTitle = find("[data-why-title]");
  const whyBody = find("[data-why-body]");

  if (tablist) {
    initTabs(tablist, (_tab, panel) => {
      const copy = whyCopy[panel.dataset.tab ?? ""];
      if (!copy || !whyTag || !whyTitle || !whyBody) return;
      whyTag.textContent = copy.tag;
      whyTitle.textContent = copy.title;
      whyBody.textContent = copy.body;
    });
  }

  // Dispatch a technician ------------------------------------------------
  const dispatch = find<HTMLButtonElement>("[data-dispatch]");
  const dispatchPending = find("[data-dispatch-pending]");
  const dispatchDone = find("[data-dispatch-done]");
  const incidentsSub = find("[data-incidents-sub]");

  dispatch?.addEventListener("click", () => {
    if (dispatchPending) dispatchPending.hidden = true;
    if (dispatchDone) {
      dispatchDone.hidden = false;
      dispatchDone.focus();
    }
    if (incidentsSub) incidentsSub.textContent = incidentsSub.dataset.assigned ?? "";
  });

  // Apply the recommended threshold --------------------------------------
  const apply = find<HTMLButtonElement>("[data-apply-threshold]");
  const thresholdPending = find("[data-threshold-pending]");
  const thresholdConfigured = find("[data-threshold-configured]");
  const thresholdBadge = find("[data-threshold-badge]");

  apply?.addEventListener("click", () => {
    if (thresholdPending) thresholdPending.hidden = true;
    if (thresholdBadge) thresholdBadge.hidden = true;
    if (thresholdConfigured) {
      thresholdConfigured.hidden = false;
      thresholdConfigured.focus();
    }
    announce(apply.dataset.msgApplied ?? "");
  });

  // Closing-time alert ---------------------------------------------------
  const idleToggle = find<HTMLButtonElement>("[data-idle-toggle]");
  const idleStatus = find("[data-idle-status]");

  idleToggle?.addEventListener("click", () => {
    const pressed = idleToggle.getAttribute("aria-pressed") !== "true";
    idleToggle.setAttribute("aria-pressed", String(pressed));
    if (idleStatus) idleStatus.hidden = !pressed;
    if (pressed) announce(idleStatus?.textContent?.trim() ?? "");
  });
}
