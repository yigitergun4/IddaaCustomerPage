"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Home, 
  Shield, 
  BarChart3, 
  Menu, 
  X,
  CheckCircle,
  TrendingUp,
  ArrowLeft
} from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { Match } from "@/lib/api";

// Mock matches with full premium data visible
const mockMatches: Match[] = [
  {
    id: 1,
    fixture_id: 1001,
    home_team: "Galatasaray",
    home_team_logo: null,
    away_team: "Fenerbahçe",
    away_team_logo: null,
    start_time: new Date(Date.now() + 3600000 * 3).toISOString(),
    league_name: "Süper Lig",
    status: "NS",
    home_score: null,
    away_score: null,
    odds: { home_odd: 2.10, draw_odd: 3.40, away_odd: 3.25, provider: "API-Football" },
    stats: { home_xg: 2.45, away_xg: 1.23, prediction_score: 87, home_win_probability: 52, draw_probability: 26, away_win_probability: 22 }
  },
  {
    id: 2,
    fixture_id: 1002,
    home_team: "Beşiktaş",
    home_team_logo: null,
    away_team: "Trabzonspor",
    away_team_logo: null,
    start_time: new Date(Date.now() + 3600000 * 6).toISOString(),
    league_name: "Süper Lig",
    status: "NS",
    home_score: null,
    away_score: null,
    odds: { home_odd: 1.85, draw_odd: 3.60, away_odd: 4.00, provider: "API-Football" },
    stats: { home_xg: 1.89, away_xg: 1.12, prediction_score: 72, home_win_probability: 48, draw_probability: 30, away_win_probability: 22 }
  },
];

export default function PremiumDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isVerified = true; // Premium page - always show as verified

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-[var(--card-border)]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold text-[var(--primary)]">
            BahisAnaliz
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {mobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-2">
            <Link 
              href="/" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--secondary)]"
            >
              <Home className="w-5 h-5" />
              Ana Sayfa
            </Link>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--secondary)]"
            >
              <Calendar className="w-5 h-5" />
              Maçlar
            </Link>
            <Link 
              href="/dashboard/premium" 
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"
            >
              <BarChart3 className="w-5 h-5" />
              Premium
            </Link>
          </nav>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-[var(--card-border)] bg-[var(--card)]">
          <div className="p-6 border-b border-[var(--card-border)]">
            <Link href="/" className="text-2xl font-bold text-[var(--primary)]">
              BahisAnaliz
            </Link>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <Link 
              href="/" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--secondary)] transition"
            >
              <Home className="w-5 h-5" />
              Ana Sayfa
            </Link>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--secondary)] transition"
            >
              <Calendar className="w-5 h-5" />
              Maçlar
            </Link>
            <Link 
              href="/dashboard/premium" 
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"
            >
              <BarChart3 className="w-5 h-5" />
              Premium Analizler
            </Link>
          </nav>

          {/* Verified badge */}
          <div className="p-4 border-t border-[var(--card-border)]">
            <div className="flex items-center gap-2 text-[var(--success)]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Doğrulanmış</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-16 md:pt-0">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {/* Back button */}
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-white mb-6 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Maçlara Dön
            </Link>

            {/* Premium Header */}
            <div className="card glass mb-8 border-[var(--primary)]/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">Premium Analizler</h1>
                    <span className="badge badge-primary">PRO</span>
                  </div>
                  <p className="text-[var(--text-muted)]">
                    xG verileri ve AI tahminleri ile donatılmış detaylı maç analizleri.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Günlük Maç", value: "4", color: "primary" },
                { label: "Doğruluk Oranı", value: "%78", color: "success" },
                { label: "Aktif Analiz", value: "12", color: "info" },
                { label: "Bu Hafta Kazanç", value: "+156", color: "warning" },
              ].map((stat) => (
                <div key={stat.label} className="card text-center">
                  <div className={`text-2xl font-bold text-[var(--${stat.color})]`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Match Cards with Premium Data */}
            <h2 className="text-xl font-bold mb-4">Bugünün Premium Analizleri</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {mockMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  showPremium={true}
                  isVerified={isVerified}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
