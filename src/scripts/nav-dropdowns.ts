/**
 * Disclosure dropdowns for the header navigation (WAI-ARIA "disclosure
 * navigation menu"): a button toggles a list of links. Escape, a click outside
 * or tabbing away closes it; arrow keys move between its links.
 */

export function initNavDropdowns(dropdowns: Iterable<HTMLElement>): void {
  const items = [...dropdowns].flatMap((root) => {
    const toggle = root.querySelector<HTMLButtonElement>("[data-dropdown-toggle]");
    const panel = root.querySelector<HTMLElement>("[data-dropdown-panel]");
    return toggle && panel ? [{ root, toggle, panel }] : [];
  });

  const close = (item: (typeof items)[number], restoreFocus = false) => {
    item.toggle.setAttribute("aria-expanded", "false");
    item.panel.hidden = true;
    if (restoreFocus) item.toggle.focus();
  };

  const open = (item: (typeof items)[number]) => {
    for (const other of items) if (other !== item) close(other);
    item.toggle.setAttribute("aria-expanded", "true");
    item.panel.hidden = false;
  };

  const linksOf = (item: (typeof items)[number]) => [...item.panel.querySelectorAll<HTMLAnchorElement>("a")];

  for (const item of items) {
    item.toggle.addEventListener("click", () => {
      if (item.toggle.getAttribute("aria-expanded") === "true") close(item);
      else open(item);
    });

    item.root.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !item.panel.hidden) {
        event.preventDefault();
        close(item, true);
        return;
      }

      const links = linksOf(item);
      const index = links.indexOf(document.activeElement as HTMLAnchorElement);
      const onToggle = document.activeElement === item.toggle;
      let next: number | undefined;

      if (event.key === "ArrowDown") {
        if (onToggle) {
          open(item);
          next = 0;
        } else if (index !== -1) next = (index + 1) % links.length;
      } else if (event.key === "ArrowUp" && index !== -1) {
        next = (index - 1 + links.length) % links.length;
      } else if (event.key === "Home" && index !== -1) {
        next = 0;
      } else if (event.key === "End" && index !== -1) {
        next = links.length - 1;
      }

      if (next !== undefined) {
        event.preventDefault();
        links[next]?.focus();
      }
    });

    // Close when focus leaves the dropdown (e.g. tabbing past the last link).
    item.root.addEventListener("focusout", (event) => {
      const target = event.relatedTarget as Node | null;
      if (target && !item.root.contains(target)) close(item);
    });

    item.panel.addEventListener("click", (event) => {
      if ((event.target as Element).closest("a")) close(item);
    });
  }

  document.addEventListener("pointerdown", (event) => {
    for (const item of items) {
      if (!item.root.contains(event.target as Node)) close(item);
    }
  });
}
