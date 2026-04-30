import { Match } from "@/lib/api";

// Re-export the Match type from api for use across components
export type { Match };

// Derived status helpers
export type MatchStatus = "live" | "finished" | "upcoming";

export function getMatchStatus(status: string): MatchStatus {
  if (status === "1H" || status === "2H" || status === "HT") return "live";
  if (status === "FT") return "finished";
  return "upcoming";
}

// Probability display helper — maps backend keys to display labels
export interface ProbabilityEntry {
  label: string;
  value: number | null;
  color: string;
}

export function getProbabilities(match: Match): ProbabilityEntry[] {
  if (!match.stats) return [];
  return [
    {
      label: "Ev Sahibi Kazanır",
      value: match.stats.home_win_probability,
      color: "var(--primary)",
    },
    {
      label: "Beraberlik",
      value: match.stats.draw_probability,
      color: "var(--warning)",
    },
    {
      label: "Deplasman Kazanır",
      value: match.stats.away_win_probability,
      color: "var(--info)",
    },
  ];
}
