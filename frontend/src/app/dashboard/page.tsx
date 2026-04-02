"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { MatchCard } from "@/components/MatchCard";
import { Match } from "@/types/lib";
import { Shield, LogOut, Loader2, Calendar, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function Dashboard() {
    const { user, token, logout, isLoading: authLoading } = useAuth();
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const loadContent: () => Promise<void> = async () => {
            try {
                const data = await api.getMatches(token);
                setMatches(data);
            } catch (err: any) {
                setError("Veriler yüklenemedi. Lütfen sayfayı yenileyin.");
            } finally {
                setLoading(false);
            }
        };

        loadContent();
    }, [token]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [authLoading, user, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] pb-20">
            {/* VIP Navigation Bar */}
            <nav className="border-b border-[var(--card-border)] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Shield className="w-5 h-5 shrink-0 text-[var(--primary)]" />
                        <span className="font-bold text-base sm:text-lg tracking-tight uppercase text-[var(--foreground)] truncate pr-2">
                            İddaa Aysel <span className="hidden xs:inline">301912</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 font-sans">
                        <ThemeToggle />
                        <div className="hidden lg:flex text-[10px] text-[var(--text-muted)] items-center gap-2 uppercase font-bold tracking-widest bg-[var(--secondary)] px-3 py-2 rounded-xl border border-[var(--card-border)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                            Live Data
                        </div>
                        <button
                            onClick={logout}
                            className="bg-[var(--card)] hover:bg-[var(--danger)]/10 border border-[var(--card-border)] hover:border-[var(--danger)]/30 text-[var(--text-muted)] hover:text-[var(--danger)] px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Çıkış Yap</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 pt-10">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold mb-2 text-[var(--foreground)]">Günlük Analiz Bülteni</h1>
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <Calendar className="w-4 h-4" />
                        <span>Sadece size özel, yüksek isabetli Yapay Zeka tahminleri.</span>
                    </div>
                </header>

                {error && (
                    <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] rounded-xl p-4 mb-8">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                    </div>
                ) : matches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.map((match: Match) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                ) : (
                    <div className="card text-center py-20 px-4">
                        <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
                        <p className="text-lg text-[var(--text-muted)]">Bugün için analiz bulunamadı.</p>
                        <p className="text-sm text-[var(--text-subtle)] mt-2">Daha sonra tekrar kontrol ediniz.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
