"use client";

import { ReactNode } from "react";
import { Lock, AlertCircle } from "lucide-react";

interface BlurredContentProps {
  children: ReactNode;
  isUnlocked?: boolean;
  onUnlock?: () => void;
  unlockText?: string;
}

export function BlurredContent({ 
  children, 
  isUnlocked = false, 
  onUnlock,
  unlockText = "Bayi ID ile Aç"
}: BlurredContentProps) {
  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="blur-paywall">
        {children}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
        <button
          onClick={onUnlock}
          className="btn-primary flex items-center gap-2 glow-primary"
        >
          <Lock className="w-4 h-4" />
          {unlockText}
        </button>
      </div>
    </div>
  );
}

// Simple table component for league standings (PAID PLAN ONLY)
interface LeagueTableProps {
  showPredictions?: boolean;
  isVerified?: boolean;
  onUnlockClick?: () => void;
}

export function LeagueTable({ showPredictions = true, isVerified = false, onUnlockClick }: LeagueTableProps) {
  // Standings require paid plan - show info message
  return (
    <div className="card overflow-hidden">
      <h3 className="text-lg font-bold mb-4">Denmark Superliga Puan Durumu</h3>
      
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--text-muted)] mb-4" />
        <p className="text-[var(--text-muted)] mb-2">
          Puan tablosu ücretsiz planda mevcut değil.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Bu özellik için ücretli SportMonks planı gereklidir.
        </p>
      </div>

      {showPredictions && !isVerified && (
        <div className="mt-4 flex justify-center">
          <button onClick={onUnlockClick} className="btn-primary flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Premium Özellikleri Aç
          </button>
        </div>
      )}
    </div>
  );
}
