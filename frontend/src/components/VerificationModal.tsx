"use client";

import { useState } from "react";
import { X, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { VerificationModalProps } from "@/types/components";

export function VerificationModal({ isOpen, onClose, onSuccess, token }: VerificationModalProps) {
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!token) {
        setError("Lütfen önce giriş yapın.");
        setLoading(false);
        return;
      }

      const result = await api.verify(token, memberId);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
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
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${success
              ? "bg-[var(--success)]/20"
              : "bg-[var(--primary)]/20"
            }`}>
            {success ? (
              <CheckCircle className="w-8 h-8 text-[var(--success)]" />
            ) : (
              <Shield className="w-8 h-8 text-[var(--primary)]" />
            )}
          </div>
        </div>

        {success ? (
          // Success state
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Doğrulama Başarılı!</h2>
            <p className="text-[var(--text-muted)]">
              Premium içeriklere erişiminiz açıldı. Yönlendiriliyorsunuz...
            </p>
          </div>
        ) : (
          // Form state
          <>
            <h2 className="text-2xl font-bold text-center mb-2">
              Premium İçeriğin Kilidini Aç
            </h2>
            <p className="text-[var(--text-muted)] text-center mb-6">
              AI tahminleri ve xG verilerine erişmek için Iddaa Bayi Üye Numaranızı girin.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Iddaa Üye Numarası
                </label>
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                  placeholder="Örn: BAY123456"
                  className="input text-lg tracking-wider"
                  required
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-[var(--danger)]/10 rounded-lg text-[var(--danger)]">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !memberId.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Doğrulanıyor...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Doğrula ve Kilidi Aç
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-[var(--text-subtle)] text-center mt-4">
              Üye numaranız yoksa,{" "}
              <a href="#" className="text-[var(--primary)] hover:underline">
                bayimizden üye olabilirsiniz
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
