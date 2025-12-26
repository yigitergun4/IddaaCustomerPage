"use client";

import Image from "next/image";
import { Clock, TrendingUp, Lock } from "lucide-react";
import { Match } from "@/lib/api";
import { formatTime, formatOdd, cn } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  showPremium?: boolean;
  isVerified?: boolean;
  onUnlockClick?: () => void;
}

export function MatchCard({ match, showPremium = false, isVerified = false, onUnlockClick }: MatchCardProps) {
  const isLive = match.status === "1H" || match.status === "2H" || match.status === "HT";
  const isFinished = match.status === "FT";
  const hasStats = match.stats && (match.stats.home_xg !== null || match.stats.prediction_score !== null);

  return (
    <div className="card hover:border-[var(--primary)]/30 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-muted)]" suppressHydrationWarning>
            {formatTime(match.start_time)}
          </span>
        </div>
        
        {isLive && (
          <span className="badge badge-live animate-pulse">
            <span className="w-2 h-2 bg-current rounded-full mr-1.5"></span>
            CANLI
          </span>
        )}
        
        {!isLive && !isFinished && hasStats && (
          <span className="badge badge-primary">
            <TrendingUp className="w-3 h-3 mr-1" />
            Akıllı Analiz
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-6">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center text-center">
          {match.home_team_logo && (
            <Image
              src={match.home_team_logo}
              alt={match.home_team}
              width={48}
              height={48}
              className="mb-2"
            />
          )}
          <span className="font-semibold text-sm">{match.home_team}</span>
        </div>

        {/* Score / VS */}
        <div className="px-4">
          {isLive || isFinished ? (
            <div className="text-2xl font-bold">
              <span className={isLive ? "text-[var(--primary)]" : ""}>
                {match.home_score ?? 0}
              </span>
              <span className="text-[var(--text-muted)] mx-2">-</span>
              <span className={isLive ? "text-[var(--primary)]" : ""}>
                {match.away_score ?? 0}
              </span>
            </div>
          ) : (
            <span className="text-[var(--text-muted)] font-medium">VS</span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center text-center">
          {match.away_team_logo && (
            <Image
              src={match.away_team_logo}
              alt={match.away_team}
              width={48}
              height={48}
              className="mb-2"
            />
          )}
          <span className="font-semibold text-sm">{match.away_team}</span>
        </div>
      </div>

      {/* Odds */}
      {match.odds && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[var(--secondary)] rounded-lg p-3 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">1</div>
            <div className="font-bold text-[var(--primary)]">
              {formatOdd(match.odds.home_odd)}
            </div>
          </div>
          <div className="bg-[var(--secondary)] rounded-lg p-3 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">X</div>
            <div className="font-bold text-[var(--text-muted)]">
              {formatOdd(match.odds.draw_odd)}
            </div>
          </div>
          <div className="bg-[var(--secondary)] rounded-lg p-3 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">2</div>
            <div className="font-bold text-[var(--primary)]">
              {formatOdd(match.odds.away_odd)}
            </div>
          </div>
        </div>
      )}

      {/* Premium Stats Section */}
      <div className="relative">
        {showPremium && isVerified && match.stats ? (
          // Show actual premium data
          <div className="bg-[var(--primary-muted)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-sm font-semibold text-[var(--primary)]">AI Tahmin</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">xG (Beklenen Gol)</div>
                <div className="font-bold">
                  {match.stats.home_xg?.toFixed(2) ?? "-"} - {match.stats.away_xg?.toFixed(2) ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">Güven Skoru</div>
                <div className="font-bold text-[var(--primary)]">
                  {match.stats.prediction_score ? `${match.stats.prediction_score}%` : "-"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Show blurred paywall
          <div className="relative">
            <div className="blur-paywall bg-[var(--primary-muted)] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">AI Tahmin</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs mb-1">xG (Beklenen Gol)</div>
                  <div className="font-bold">2.45 - 1.23</div>
                </div>
                <div>
                  <div className="text-xs mb-1">Güven Skoru</div>
                  <div className="font-bold">87%</div>
                </div>
              </div>
            </div>
            
            {/* Unlock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <button
                onClick={onUnlockClick}
                className="btn-primary flex items-center gap-2 animate-pulse-glow"
              >
                <Lock className="w-4 h-4" />
                Bayi ID ile Aç
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
