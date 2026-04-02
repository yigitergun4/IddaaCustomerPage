import { Clock, TrendingUp } from "lucide-react";
import { MatchCardProps } from "@/types/components";
import { formatTime, formatOdd } from "@/lib/utils";

export function MatchCard({ match }: MatchCardProps) {
  const isStarted: boolean = match.home_score !== null && match.away_score !== null;

  return (
    <div className="card shadow-sm border-[var(--card-border)] hover:border-[var(--primary)]/50 group bg-[var(--card)] relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-[var(--primary)]/10" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--primary)]" suppressHydrationWarning>
            {formatTime(match.start_time)}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex-1 text-center">
          <span className="font-bold text-lg text-[var(--foreground)]">{match.home_team}</span>
        </div>

        <div className="px-4">
          {isStarted ? (
            <div className="text-2xl font-bold">
              <span className="text-[var(--primary)]">{match.home_score}</span>
              <span className="text-[var(--text-muted)] mx-2">-</span>
              <span className="text-[var(--primary)]">{match.away_score}</span>
            </div>
          ) : (
            <span className="text-[var(--text-muted)] tracking-widest text-sm font-bold">VS</span>
          )}
        </div>

        <div className="flex-1 text-center">
          <span className="font-bold text-lg text-[var(--foreground)]">{match.away_team}</span>
        </div>
      </div>

      {/* Odds */}
      {match.odds && (
        <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
          <div className="bg-[var(--secondary)] border border-[var(--card-border)] rounded-lg p-3 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1 font-medium">1</div>
            <div className="font-bold text-[var(--primary)] text-lg">
              {formatOdd(match.odds.home_odd)}
            </div>
          </div>
          <div className="bg-[var(--secondary)] border border-[var(--card-border)] rounded-lg p-3 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1 font-medium">X</div>
            <div className="font-bold text-[var(--foreground)] text-lg">
              {formatOdd(match.odds.draw_odd)}
            </div>
          </div>
          <div className="bg-[var(--secondary)] border border-[var(--card-border)] rounded-lg p-3 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1 font-medium">2</div>
            <div className="font-bold text-[var(--primary)] text-lg">
              {formatOdd(match.odds.away_odd)}
            </div>
          </div>
        </div>
      )}

      {/* Premium Stats Section */}
      {match.stats && (
        <div className="relative z-10 mt-auto">
          <div className="bg-gradient-to-r from-[var(--primary)]/10 to-transparent border border-[var(--primary)]/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-sm font-bold text-[var(--primary)] tracking-wide uppercase">Yapay Zeka Analizi</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Beklenen Gol (xG)</div>
                <div className="font-bold text-lg">
                  {match.stats.home_xg?.toFixed(2) ?? "-"} <span className="text-[var(--text-muted)] text-sm mx-1">/</span> {match.stats.away_xg?.toFixed(2) ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">AI Güven Skoru</div>
                <div className="font-bold text-[var(--primary)] text-lg flex items-baseline gap-1">
                  {match.stats.ai_prediction_score?.toFixed(1) ?? "-"}
                  <span className="text-xs">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
