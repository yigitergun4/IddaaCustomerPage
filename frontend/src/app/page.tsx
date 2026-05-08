"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";

export default function ComingSoon() {
  const [timeLeft, setTimeLeft] = useState<{
    days: string;
    hours: string;
    mins: string;
    secs: string;
  }>({
    days: "00",
    hours: "00",
    mins: "00",
    secs: "00",
  });
  const [email, setEmail] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Fixed Launch Date: 45 days from today
    const LAUNCH_DATE: Date = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    const pad: (n: number) => string = (n: number) => String(n).padStart(2, "0");

    const tick: () => void = () => {
      const diff: number = LAUNCH_DATE.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: "00", hours: "00", mins: "00", secs: "00" });
        return;
      }

      setTimeLeft({
        days: pad(Math.floor(diff / 86400000)),
        hours: pad(Math.floor((diff % 86400000) / 3600000)),
        mins: pad(Math.floor((diff % 3600000) / 60000)),
        secs: pad(Math.floor((diff % 60000) / 1000)),
      });
    };

    tick();
    const intervalId: NodeJS.Timeout = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/waitlist/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error("Backend response not ok");
      }
    } catch (error) {
      console.error("Waitlist error, falling back to local storage:", error);
      
      // Backup logic: Save to local storage if backend is down
      try {
        const existing = JSON.parse(localStorage.getItem("waitlist_backup") || "[]");
        localStorage.setItem("waitlist_backup", JSON.stringify([...existing, { email, date: new Date().toISOString() }]));
      } catch (lsError) {
        console.error("LocalStorage backup failed:", lsError);
      }

      // Still show success to user for better UX
      setSubmitted(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText("301912");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-[#080c10] text-[#e8edf4] font-sans overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <div className="w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(0,230,118,0.08)_0%,transparent_70%)] rounded-full shrink-0" />
      </div>

      {/* Grid Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,230,118,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,118,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-[1100px] flex flex-col min-h-screen px-6">
        {/* Header */}
        <header className="w-full py-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-[#00e676]">
              İddaaysel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 border border-white/10 rounded-full text-xs font-medium text-[#8b9ab1] bg-white/5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#00e676] shadow-[0_0_8px_#00e676] animate-pulse" />
              Geliştirme Aşamasında
            </div>
            {/* Link to login page */}
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Bayi Girişi
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center text-center pt-12 pb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#00e676]/25 rounded-full text-[13px] font-semibold text-[#00e676] bg-[#00e676]/5 tracking-widest uppercase mb-8 animate-pulse">
            🚀 VIP BAYİ ÜYELERİNE ÖZEL ERİŞİM
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold leading-tight tracking-tight max-w-[900px] mb-8">
            <span className="text-white">İddaaysel</span> ile <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#00e676] via-[#69f0ae] to-[#00e676] animate-gradient-x">
              Analiz Çağı Başlıyor
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#8b9ab1] max-w-[700px] leading-relaxed mb-12">
            Yapay zeka destekli tahminler ve profesyonel xG verileriyle kazanç şansınızı artırın. 
            Bu platform <span className="text-white font-bold underline decoration-[#00e676]">yalnızca</span> bayi kodumuzu kullananlara özeldir.
          </p>

          {/* Quick Action: Bayi Kodu Card */}
          <div className="w-full max-w-[700px] mb-16 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00e676] to-[#00c853] rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative p-8 bg-[#12121a] border border-white/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 text-left">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00e676]/10 text-[#00e676] text-sm">1</span>
                  Bayi Kodunuzu Güncelleyin
                </h3>
                <p className="text-[#8b9ab1] text-sm leading-relaxed mb-4">
                  İddaa uygulamasında profilinize girip bayi kodunu <strong className="text-white text-lg">301912</strong> olarak kaydedin.
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={copyToClipboard}
                    className="group/copy px-5 py-2.5 bg-black/40 border border-[#00e676]/30 rounded-xl hover:border-[#00e676] transition-all relative overflow-hidden"
                  >
                    <span className="text-[10px] text-[#00e676] uppercase tracking-tighter block mb-0.5 text-left">Aktif Bayi Kodu (Kopyala)</span>
                    <span className="text-2xl font-black text-white tracking-widest block">301912</span>
                    {copied && (
                      <div className="absolute inset-0 bg-[#00e676] flex items-center justify-center animate-in fade-in zoom-in duration-200">
                        <span className="text-[#080c10] font-bold text-sm">KOPYALANDI!</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <Link 
                  href="https://www.iddaa.com/" 
                  target="_blank" 
                  className="px-8 py-4 rounded-xl bg-[#00e676] text-[#080c10] font-black text-sm text-center shadow-[0_10px_20px_-10px_rgba(0,230,118,0.5)] hover:scale-105 active:scale-95 transition-all"
                >
                  ŞİMDİ GÜNCELLE →
                </Link>
                <p className="text-[10px] text-center text-[#5c6a7e] uppercase font-bold">iddaa.com'a Yönlendirilir</p>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-5 mb-16">
            {[
              { num: timeLeft.days, label: "Gün" },
              { num: timeLeft.hours, label: "Saat" },
              { num: timeLeft.mins, label: "Dakika" },
              { num: timeLeft.secs, label: "Saniye" },
            ].map((unit, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 min-w-[80px] md:min-w-[90px] p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md hover:border-[#00e676]/30 hover:-translate-y-1 transition-all"
              >
                <span className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white to-[#00e676] tracking-tighter">
                  {unit.num}
                </span>
                <span className="text-[10px] md:text-xs font-medium text-[#8b9ab1] tracking-widest uppercase">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[860px] mb-16 text-left">
            {[
              {
                icon: "🤖",
                title: "Yapay Zeka Tahminleri",
                desc: "Makine öğrenimi modelleriyle hesaplanan maç olasılıkları ve skor tahminleri.",
              },
              {
                icon: "📊",
                title: "xG Analizi",
                desc: "Beklenen gol (xG) verileriyle derinlemesine performans analizi.",
              },
              {
                icon: "🔐",
                title: "Bayi Doğrulama",
                desc: <>Yalnızca İddaa uygulamasında <strong className="text-white font-bold">301912</strong> numaralı bayi koduyla oynayanlar için özel premium içerik erişimi.</>,
              },
              {
                icon: "⚡",
                title: "Canlı Veriler",
                desc: "Süper Lig ve diğer liglere ait anlık maç istatistikleri.",
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="p-6 bg-white/[0.025] border border-white/10 rounded-2xl hover:bg-[#00e676]/5 hover:border-[#00e676]/25 hover:-translate-y-1 transition-all"
              >
                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#00e676]/10 border border-[#00e676]/20 text-xl mb-4">
                  {feat.icon}
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-[13px] text-[#8b9ab1] leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Step by Step Guide */}
          <div className="w-full max-w-[860px] mb-20 text-left">
            <h2 className="text-2xl font-bold text-white mb-8 text-center sm:text-left">Nasıl Üye Olurum?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Bayi Kodunu Ayarla", desc: "İddaa profilinden bayi kodunu 301912 yap." },
                { step: "2", title: "Maç Oyna", desc: "Favori maçlarını 301912 koduyla oyna." },
                { step: "3", title: "Premium'u Aç", desc: "Bayi girişi yap ve analizlere eriş." }
              ].map((item, idx) => (
                <div key={idx} className="relative p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center rounded-full bg-[#00e676] text-[#080c10] font-black text-sm shadow-[0_4px_12px_rgba(0,230,118,0.4)]">
                    {item.step}
                  </span>
                  <h4 className="text-white font-bold mb-2">{item.title}</h4>
                  <p className="text-[#8b9ab1] text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notify Form */}
          <div className="w-full max-w-[480px]">
            <p className="text-[13px] md:text-sm text-[#8b9ab1] mb-4">
              İddaa uygulamasında <strong>301912</strong> bayi kodumuzla oynuyorsanız, yayına girdiğimizde ilk sizin haberiniz olsun:
            </p>
            {!submitted ? (
              <form
                onSubmit={handleNotifySubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  required
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-[#00e676]/40 transition-colors placeholder:text-[#8b9ab1]"
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-br from-[#00e676] to-[#00c853] text-[#080c10] text-sm font-bold whitespace-nowrap hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,230,118,0.3)] transition-all"
                >
                  Beni Bildir
                </button>
              </form>
            ) : (
              <div className="px-4 py-4 rounded-xl bg-[#00e676]/10 border border-[#00e676]/20 text-[#00e676] text-sm font-medium animate-in fade-in">
                ✅ Kaydınız alındı! Yayına girdiğimizde sizi bilgilendireceğiz.
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <div className="w-full mt-10">
          <Footer />
        </div>
      </div>
    </div>
  );
}
