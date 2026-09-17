/**
 * Public demo catalogue.
 *
 * Production component quantities, supplier SKUs, and costs are intentionally
 * excluded from this portfolio repository. Replace these fixtures with data
 * owned by your organisation before using the application in production.
 */
export type PickPart = { name: string; sku?: string; qty: number; unitCost: number };

const demoProducts: Record<string, PickPart[]> = {
  "I Robe 1": [
    { name: "Demo top panel", sku: "DEMO-PANEL-TOP", qty: 1, unitCost: 0 },
    { name: "Demo side panel", sku: "DEMO-PANEL-SIDE", qty: 2, unitCost: 0 },
    { name: "Demo hanging rail", sku: "DEMO-RAIL", qty: 1, unitCost: 0 },
  ],
  "I Robe 3": [
    { name: "Demo top panel", sku: "DEMO-PANEL-TOP", qty: 1, unitCost: 0 },
    { name: "Demo side panel", sku: "DEMO-PANEL-SIDE", qty: 2, unitCost: 0 },
    { name: "Demo shelf", sku: "DEMO-SHELF", qty: 4, unitCost: 0 },
    { name: "Demo hanging rail", sku: "DEMO-RAIL", qty: 2, unitCost: 0 },
  ],
  "I Robe 5": [
    { name: "Demo top panel", sku: "DEMO-PANEL-TOP", qty: 1, unitCost: 0 },
    { name: "Demo side panel", sku: "DEMO-PANEL-SIDE", qty: 2, unitCost: 0 },
    { name: "Demo shelf", sku: "DEMO-SHELF", qty: 5, unitCost: 0 },
    { name: "Demo drawer set", sku: "DEMO-DRAWERS", qty: 1, unitCost: 0 },
    { name: "Demo hanging rail", sku: "DEMO-RAIL", qty: 2, unitCost: 0 },
  ],
};

export function iRobeParts(name: string, multiplier = 1): PickPart[] {
  return (demoProducts[name] ?? []).map((part) => ({
    ...part,
    qty: part.qty * multiplier,
  }));
}

const demoAccessories: Record<string, PickPart> = {
  "Pull Out Shoe Rack": {
    name: "Demo pull-out shoe rack",
    sku: "DEMO-SHOE-RACK",
    qty: 1,
    unitCost: 0,
  },
  "Pull Out Mirror (Silver)": {
    name: "Demo pull-out mirror — silver",
    sku: "DEMO-MIRROR-SILVER",
    qty: 1,
    unitCost: 0,
  },
  "Pull Out Mirror (Black)": {
    name: "Demo pull-out mirror — black",
    sku: "DEMO-MIRROR-BLACK",
    qty: 1,
    unitCost: 0,
  },
};

export function accessoryParts(name: string, multiplier = 1): PickPart[] {
  const part = demoAccessories[name];
  return part ? [{ ...part, qty: part.qty * multiplier }] : [];
}
