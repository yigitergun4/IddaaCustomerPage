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