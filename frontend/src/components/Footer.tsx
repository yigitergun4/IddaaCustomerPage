"use client";

import React from "react";
import { MapPin, Instagram, Facebook } from "lucide-react";

const Footer: React.FC = () => {
    return (
        <footer className="relative w-full py-12 px-6 border-t border-[var(--card-border)] backdrop-blur-md z-10 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Copyright & Dealer Info */}
                <div className="text-center md:text-left space-y-2">
                    <p className="text-[var(--text-muted)] text-sm font-medium">
                        &copy; {new Date().getFullYear()} <span className="text-[var(--primary)] font-bold">İddaa Aysel 301912</span>. Tüm hakları saklıdır.
                    </p>
                    <p className="text-[var(--text-subtle)] text-[11px] uppercase tracking-widest opacity-60 flex items-center justify-center md:justify-start gap-2">
                        <MapPin className="w-6 h-6" />
                        Adres: İnönü Mahallesi Selim Sokak No:28/A, Küçükçekmece/İstanbul
                    </p>
                </div>

                {/* Social Media & Security Badge */}
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                    {/* Social links provided by user */}
                    <div className="flex items-center gap-5">
                        <a
                            href="https://www.instagram.com/iddaaysel/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 rounded-2xl bg-[var(--secondary)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all outline-none group"
                            title="Instagram"
                        >
                            <Instagram className="w-6 h-6 transition-transform group-hover:scale-110" />
                        </a>
                        <a
                            href="https://www.facebook.com/profile.php?id=61573291880962"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 rounded-2xl bg-[var(--secondary)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all outline-none group"
                            title="Facebook"
                        >
                            <Facebook className="w-6 h-6 transition-transform group-hover:scale-110" />
                        </a>
                    </div>
                    <div className="h-10 w-[1px] bg-[var(--card-border)] hidden md:block" />
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--secondary)] border border-[var(--card-border)] shadow-inner">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_10px_var(--primary)]" />
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">System Secure</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
