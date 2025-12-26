"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Shield, 
  TrendingUp, 
  BarChart3, 
  ChevronRight,
  Sparkles,
  Target,
  Zap,
  LogOut
} from "lucide-react";
import { LeagueTable } from "@/components/BlurredContent";
import { LoginModal } from "@/components/LoginModal";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const { user, logout, isLoading } = useAuth();

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/10 via-transparent to-transparent" />
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-[var(--primary)]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          {/* User status bar */}
          {!isLoading && user && (
            <div className="flex justify-center mb-6">
              <div className="glass rounded-full px-4 py-2 flex items-center gap-3">
                <span className="text-sm text-[var(--text-muted)]">
                  Hoş geldin, <span className="text-white font-medium">{user.phone}</span>
                </span>
                <button
                  onClick={logout}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] transition"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="badge badge-primary flex items-center gap-2 text-sm px-4 py-2">
              <Sparkles className="w-4 h-4" />
              AI Destekli Tahminler
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-6 leading-tight">
            Profesyonel Bahis
            <br />
            <span className="text-[var(--primary)] glow-text">Analizleri</span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-muted)] text-center max-w-2xl mx-auto mb-12">
            xG verileri ve AI tahminleri ile daha bilinçli kararlar verin. 
            <span className="text-white"> Sadece doğrulanmış bayiler için.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!user ? (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary text-lg px-8 py-4 glow-primary flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Telefon ile Giriş Yap
              </button>
            ) : (
              <Link 
                href="/dashboard/premium"
                className="btn-primary text-lg px-8 py-4 glow-primary flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Premium İçeriklere Git
              </Link>
            )}
            <Link 
              href="/dashboard"
              className="btn-secondary text-lg px-8 py-4 flex items-center gap-2"
            >
              Maçları Gör
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Neden <span className="text-[var(--primary)]">Biz?</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="card text-center group hover:glow-primary">
            <div className="w-14 h-14 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
              <Target className="w-7 h-7 text-[var(--primary)]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">xG Verileri</h3>
            <p className="text-[var(--text-muted)]">
              Beklenen gol (xG) analizi ile maç sonuçlarını daha iyi öngörün.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card text-center group hover:glow-primary">
            <div className="w-14 h-14 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
              <TrendingUp className="w-7 h-7 text-[var(--primary)]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Tahminleri</h3>
            <p className="text-[var(--text-muted)]">
              Makine öğrenimi destekli akıllı tahminler ve güven skorları.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card text-center group hover:glow-primary">
            <div className="w-14 h-14 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
              <Zap className="w-7 h-7 text-[var(--primary)]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Anlık Güncellemeler</h3>
            <p className="text-[var(--text-muted)]">
              Canlı maç verileri ve oranlar, her gün güncellenen analizler.
            </p>
          </div>
        </div>
      </section>

      {/* League Table Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Puan Durumu</h2>
            <p className="text-[var(--text-muted)]">
              Premium tahminleri görmek için giriş yapın
            </p>
          </div>
          <Link 
            href="/dashboard"
            className="btn-secondary flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Tüm İstatistikler
          </Link>
        </div>

        <LeagueTable 
          showPredictions={true} 
          isVerified={!!user}
          onUnlockClick={() => setShowModal(true)}
        />
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="card glass text-center py-12 sm:py-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Premium İçeriğe Erişin
          </h2>
          <p className="text-[var(--text-muted)] max-w-xl mx-auto mb-8">
            Sistemde kayıtlı telefon numaranız ile giriş yaparak 
            tüm tahmin ve xG verilerine erişin.
          </p>
          {!user ? (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-lg px-8 py-4 animate-pulse-glow"
            >
              <Shield className="w-5 h-5 inline mr-2" />
              Hemen Giriş Yap
            </button>
          ) : (
            <Link
              href="/dashboard/premium"
              className="btn-primary text-lg px-8 py-4"
            >
              <Shield className="w-5 h-5 inline mr-2" />
              Premium İçeriklere Git
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-[var(--text-muted)] text-sm">
          <p>© 2024 Bahis Analiz Platformu. Tüm hakları saklıdır.</p>
          <p className="mt-2">Bu platform sadece bilgi amaçlıdır. Sorumlu bahis yapın.</p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          // Redirect to dashboard after login
          window.location.href = "/dashboard/premium";
        }}
      />
    </main>
  );
}
