/**
 * WAI-ARIA tabs: automatic activation, roving tabindex and arrow-key / Home /
 * End navigation. Panels are found through each tab's `aria-controls`.
 */

export interface TabsController {
  select(panelId: string, options?: { focus?: boolean }): void;
}

export function initTabs(
  tablist: HTMLElement,
  onChange?: (tab: HTMLElement, panel: HTMLElement) => void,
): TabsController {
  const tabs = [...tablist.querySelectorAll<HTMLElement>('[role="tab"]')];
  const panelFor = (tab: HTMLElement) => document.getElementById(tab.getAttribute("aria-controls") ?? "");

  const activate = (tab: HTMLElement, focus = false) => {
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = panelFor(item);
      if (panel) panel.hidden = !selected;
    }
    if (focus) tab.focus();
    const panel = panelFor(tab);
    if (panel) onChange?.(tab, panel);
  };

  tablist.addEventListener("click", (event) => {
    const tab = (event.target as Element).closest<HTMLElement>('[role="tab"]');
    if (tab && tabs.includes(tab)) activate(tab);
  });

  tablist.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(event.target as HTMLElement);
    if (index === -1) return;

    const last = tabs.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;

    event.preventDefault();
    activate(tabs[next], true);
  });

  return {
    select(panelId, { focus = false } = {}) {
      const tab = tabs.find((item) => item.getAttribute("aria-controls") === panelId);
      if (tab) activate(tab, focus);
    },
  };
}
