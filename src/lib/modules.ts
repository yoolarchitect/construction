/** All functional areas are enabled in single-tenant mode (no plan gating). */
const ALL_MODULE_KEYS = [
  "PROJECTS_MODULE",
  "PROCUREMENT_MODULE",
  "ASSETS_MODULE",
  "REPORTS_MODULE",
  "LABOR_MODULE",
  "EQUIPMENT_MODULE",
] as const;

export async function getEnabledModules(): Promise<string[]> {
  return [...ALL_MODULE_KEYS];
}
