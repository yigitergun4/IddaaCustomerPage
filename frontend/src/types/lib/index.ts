export interface User {
    id: number;
    phone: string;
    created_at: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isSessionTerminated: boolean;
    login: (phone: string) => Promise<void>;
    logout: () => Promise<void>;
    clearSessionTerminated: () => void;
}

export interface ApiOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    token?: string;
}

export interface Match {
    id: number;
    fixture_id: number;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    start_time: string;
    league_id: number;
    status?: string;
    home_team_logo?: string;
    away_team_logo?: string;
    league_name?: string;
    odds: Odds | null;
    stats: Stats | null;
}

export interface Odds {
    home_odd: number | null;
    draw_odd: number | null;
    away_odd: number | null;
    provider?: string;
}

export interface Stats {
    home_xg: number | null;
    away_xg: number | null;
    ai_prediction_score: number | null;
    prediction_score?: number | null;
    home_win_probability?: number | null;
    draw_probability?: number | null;
    away_win_probability?: number | null;
}

export interface SessionCheckResponse {
    valid: boolean;
    message: string;
}

export interface VerificationResponse {
    success: boolean;
    message: string;
    is_verified: boolean;
}

export interface League {
    id: number;
    name: string;
    country: string;
}
