import { ReactNode } from "react";
import type { Match } from "../lib";

export interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export interface MatchCardProps {
    match: Match;
}

export interface Feature {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}

export type Theme = "light" | "dark" | "system";

export interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark";
}

export interface BlurredContentProps {
    children: ReactNode;
    isUnlocked?: boolean;
    onUnlock?: () => void;
    unlockText?: string;
}

export interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    token?: string;
}