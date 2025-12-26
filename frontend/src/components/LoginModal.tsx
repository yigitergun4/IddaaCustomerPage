"use client";

import { useState } from "react";
import { X, Phone, CheckCircle, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { LoginModalProps } from "@/types/components";


export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
    const [phone, setPhone] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    
    const { login } = useAuth();

    if (!isOpen) return null;

    const handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers
        const value: string = e.target.value.replace(/\D/g, "");
        setPhone(value);
    };

    const handleSubmit: (e: React.FormEvent) => void = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setLoading(true);
        setError(null);

        try {
            await login(phone);
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bir hata oluştu." as string);
        } finally {
            setLoading(false);
        }
    };

    const formatPhone: (value: string) => string = (value: string) => {
        if (value.length <= 3) return value;
        if (value.length <= 6) return `${value.slice(0, 3)} ${value.slice(3)}`;
        if (value.length <= 8) return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
        return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 8)} ${value.slice(8, 10)}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-float">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        success 
                            ? "bg-[var(--success)]/20" 
                            : "bg-[var(--primary)]/20"
                    }`}>
                        {success ? (
                            <CheckCircle className="w-8 h-8 text-[var(--success)]" />
                        ) : (
                            <Phone className="w-8 h-8 text-[var(--primary)]" />
                        )}
                    </div>
                </div>

                {success ? (
                    // Success state
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Giriş Başarılı!</h2>
                        <p className="text-[var(--text-muted)]">
                            Yönlendiriliyorsunuz...
                        </p>
                    </div>
                ) : (
                    // Form state
                    <>
                        <h2 className="text-2xl font-bold text-center mb-2">
                            Telefon ile Giriş Yap
                        </h2>
                        <p className="text-[var(--text-muted)] text-center mb-6">
                            Sistemde kayıtlı telefon numaranızı girin.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Telefon Numarası
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                        +90
                                    </span>
                                    <input
                                        type="tel"
                                        value={formatPhone(phone)}
                                        onChange={handlePhoneChange}
                                        placeholder="5XX XXX XX XX"
                                        className="input text-lg tracking-wider !pl-14"
                                        maxLength={14}
                                        required
                                        disabled={loading} 
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-[var(--danger)]/10 rounded-lg text-[var(--danger)]">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || phone.length < 10}
                                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Giriş yapılıyor...
                                    </>
                                ) : (
                                    <>
                                        <Phone className="w-5 h-5" />
                                        Giriş Yap
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-[var(--text-subtle)] text-center mt-4">
                            Telefon numaranız sistemde kayıtlı değilse,{" "}
                            <a href="#" className="text-[var(--primary)] hover:underline">
                                bayinize başvurun
                            </a>
                            .
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
