"use client";

import { useState } from "react";
import { Shield, Loader2, ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import FeatureGrid from "@/components/FeatureGrid";

export default function Home() {
    const [phone, setPhone] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const { login } = useAuth();
    const router = useRouter();

    const formatPhoneNumber = (value: string): string => {
        if (!value) return value;
        const number = value.replace(/[^\d]/g, "");
        const length = number.length;
        if (length < 4) return number;
        if (length < 7) return `${number.slice(0, 3)} ${number.slice(3)}`;
        if (length < 9) return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
        return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 8)} ${number.slice(8, 10)}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const rawDigits = phone.replace(/\D/g, "");
        const formattedPhone = "0" + rawDigits;

        if (rawDigits.length !== 10) {
            setError("Lütfen numaranızı eksiksiz giriniz.");
            return;
        }

        setIsSubmitting(true);
        try {
            await login(formattedPhone);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Giriş başarısız oldu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--background)] relative overflow-x-hidden font-sans flex flex-col">
            {/* Dynamic Backgrounds */}
            <div className="fixed inset-0 bg-[#0a0a0f] pointer-events-none z-0" />
            <div className="fixed inset-0 bg-gradient-to-tr from-[#051105] via-transparent to-[#0a150a] pointer-events-none z-0" />
            <div className="fixed top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[var(--primary)]/5 rounded-full blur-[150px] animate-pulse pointer-events-none z-0 select-none" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[var(--primary)]/5 rounded-full blur-[150px] animate-pulse pointer-events-none z-0 select-none" />

            {/* Main Content Wrapper */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex-1 flex flex-col justify-center py-8 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    
                    {/* Left Side: Branding and Info */}
                    <div className="space-y-12 text-center lg:text-left">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-widest">
                                <Lock className="w-3 h-3" />
                                Güvenli VIP Bağlantısı
                            </div>
                            <h1 className="text-5xl sm:text-7xl font-black tracking-tightest leading-none text-white">
                                İddaa <span className="text-[var(--primary)]">Aysel</span>
                                <div className="text-3xl sm:text-4xl opacity-50 mt-2 lowercase">bayi no: 301912</div>
                            </h1>
                            <p className="text-[var(--text-muted)] text-lg sm:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                Türkiye&apos;nin en gelişmiş yapay zeka destekli bahis analiz portalına hoş geldiniz. 
                                Sadece bayimize kayıtlı üyeler için özel içerik.
                            </p>
                        </div>

                        {/* Feature Grid Component */}
                        <FeatureGrid />
                    </div>

                    {/* Right Side: Login Card */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="card glass w-full max-w-[440px] p-10 sm:p-14 border-[var(--primary)]/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 to-transparent opacity-50 pointer-events-none" />
                            
                            <div className="relative z-10 space-y-10">
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 bg-black/50 border border-[var(--primary)]/30 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative">
                                        <div className="absolute inset-0 bg-[var(--primary)] blur-2xl opacity-10" />
                                        <Shield className="w-10 h-10 text-[var(--primary)]" />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight text-white uppercase italic">Üye Girişi</h2>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-stretch bg-black/40 border border-white/10 rounded-2xl focus-within:border-[var(--primary)]/60 focus-within:shadow-[0_0_40px_rgba(34,197,94,0.15)] transition-all overflow-hidden group/input">
                                            <div className="flex items-center px-5 border-r border-white/5 bg-white/5">
                                                <span className="text-xl font-bold text-[var(--primary)]">0</span>
                                            </div>
                                            <input
                                                id="phone"
                                                type="tel"
                                                inputMode="numeric"
                                                value={formatPhoneNumber(phone)}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, "");
                                                    if (val.startsWith("0")) val = val.substring(1);
                                                    setPhone(val.slice(0, 10));
                                                }}
                                                className="flex-1 bg-transparent border-none outline-none px-4 py-5 text-xl font-bold text-white placeholder:text-white/10 focus:ring-0"
                                                placeholder="5XX XXX XX XX"
                                                disabled={isSubmitting}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-xs font-bold px-4 py-4 rounded-xl text-center animate-shake">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || phone.length < 1}
                                        className="btn-primary w-full py-5 text-lg text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 rounded-2xl shadow-[0_20px_40px_rgba(34,197,94,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                Giriş Yap
                                                <ArrowRight className="w-6 h-6" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="pt-4 text-center">
                                    <p className="text-[10px] text-[var(--text-subtle)] font-bold uppercase tracking-[.2em] opacity-50">
                                        End-to-End Encryption Secured
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reusable Footer Component */}
            <Footer />
        </main>
    );
}
