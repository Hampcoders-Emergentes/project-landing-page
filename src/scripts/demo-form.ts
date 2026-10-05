/**
 * Demo request form (US07): client-side validation with corrective messages,
 * a confirmation state, and a retry path that keeps the visitor's input when
 * the registration service does not respond.
 */

type FieldName = "name" | "email" | "chain" | "locations" | "phone" | "consent";
type ErrorKind = "required" | "invalid";
type Messages = { summary: string } & Record<FieldName, Partial<Record<ErrorKind, string>>>;

const FIELDS: readonly FieldName[] = ["name", "email", "chain", "locations", "phone", "consent"];
const DRAFT_FIELDS = ["name", "email", "chain", "locations", "phone"] as const;
const DRAFT_KEY = "electrolink:demo-request";
const TIMEOUT_MS = 10_000;

const NAME_PATTERN = /^\p{L}[\p{L}\p{M}' .-]{1,79}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Peruvian mobile (9 digits) or landline with area code; other countries in E.164. */
export function isValidPhone(raw: string): boolean {
  const value = raw.trim();
  if (!/^\+?[\d\s().-]+$/.test(value)) return false;

  let digits = value.replace(/\D/g, "");
  if (value.startsWith("+")) {
    if (!digits.startsWith("51")) return digits.length >= 8 && digits.length <= 15;
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("51")) {
    digits = digits.slice(2);
  }

  return (
    /^9\d{8}$/.test(digits) || // mobile
    /^0?1\d{7}$/.test(digits) || // Lima: 1 + 7 digits
    /^0?[4-8]\d{7}$/.test(digits) // provinces: 2-digit area code + 6 digits
  );
}

function validate(form: HTMLFormElement, field: FieldName): ErrorKind | null {
  const control = form.elements.namedItem(field) as HTMLInputElement | HTMLSelectElement;
  if (field === "consent") return (control as HTMLInputElement).checked ? null : "required";

  const value = control.value.trim();
  if (!value) return "required";

  switch (field) {
    case "name":
      return NAME_PATTERN.test(value) ? null : "invalid";
    case "email":
      return EMAIL_PATTERN.test(value) ? null : "invalid";
    case "chain":
      return value.length >= 2 ? null : "invalid";
    case "phone":
      return isValidPhone(value) ? null : "invalid";
    default:
      return null;
  }
}

async function sendRequest(endpoint: string, payload: Record<string, unknown>): Promise<void> {
  if (!endpoint) {
    if (import.meta.env.DEV) {
      console.info("[demo-form] PUBLIC_DEMO_ENDPOINT is not set; simulating a successful request.", payload);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return;
    }
    throw new Error("PUBLIC_DEMO_ENDPOINT is not configured.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Demo request failed with HTTP ${response.status}.`);
  } finally {
    clearTimeout(timer);
  }
}

function readDraft(): Partial<Record<(typeof DRAFT_FIELDS)[number], string>> {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeDraft(form: HTMLFormElement): void {
  const draft = Object.fromEntries(
    DRAFT_FIELDS.map((field) => [field, (form.elements.namedItem(field) as HTMLInputElement).value]),
  );
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the in-page values remain.
  }
}

function clearDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

export function initDemoForm(form: HTMLFormElement): void {
  const card = form.parentElement;
  const messages = JSON.parse(form.dataset.messages ?? "{}") as Messages;
  const endpoint = form.dataset.endpoint ?? "";
  const summary = form.querySelector<HTMLElement>("[data-form-summary]");
  const summaryList = form.querySelector<HTMLElement>("[data-form-summary-list]");
  const failure = form.querySelector<HTMLElement>("[data-form-failure]");
  const retry = form.querySelector<HTMLButtonElement>("[data-form-retry]");
  const submit = form.querySelector<HTMLButtonElement>("[data-form-submit]");
  const submitLabel = form.querySelector<HTMLElement>("[data-submit-label]");
  const iconIdle = form.querySelector<SVGElement>("[data-icon-idle]");
  const iconBusy = form.querySelector<SVGElement>("[data-icon-busy]");
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  const success = card?.querySelector<HTMLElement>("[data-form-success]");
  const again = card?.querySelector<HTMLButtonElement>("[data-form-again]");

  if (!summary || !summaryList || !failure || !retry || !submit || !submitLabel || !status || !success || !again) {
    return;
  }

  let submitted = false;
  let pending = false;
  form.noValidate = true;

  const control = (field: FieldName) => form.elements.namedItem(field) as HTMLInputElement | HTMLSelectElement;

  const showError = (field: FieldName, error: ErrorKind | null) => {
    const box = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
    const text = box?.querySelector<HTMLElement>("[data-error-text]");
    if (!box || !text) return;
    if (error) {
      control(field).setAttribute("aria-invalid", "true");
      text.textContent = messages[field][error] ?? messages[field].required ?? "";
      box.hidden = false;
    } else {
      control(field).removeAttribute("aria-invalid");
      text.textContent = "";
      box.hidden = true;
    }
  };

  const check = (field: FieldName) => {
    const error = validate(form, field);
    showError(field, error);
    return error;
  };

  const renderSummary = (errors: [FieldName, ErrorKind][]) => {
    summaryList.replaceChildren(
      ...errors.map(([field, error]) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `#${control(field).id}`;
        link.className = "underline underline-offset-2";
        link.textContent = messages[field][error] ?? "";
        link.addEventListener("click", (event) => {
          event.preventDefault();
          control(field).focus();
        });
        item.append(link);
        return item;
      }),
    );
    summary.hidden = false;
    summary.focus();
  };

  const setPending = (value: boolean) => {
    pending = value;
    form.setAttribute("aria-busy", String(value));
    submit.setAttribute("aria-busy", String(value));
    submitLabel.textContent = (value ? submitLabel.dataset.labelBusy : submitLabel.dataset.labelIdle) ?? "";
    iconIdle?.classList.toggle("hidden", value);
    iconBusy?.classList.toggle("hidden", !value);
    status.textContent = value ? (status.dataset.msgSending ?? "") : "";
  };

  const resetErrors = () => {
    FIELDS.forEach((field) => showError(field, null));
    summary.hidden = true;
    failure.hidden = true;
  };

  // Restore an unsent draft (e.g. after a reload while the service was down).
  const draft = readDraft();
  for (const field of DRAFT_FIELDS) {
    const value = draft[field];
    if (value && !control(field).value) control(field).value = value;
  }

  for (const field of FIELDS) {
    const element = control(field);
    element.addEventListener("input", () => {
      if (element.getAttribute("aria-invalid") === "true") check(field);
      if (field !== "consent") writeDraft(form);
    });
    element.addEventListener("change", () => {
      if (submitted) check(field);
    });
    element.addEventListener("blur", () => {
      if (submitted || (field !== "consent" && element.value.trim() !== "")) check(field);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending) return;

    submitted = true;
    failure.hidden = true;

    const errors = FIELDS.map((field) => [field, check(field)] as const).filter(
      (entry): entry is [FieldName, ErrorKind] => entry[1] !== null,
    );
    if (errors.length > 0) {
      renderSummary(errors);
      return;
    }
    summary.hidden = true;

    const data = new FormData(form);
    const payload = {
      name: String(data.get("name")).trim(),
      email: String(data.get("email")).trim(),
      chain: String(data.get("chain")).trim(),
      locations: String(data.get("locations")),
      phone: String(data.get("phone")).trim(),
      consent: true,
      lang: form.dataset.lang,
      source: "landing",
      submittedAt: new Date().toISOString(),
    };

    // Bots fill the hidden field; acknowledge without sending anything.
    const isBot = String(data.get("website") ?? "").trim() !== "";

    setPending(true);
    try {
      if (!isBot) await sendRequest(endpoint, payload);
      clearDraft();
      form.reset();
      resetErrors();
      submitted = false;
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (error) {
      console.error(error);
      failure.hidden = false;
      failure.focus();
    } finally {
      setPending(false);
    }
  });

  retry.addEventListener("click", () => form.requestSubmit());

  again.addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    control("name").focus();
  });
}
