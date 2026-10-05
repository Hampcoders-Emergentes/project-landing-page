/**
 * Language-neutral data for the landing page. Labels live in src/i18n/*.json;
 * the numbers here are sample telemetry used by the previews.
 */
import type { IconName } from "../components/ui/icon-names";

export type SafetyStatus = "success" | "warning" | "danger" | "offline";

/* Hero telemetry preview ------------------------------------------------ */

export const heroTelemetry = {
  leakageMa: 0,
  /** Voltage samples (V), oldest first; the last one is the current reading. */
  voltageTrend: [
    220.1, 220.3, 219.9, 220.0, 220.4, 220.2, 219.8, 219.9, 220.1, 220.5, 220.3, 220.0, 219.7, 219.9, 220.2,
    220.4, 220.1, 219.9, 220.0, 220.3, 220.6, 220.2, 219.9, 219.8, 220.0, 220.2, 220.1, 219.9, 220.0, 220.1,
  ],
  /** Vertical range of the sparkline (V). */
  voltageRange: [218, 222] as const,
  equipment: [
    { id: "fryer", status: "success", value: 4.1, unit: "kW" },
    { id: "grill", status: "success", value: 3.6, unit: "kW" },
    { id: "cooler", status: "warning", value: 6.8, unit: "°C" },
  ] as const satisfies ReadonlyArray<{ id: string; status: SafetyStatus; value: number; unit: string }>,
};

/* Manager dashboard ------------------------------------------------------ */

export type Period = "week" | "month";
export type EnergyUnit = "soles" | "kwh";

/** Energy cost per machine and off-hours waste for store #014. */
export const energyByPeriod = {
  month: {
    costs: [
      { id: "fryerBank", soles: 1828, kwh: 6997 },
      { id: "grill", soles: 1059, kwh: 4053 },
      { id: "cooler", soles: 866, kwh: 3315 },
      { id: "hood", soles: 674, kwh: 2580 },
      { id: "ice", soles: 385, kwh: 1475 },
    ],
    idle: { soles: 312, kwh: 1194 },
  },
  week: {
    costs: [
      { id: "fryerBank", soles: 425, kwh: 1627 },
      { id: "grill", soles: 246, kwh: 943 },
      { id: "cooler", soles: 201, kwh: 770 },
      { id: "hood", soles: 157, kwh: 600 },
      { id: "ice", soles: 90, kwh: 343 },
    ],
    idle: { soles: 73, kwh: 279 },
  },
} as const satisfies Record<Period, unknown>;

export const dashboard = {
  costs: energyByPeriod.month.costs,
  idleSoles: energyByPeriod.month.idle.soles,
  idleMachines: [
    { id: "fryer02", kw: 1.8 },
    { id: "toaster", kw: 1.6 },
    { id: "heatLamp", kw: 1.2 },
  ],
  openIncidents: 2,
} as const;

/** Load after closing, last night (kW per hour). */
export const idleProfile = [
  { hour: "23", kw: 4.6 },
  { hour: "00", kw: 4.6 },
  { hour: "01", kw: 4.5 },
  { hour: "02", kw: 4.6 },
  { hour: "03", kw: 4.4 },
  { hour: "04", kw: 4.6 },
  { hour: "05", kw: 4.5 },
  { hour: "06", kw: 3.1 },
] as const;

/* Kitchen crew station screen ------------------------------------------- */

export const crewEquipment = [
  { id: "fryer01", status: "success", value: 4.1, unit: "kW" },
  { id: "fryer02", status: "success", value: 3.9, unit: "kW" },
  { id: "grill", status: "success", value: 3.6, unit: "kW" },
  { id: "cooler", status: "warning", value: 6.8, unit: "°C" },
  { id: "ice", status: "success", value: 0.9, unit: "kW" },
] as const satisfies ReadonlyArray<{ id: string; status: SafetyStatus; value: number; unit: string }>;

/* Plans ------------------------------------------------------------------ */

export interface Plan {
  id: "single" | "multi" | "enterprise";
  icon: IconName;
  /**
   * Monthly price in soles. `null` renders the "pricing temporarily
   * unavailable" state (US06 · scenario 2); `"custom"` renders a quote plan.
   */
  price: number | null | "custom";
  unit: "perMonth" | "perStoreMonth" | "annual";
  featured: boolean;
}

// TODO(pricing): set the approved monthly prices in soles.
export const plans: readonly Plan[] = [
  { id: "single", icon: "building-store", price: null, unit: "perMonth", featured: false },
  { id: "multi", icon: "buildings", price: null, unit: "perStoreMonth", featured: true },
  { id: "enterprise", icon: "building-skyscraper", price: "custom", unit: "annual", featured: false },
];
