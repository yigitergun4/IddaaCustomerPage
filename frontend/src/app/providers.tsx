"use client";

import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionTerminatedModal } from "@/components/SessionTerminatedModal";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                {children}
                <SessionTerminatedModal />
            </AuthProvider>
        </ThemeProvider>
    );
}
