/**
 * Kitchen crew / store manager switcher. Deep-linkable through `#crew` and
 * `#manager`; without JavaScript both views stay visible one after the other.
 */
import { initTabs } from "./tabs";

const ROLES = ["crew", "manager"] as const;
type Role = (typeof ROLES)[number];

const roleFromHash = (): Role | null => {
  const id = location.hash.slice(1);
  return (ROLES as readonly string[]).includes(id) ? (id as Role) : null;
};

export function initRoleExplorer(section: HTMLElement): void {
  const tablist = section.querySelector<HTMLElement>('[role="tablist"]');
  if (!tablist) return;

  const roleLinks = [...document.querySelectorAll<HTMLAnchorElement>("[data-role-link]")];
  let ready = false;

  const tabs = initTabs(tablist, (_tab, panel) => {
    for (const link of roleLinks) {
      if (link.dataset.roleLink === panel.id) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    if (ready && location.hash !== `#${panel.id}`) history.replaceState(null, "", `#${panel.id}`);
    document.dispatchEvent(new CustomEvent("electrolink:rolechange", { detail: panel.id }));
  });

  tablist.hidden = false;
  const initial = roleFromHash();
  tabs.select(initial ?? "crew");
  ready = true;
  if (initial) section.scrollIntoView({ block: "start" });

  window.addEventListener("hashchange", () => {
    const role = roleFromHash();
    if (!role) return;
    tabs.select(role);
    section.scrollIntoView({ block: "start" });
  });
}
