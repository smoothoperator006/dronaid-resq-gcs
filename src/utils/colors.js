// Restrained palette: navy (brand/structure), red (critical), amber (high/hazard), green (low).
export const COLORS = {
  navy: "#1B2A4A",
  ink: "#1C232E",
  paper: "#FBFAF7",
  line: "#D9DCE1",
  critical: "#B3392C",
  high: "#B9821F",
  low: "#3F7D58",
  hazard: "#7A5C1E",
  muted: "#8A8F98"
};

export function colorForNodeStatus(status) {
  switch (status) {
    case "critical":
      return COLORS.critical;
    case "high":
      return COLORS.high;
    case "low":
      return COLORS.low;
    case "hazard":
      return COLORS.hazard;
    case "surveyed":
      return COLORS.navy;
    case "base":
      return COLORS.navy;
    case "hospital":
      return COLORS.navy;
    case "infra":
      return COLORS.muted;
    default:
      return COLORS.muted; // unsurveyed
  }
}

export function tierLabel(status) {
  return { critical: "CRITICAL", high: "HIGH", low: "LOW", hazard: "NO-ENTRY" }[status] || null;
}
