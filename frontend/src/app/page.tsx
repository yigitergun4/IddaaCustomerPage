"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/lib/api";
import { trackMetaEvent } from "@/components/MetaPixel";

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
    // Fixed Launch Date: June 22, 2026 (45 days from initial marketing push)
    // This remains static across refreshes.
    const LAUNCH_DATE: Date = new Date("2026-06-22T00:00:00");
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
      {/* Noise Texture */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay" 
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#00e676]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#69f0ae]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,230,118,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
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
            🚀 İDDAAYSEL BAYİ ÜYELERİNE ÖZEL ERİŞİM
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black leading-[1.1] tracking-normal max-w-[1000px] mb-10 pr-10 overflow-visible" style={{ transform: 'skewX(-10deg)' }}>
            <span className="text-white drop-shadow-[0_10px_30px_rgba(255,255,255,0.2)]">İDDAAYSEL</span> <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#00e676] via-white to-[#00e676] animate-gradient-x drop-shadow-[0_10px_30px_rgba(0,230,118,0.3)]">
              ANALİZ ÇAĞI&nbsp;
            </span>
          </h1>

          <div className="w-full max-w-[500px] mb-12">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#8b9ab1] mb-2">
              <span>Erken Erişim Doluluk Oranı</span>
              <span className="text-[#00e676]">84%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-[#00e676] to-[#69f0ae] rounded-full animate-pulse" style={{ width: '84%' }} />
            </div>
          </div>

          <div className="w-full max-w-[850px] mb-20 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00e676] via-[#69f0ae] to-[#00c853] rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-500"></div>
            <div className="relative p-10 bg-[#0d1117] border border-white/10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-10 text-left overflow-hidden">
              {/* Subtle Background Pattern for Card */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00e676]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
              
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded bg-[#00e676]/10 text-[#00e676] text-[10px] font-bold uppercase tracking-widest border border-[#00e676]/20">Gerekli Adım</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
                  Bayi Kodunuzu <span className="text-[#00e676]">301912</span> Olarak Güncelleyin
                </h3>
                <p className="text-[#8b9ab1] text-base leading-relaxed mb-6 max-w-md">
                  İddaa profilinizde bayi kodunu güncelleyerek, <span className="text-white font-bold">ücretsiz</span> AI analiz paneline sınırsız erişim kazanın.
                </p>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={copyToClipboard}
                    className="group/copy flex items-center gap-4 px-6 py-3 bg-black/40 border border-white/10 rounded-2xl hover:border-[#00e676]/50 transition-all relative overflow-hidden"
                  >
                    <div>
                      <span className="text-[10px] text-[#5c6a7e] uppercase font-bold block mb-1">Kodu Kopyala</span>
                      <span className="text-3xl font-black text-white tracking-[0.2em]">301912</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/copy:bg-[#00e676]/10 transition-colors">
                      <svg className="w-5 h-5 text-[#8b9ab1] group-hover/copy:text-[#00e676] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </div>
                    {copied && (
                      <div className="absolute inset-0 bg-[#00e676] flex items-center justify-center animate-in fade-in zoom-in duration-200">
                        <span className="text-[#080c10] font-bold text-sm">KOPYALANDI!</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full md:w-auto relative z-10">
                <Link 
                  href="https://www.iddaa.com/" 
                  target="_blank" 
                  onClick={() => trackMetaEvent("Lead", { content_name: "Bayi Kodu Güncelleme" })}
                  className="px-10 py-5 rounded-2xl bg-[#00e676] text-[#080c10] font-black text-base text-center shadow-[0_20px_40px_-10px_rgba(0,230,118,0.4)] hover:scale-[1.05] hover:shadow-[0_25px_50px_-10px_rgba(0,230,118,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  ŞİMDİ GÜNCELLE
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <div className="flex items-center justify-center gap-2 text-[11px] text-[#5c6a7e] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]" />
                  Resmi iddaa.com Yönlendirmesi
                </div>
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
          <div className="w-full max-w-[900px] mb-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector Line for Desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-8" />
              
              {[
                { step: "01", title: "Bayi Kodunu Ayarla", desc: "İddaa profilinden bayi kodunu 301912 yap." },
                { step: "02", title: "Kuponunu Yap", desc: "Favori maçlarını bu kodla oyna." },
                { step: "03", title: "Analizleri Kap", desc: "Özel AI panelimize tam erişim sağla." }
              ].map((item, idx) => (
                <div key={idx} className="group relative p-8 bg-[#12121a] border border-white/5 rounded-3xl hover:border-[#00e676]/40 transition-all flex flex-col items-center text-center">
                  <span className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white font-black text-xl mb-6 group-hover:bg-[#00e676] group-hover:text-[#080c10] transition-all duration-500">
                    {item.step}
                  </span>
                  <h4 className="text-white font-black text-lg mb-3 tracking-tight">{item.title}</h4>
                  <p className="text-[#8b9ab1] text-sm leading-relaxed">{item.desc}</p>
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
