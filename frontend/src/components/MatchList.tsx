"use client";

import { Match } from "@/types/lib";
import { MatchCard } from "@/components/MatchCard";
import { Calendar } from "lucide-react";

interface MatchListProps {
  matches: Match[];
  onMatchClick: (match: Match) => void;
}

/**
 * Container component responsible for laying out MatchCard items.
 * Owns grid/responsive layout logic; delegates rendering to MatchCard.
 */
export function MatchList({ matches, onMatchClick }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center mb-5">
          <Calendar className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
        <h3 className="text-lg font-bold mb-2">Maç bulunamadı</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          Şu an için programlanmış maç verisi mevcut değil. Lütfen daha sonra tekrar deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onClick={onMatchClick}
        />
      ))}
    </div>
  );
}
