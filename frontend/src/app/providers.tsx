"use client";

import { AuthProvider } from "@/lib/AuthContext";
import { SessionTerminatedModal } from "@/components/SessionTerminatedModal";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <SessionTerminatedModal />
        </AuthProvider>
    );
}
