"use client";

import React from "react";
import { Zap, Target, Shield, Activity } from "lucide-react";
import type { Feature } from "@/types/components";

const features: Feature[] = [
    {
        icon: Zap,
        title: "Yapay Zeka Destekli Analiz",
        description: "Gelişmiş algoritmalarla yüksek isabetli tahminler.",
    },
    {
        icon: Target,
        title: "xG Verileri",
        description: "Profesyonel gol beklentisi ve performans metrikleri.",
    },
    {
        icon: Shield,
        title: "VIP Erişim",
        description: "Bayimize kayıtlı üyeler için kapalı devre ağ.",
    },
    {
        icon: Activity,
        title: "Anlık Data",
        description: "7/24 güncellenen canlı skor ve bülten takibi.",
    },
];

const FeatureGrid: React.FC = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 group">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-black transition-all">
                        <feature.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-1">
                            {feature.title}
                        </h3>
                        <p className="text-[var(--text-muted)] text-xs leading-relaxed opacity-70">
                            {feature.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FeatureGrid;
