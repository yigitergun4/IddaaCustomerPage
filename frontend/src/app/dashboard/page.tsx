"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Home, Shield, BarChart3, Menu, X, Loader2 } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { VerificationModal } from "@/components/VerificationModal";
import { Match, api } from "@/lib/api";

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVerified] = useState(false); // This would come from auth context
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        const response = await api.getMatches();
        setMatches(response || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Maçlar yüklenemedi");
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

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
        
        {/* Mobile Menu */}
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
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"
            >
              <Calendar className="w-5 h-5" />
              Maçlar
            </Link>
            <Link 
              href="/dashboard/premium" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--secondary)]"
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
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"
            >
              <Calendar className="w-5 h-5" />
              Maçlar
            </Link>
            <Link 
              href="/dashboard/premium" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--secondary)] transition"
            >
              <BarChart3 className="w-5 h-5" />
              Premium Analizler
            </Link>
          </nav>

          {/* Verification CTA in sidebar */}
          {!isVerified && (
            <div className="p-4 border-t border-[var(--card-border)]">
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Doğrula
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-16 md:pt-0">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Denmark Superliga</h1>
              <p className="text-[var(--text-muted)]">
                Maç fikstürü ve sonuçlar (Free Plan - 2005/2006 sezonu)
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                <span className="ml-3 text-[var(--text-muted)]">Maçlar yükleniyor...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <p className="text-[var(--danger)] mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn-secondary"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {/* Match Cards */}
            {!loading && !error && matches.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    showPremium={false}
                    isVerified={isVerified}
                    onUnlockClick={() => setShowModal(true)}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && matches.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Henüz maç yok</h3>
                <p className="text-[var(--text-muted)]">
                  API'den maç verisi alınamadı. Lütfen daha sonra tekrar deneyin.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          window.location.href = "/dashboard/premium";
        }}
      />
    </div>
  );
}
