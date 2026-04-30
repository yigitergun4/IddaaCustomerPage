"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  Minus,
} from "lucide-react";
import { Match } from "@/lib/api";
import { formatTime, formatOdd } from "@/lib/utils";
import { getMatchStatus, getProbabilities } from "@/types/match";

interface MatchDetailModalProps {
  match: Match | null;
  onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBar({
  label,
  homeValue,
  awayValue,
  unit = "",
}: {
  label: string;
  homeValue: number | null;
  awayValue: number | null;
  unit?: string;
}) {
  const home: number = homeValue ?? 0;
  const away: number = awayValue ?? 0;
  const total: number = home + away;
  const homePercent: number = total > 0 ? Math.round((home / total) * 100) : 50;
  const awayPercent: number = 100 - homePercent;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-[var(--text-muted)] font-medium">
        <span>
          {homeValue !== null ? `${home}${unit}` : "-"}
        </span>
        <span className="text-white/50">{label}</span>
        <span>
          {awayValue !== null ? `${away}${unit}` : "-"}
        </span>
      </div>
      <div className="flex gap-1 h-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="h-full rounded-full bg-[var(--info)] transition-all duration-700"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}

function ProbabilityBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  const percent: number = Math.round((value ?? 0) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-semibold">
        <span className="text-white">{label}</span>
        <span style={{ color }}>{percent}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
    </div>
  );
}

function TeamHeader({ match }: { match: Match }) {
  const status: string = getMatchStatus(match.status);
  const isScored = status !== "upcoming";

  return (
    <div className="flex items-center gap-4">
      {/* Home */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {match.home_team_logo ? (
          <Image
            src={match.home_team_logo}
            alt={match.home_team}
            width={64}
            height={64}
            className="object-contain"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center text-2xl font-black text-[var(--primary)]">
            {match.home_team.charAt(0)}
          </div>
        )}
        <span className="font-bold text-sm text-center leading-tight">
          {match.home_team}
        </span>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center gap-1">
        {isScored ? (
          <div className="text-4xl font-black tracking-tight">
            <span className={status === "live" ? "text-[var(--primary)]" : ""}>
              {match.home_score ?? 0}
            </span>
            <span className="text-[var(--text-muted)] mx-2">-</span>
            <span className={status === "live" ? "text-[var(--primary)]" : ""}>
              {match.away_score ?? 0}
            </span>
          </div>
        ) : (
          <span className="text-3xl font-black text-[var(--text-muted)]">VS</span>
        )}
        {status === "live" && (
          <span className="badge badge-live flex items-center gap-1 text-xs animate-pulse">
            <span className="w-1.5 h-1.5 bg-current rounded-full" />
            CANLI
          </span>
        )}
        {status === "upcoming" && (
          <div className="flex items-center gap-1 text-[var(--text-muted)]">
            <Clock className="w-3 h-3" />
            <span className="text-xs" suppressHydrationWarning>
              {formatTime(match.start_time)}
            </span>
          </div>
        )}
      </div>

      {/* Away */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {match.away_team_logo ? (
          <Image
            src={match.away_team_logo}
            alt={match.away_team}
            width={64}
            height={64}
            className="object-contain"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center text-2xl font-black text-[var(--primary)]">
            {match.away_team.charAt(0)}
          </div>
        )}
        <span className="font-bold text-sm text-center leading-tight">
          {match.away_team}
        </span>
      </div>
    </div>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────────────

/**
 * Slide-over drawer that appears from the right on desktop,
 * and slides up from the bottom on mobile.
 * Fully accessible: focus trap on open, Escape key closes.
 */
export function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (match) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [match, onClose]);

  if (!match) return null;

  const probabilities = getProbabilities(match);
  const hasStats = match.stats !== null;

  return (
    <div className="fixed inset-0 z-[200] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Panel — slides from right on md+, from bottom on mobile */}
      <div
        ref={panelRef}
        className={[
          "relative z-10 flex flex-col",
          "w-full md:w-[480px] md:ml-auto",
          "h-[92vh] md:h-full",
          "self-end md:self-auto",
          "bg-[var(--card)] border-t md:border-t-0 md:border-l border-[var(--card-border)]",
          "rounded-t-3xl md:rounded-t-none",
          "overflow-y-auto",
          "animate-slide-up md:animate-slide-in-right",
        ].join(" ")}
      >
        {/* Drawer Handle (mobile) */}
        <div className="md:hidden flex justify-center pt-4 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[var(--card)] border-b border-[var(--card-border)]">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Maç Detayı</p>
            {match.league_name && (
              <p className="text-sm font-semibold mt-0.5">{match.league_name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-[var(--text-muted)] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-6">
          {/* Teams & Score */}
          <TeamHeader match={match} />

          {/* Odds */}
          {match.odds && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Bahis Oranları
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Ev Sahibi", key: "1", value: match.odds.home_odd },
                  { label: "Beraberlik", key: "X", value: match.odds.draw_odd },
                  { label: "Deplasman", key: "2", value: match.odds.away_odd },
                ].map(({ label, key, value }) => (
                  <div
                    key={key}
                    className="bg-[var(--secondary)] rounded-2xl p-4 text-center space-y-1"
                  >
                    <div className="text-2xl font-black text-[var(--primary)]">
                      {key}
                    </div>
                    <div className="text-lg font-bold">{formatOdd(value)}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-2 text-right">
                Kaynak: {match.odds.provider}
              </p>
            </div>
          )}

          {/* AI Predictions */}
          {hasStats && match.stats && (
            <div className="rounded-2xl bg-gradient-to-br from-[var(--primary)]/15 to-[var(--primary)]/5 border border-[var(--primary)]/20 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--primary)] font-black uppercase tracking-widest">
                    Yapay Zeka Tahmini
                  </p>
                  {match.stats.prediction_score !== null && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Güven Skoru: {match.stats.prediction_score}%
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {probabilities.map((p) => (
                  <ProbabilityBar
                    key={p.label}
                    label={p.label}
                    value={p.value}
                    color={p.color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* xG Stats */}
          {hasStats && match.stats && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                Maç İstatistikleri (xG)
              </h3>

              <div className="space-y-4">
                <StatBar
                  label="Beklenen Gol (xG)"
                  homeValue={match.stats.home_xg}
                  awayValue={match.stats.away_xg}
                />
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded-full bg-[var(--primary)]" />
                  <span>{match.home_team}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded-full bg-[var(--info)]" />
                  <span>{match.away_team}</span>
                </div>
              </div>
            </div>
          )}

          {!hasStats && (
            <div className="flex flex-col items-center py-8 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--secondary)] flex items-center justify-center">
                <Target className="w-6 h-6 text-[var(--text-muted)]" />
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Bu maç için henüz analiz verisi bulunmuyor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
