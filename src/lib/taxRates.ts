/** State-level sales tax rates (base rate only — local rates excluded for simplicity). */
export const US_STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04,   AK: 0.00,   AZ: 0.056,  AR: 0.065,  CA: 0.0725,
  CO: 0.029,  CT: 0.0635, DE: 0.00,   DC: 0.06,   FL: 0.06,
  GA: 0.04,   HI: 0.04,   ID: 0.06,   IL: 0.0625, IN: 0.07,
  IA: 0.06,   KS: 0.065,  KY: 0.06,   LA: 0.0445, ME: 0.055,
  MD: 0.06,   MA: 0.0625, MI: 0.06,   MN: 0.06875,MS: 0.07,
  MO: 0.04225,MT: 0.00,   NE: 0.055,  NV: 0.0685, NH: 0.00,
  NJ: 0.06625,NM: 0.05125,NY: 0.04,   NC: 0.0475, ND: 0.05,
  OH: 0.0575, OK: 0.045,  OR: 0.00,   PA: 0.06,   RI: 0.07,
  SC: 0.06,   SD: 0.04,   TN: 0.07,   TX: 0.0625, UT: 0.0485,
  VT: 0.06,   VA: 0.053,  WA: 0.065,  WV: 0.06,   WI: 0.05,
  WY: 0.04,
};

export const US_STATES = [
  { code: "AL", name: "Alabama" },        { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },        { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },     { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },    { code: "DE", name: "Delaware" },
  { code: "DC", name: "Washington D.C." },{ code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },        { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },          { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },        { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },         { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },      { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },       { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },       { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },    { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },        { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },         { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },     { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },       { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },   { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },       { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },   { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },      { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },           { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },       { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

/**
 * Returns the decimal tax rate for the given country + state.
 * US states use the lookup table. Non-US returns 0 (VAT handled at destination).
 */
export function getTaxRate(country: string, state: string): number {
  const isUS =
    country === "US" ||
    country.toLowerCase().replace(/\s/g, "") === "unitedstates";
  if (!isUS) return 0;
  return US_STATE_TAX_RATES[state.toUpperCase().trim()] ?? 0;
}

/** Returns the tax rate as a display string, e.g. "6.25%" or "No tax". */
export function formatTaxRate(rate: number): string {
  if (rate === 0) return "No tax";
  return `${(rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}
