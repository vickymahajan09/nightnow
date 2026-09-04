// =====================================================
// RETURN / REPLACEMENT POLICY OPTIONS
// One shared list so the admin dropdown, the product
// page, and the home page card badge always agree on
// the same labels + icons.
// =====================================================

export type ReturnPolicyOption = {
  value: string;
  label: string;
  icon: string;
};

export const RETURN_POLICY_OPTIONS: ReturnPolicyOption[] = [
  { value: "7_DAY_REPLACEMENT", label: "7 Days Replacement", icon: "🔄" },
  { value: "7_DAY_RETURN", label: "7 Days Return", icon: "↩️" },
  { value: "10_DAY_REPLACEMENT", label: "10 Days Replacement", icon: "🔄" },
  { value: "15_DAY_REPLACEMENT", label: "15 Days Replacement", icon: "🔄" },
  { value: "EASY_RETURN", label: "Easy Return", icon: "↩️" },
  { value: "NO_RETURN", label: "No Return", icon: "🚫" },
  { value: "NO_EXCHANGE", label: "No Exchange", icon: "🚫" },
  { value: "NO_RETURN_NO_EXCHANGE", label: "No Return, No Exchange", icon: "🚫" },
  { value: "NO_GUARANTEE", label: "No Guarantee / No Warranty", icon: "⚠️" },
  { value: "1_YEAR_WARRANTY", label: "1 Year Warranty", icon: "🛡️" },
  { value: "6_MONTH_WARRANTY", label: "6 Months Warranty", icon: "🛡️" },
  { value: "NON_RETURNABLE_PERISHABLE", label: "Non-Returnable (Perishable Item)", icon: "🥬" },
];

// Fallback keyword matching — so OLD products saved before this
// dropdown existed (plain free-text) still show a sensible icon.
const KEYWORD_ICON_RULES: { keywords: string[]; icon: string }[] = [
  { keywords: ["no return", "no exchange", "not returnable", "non-returnable", "non returnable"], icon: "🚫" },
  { keywords: ["no guarantee", "no warranty"], icon: "⚠️" },
  { keywords: ["warranty", "guarantee"], icon: "🛡️" },
  { keywords: ["replacement"], icon: "🔄" },
  { keywords: ["return"], icon: "↩️" },
];

export function getReturnPolicyMeta(value?: string | null): { label: string; icon: string } | null {
  const raw = (value || "").trim();
  if (!raw) return null;

  const exact = RETURN_POLICY_OPTIONS.find(
    (option) => option.value === raw || option.label.toLowerCase() === raw.toLowerCase()
  );
  if (exact) return { label: exact.label, icon: exact.icon };

  const lower = raw.toLowerCase();
  const matchedRule = KEYWORD_ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => lower.includes(keyword))
  );

  return { label: raw, icon: matchedRule ? matchedRule.icon : "📦" };
}
