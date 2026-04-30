"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Trophy, Globe, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface League {
  id: number;
  name: string;
  country: string;
}

interface LeagueSelectorProps {
  activeLeagueId: number;
  onLeagueChange: (id: number) => void;
}

export function LeagueSelector({ activeLeagueId, onLeagueChange }: LeagueSelectorProps) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeagues() {
      try {
        const data = await api.getLeagues();
        setLeagues(data);
      } catch (err) {
        console.error("Failed to load leagues:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLeagues();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="px-4 mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Aktif Ligler
        </h3>
      </div>
      
      {leagues.map((league) => {
        const isActive = activeLeagueId === league.id;
        
        return (
          <button
            key={league.id}
            onClick={() => onLeagueChange(league.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-left",
              isActive 
                ? "bg-[var(--primary)]/10 text-[var(--primary)]" 
                : "text-[var(--text-muted)] hover:text-white hover:bg-white/5 shadow-sm"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
              isActive ? "bg-[var(--primary)]/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "bg-white/5"
            )}>
              {league.country === "Turkey" ? (
                <Trophy className="w-4 h-4" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-none">
                {league.name}
              </p>
              <p className="text-[10px] text-white/30 mt-1 font-medium">
                {league.country}
              </p>
            </div>

            {isActive && (
              <ChevronRight className="w-3 h-3 text-[var(--primary)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
