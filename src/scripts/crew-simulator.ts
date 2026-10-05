/**
 * Kitchen crew station-screen simulator (US03): five shift scenarios with the
 * Safe-to-Clean check, ground-fault alarm, 30-second cleaning pause and the
 * unmonitored-sensor edge case.
 */

type Scenario = "live" | "clean" | "alarm" | "pause" | "offline";
type Info = { tag: string; title: string; body: string };

const CLEAN_STEP_MS = 700;
const PAUSE_SECONDS = 30;

export function initCrewSimulator(root: HTMLElement): void {
  const find = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector);

  const infos = JSON.parse(root.dataset.infos ?? "{}") as Record<Scenario, Info>;
  const radios = [...root.querySelectorAll<HTMLInputElement>('input[name="crew-scenario"]')];
  const screens = [...root.querySelectorAll<HTMLElement>("[data-screen]")];
  const zones = [...root.querySelectorAll<HTMLElement>("[data-zone]")];
  const infoTag = find("[data-info-tag]");
  const infoTitle = find("[data-info-title]");
  const infoBody = find("[data-info-body]");
  const chipAll = find('[data-chip="all"]');
  const chipDegraded = find('[data-chip="degraded"]');
  const cleanCount = find("[data-clean-count]");
  const cleanDone = find("[data-clean-done]");
  const pauseDisplay = find("[data-pause-display]");
  const pauseProgress = find("[data-pause-progress]");
  const ack = find<HTMLButtonElement>("[data-alarm-ack]");
  const ackScreen = find('[data-screen="alarm-ack"]');

  let timer: number | undefined;

  const stop = () => {
    if (timer === undefined) return;
    clearInterval(timer);
    timer = undefined;
  };

  const show = (name: string) => {
    for (const screen of screens) screen.hidden = screen.dataset.screen !== name;
  };

  const renderClean = (step: number) => {
    zones.forEach((zone, index) => {
      const done = index < step;
      zone.querySelector("[data-zone-pending]")?.classList.toggle("hidden", done);
      zone.querySelector("[data-zone-done]")?.classList.toggle("hidden", !done);
      const value = zone.querySelector<HTMLElement>("[data-zone-value]");
      if (value) value.textContent = (done ? value.dataset.done : value.dataset.pending) ?? "";
    });
    if (cleanCount) cleanCount.textContent = String(step);
    if (cleanDone) cleanDone.hidden = step < zones.length;
  };

  const renderPause = (secondsLeft: number) => {
    if (pauseDisplay) pauseDisplay.textContent = `0:${String(secondsLeft).padStart(2, "0")}`;
    if (pauseProgress) pauseProgress.style.transform = `scaleX(${secondsLeft / PAUSE_SECONDS})`;
  };

  const run = (scenario: Scenario) => {
    stop();

    const info = infos[scenario];
    if (info && infoTag && infoTitle && infoBody) {
      infoTag.textContent = info.tag;
      infoTitle.textContent = info.title;
      infoBody.textContent = info.body;
    }
    if (chipAll) chipAll.hidden = scenario === "offline";
    if (chipDegraded) chipDegraded.hidden = scenario !== "offline";

    if (scenario === "clean") {
      let step = 0;
      renderClean(step);
      show("clean");
      timer = window.setInterval(() => {
        step += 1;
        renderClean(step);
        if (step >= zones.length) stop();
      }, CLEAN_STEP_MS);
      return;
    }

    if (scenario === "pause") {
      let secondsLeft = PAUSE_SECONDS;
      renderPause(secondsLeft);
      show("pause");
      timer = window.setInterval(() => {
        secondsLeft -= 1;
        renderPause(secondsLeft);
        if (secondsLeft <= 0) select("live");
      }, 1000);
      return;
    }

    show(scenario);
  };

  const select = (scenario: Scenario) => {
    const radio = radios.find((item) => item.value === scenario);
    if (radio) radio.checked = true;
    run(scenario);
  };

  for (const radio of radios) {
    radio.addEventListener("change", () => {
      if (radio.checked) run(radio.value as Scenario);
    });
  }

  ack?.addEventListener("click", () => {
    show("alarm-ack");
    ackScreen?.focus();
  });

  // Leaving the crew view resets the station to a normal shift.
  document.addEventListener("electrolink:rolechange", (event) => {
    if ((event as CustomEvent<string>).detail !== "crew") select("live");
  });
}
