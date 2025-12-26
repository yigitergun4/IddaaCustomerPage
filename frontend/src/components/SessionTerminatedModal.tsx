"use client";

import { X, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export function SessionTerminatedModal() {
    const { isSessionTerminated, clearSessionTerminated } = useAuth();

    if (!isSessionTerminated) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            
            {/* Modal */}
            <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-float">
                {/* Close button */}
                <button
                    onClick={clearSessionTerminated}
                    className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[var(--danger)]/20">
                        <AlertTriangle className="w-8 h-8 text-[var(--danger)]" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2">
                    Oturum Sonlandırıldı
                </h2>
                <p className="text-[var(--text-muted)] text-center mb-6">
                    Başka bir cihazdan giriş yapıldığı için bu oturumunuz sonlandırıldı.
                </p>

                <button
                    onClick={() => {
                        clearSessionTerminated();
                        window.location.href = "/";
                    }}
                    className="btn-primary w-full"
                >
                    Anasayfaya Dön
                </button>
            </div>
        </div>
    );
}
