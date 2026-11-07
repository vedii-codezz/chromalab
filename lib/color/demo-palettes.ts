/** Hand-authored static examples. These are not generated tonal scales. */
export const blueHour = [
  { step: 50, hex: "#F0F4FA" },
  { step: 100, hex: "#E1E9F5" },
  { step: 200, hex: "#C4D3EA" },
  { step: 300, hex: "#A1B8DB" },
  { step: 400, hex: "#7898CB" },
  { step: 500, hex: "#5479B8" },
  { step: 600, hex: "#41639B" },
  { step: 700, hex: "#35507D" },
  { step: 800, hex: "#2D4367" },
  { step: 900, hex: "#283A56" },
] as const;

export const demoFamilies = [
  {
    name: "Blue hour",
    role: "Primary",
    hex: "#5479B8",
    colors: ["#E1E9F5", "#A1B8DB", "#5479B8", "#35507D", "#283A56"],
  },
  {
    name: "Sunwashed",
    role: "Secondary",
    hex: "#D7B66D",
    colors: ["#F8F1DF", "#E8D5A5", "#D7B66D", "#92773F", "#51452D"],
  },
  {
    name: "Soft earth",
    role: "Accent",
    hex: "#BD7964",
    colors: ["#F5E8E3", "#DBB1A3", "#BD7964", "#8B5443", "#553B32"],
  },
] as const;
