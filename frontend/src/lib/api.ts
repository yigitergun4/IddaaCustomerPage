const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    token?: string;
}

async function fetchApi<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = "GET", body, token } = options;

    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "API request failed");
    }

    return response.json();
}

// Types
export interface Match {
    id: number;
    fixture_id: number;
    home_team: string;
    home_team_logo: string | null;
    away_team: string;
    away_team_logo: string | null;
    start_time: string;
    league_name: string | null;
    status: string;
    home_score: number | null;
    away_score: number | null;
    odds: Odds | null;
    stats: Stats | null;
}

export interface Odds {
    home_odd: number | null;
    draw_odd: number | null;
    away_odd: number | null;
    provider: string;
}

export interface Stats {
    home_xg: number | null;
    away_xg: number | null;
    prediction_score: number | null;
    home_win_probability: number | null;
    draw_probability: number | null;
    away_win_probability: number | null;
}

export interface User {
    id: number;
    email: string | null;
    phone: string | null;
    member_id: string | null;
    is_verified: boolean;
    created_at: string;
}

export interface VerifyResponse {
    success: boolean;
    message: string;
    is_verified: boolean;
}

export interface SessionCheckResponse {
    valid: boolean;
    message: string;
}

export interface TeamStanding {
    position: number;
    team: string;
    team_logo: string | null;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
}

// API functions
export const api = {
    // Matches
    getMatches: (date?: string) =>
        fetchApi<Match[]>(`/api/matches/${date ? `?date=${date}` : ""}`),

    getPremiumMatches: (token: string, date?: string) =>
        fetchApi<Match[]>(`/api/matches/premium${date ? `?date=${date}` : ""}`, { token }),

    // Standings
    getStandings: () =>
        fetchApi<{ data: TeamStanding[] }>("/api/matches/standings/turkey"),

    // Phone login (no password required)
    loginWithPhone: (phone: string) =>
        fetchApi<{ access_token: string; token_type: string }>("/api/users/login", {
            method: "POST",
            body: { phone },
        }),

    // Session check for polling
    checkSession: (token: string) =>
        fetchApi<SessionCheckResponse>("/api/users/session-check", { token }),

    // Logout
    logout: (token: string) =>
        fetchApi<{ message: string }>("/api/users/logout", {
            method: "POST",
            token
        }),

    // Get current user
    getMe: (token: string) =>
        fetchApi<User>("/api/users/me", { token }),

    // Verify member ID
    verify: (token: string, memberId: string) =>
        fetchApi<VerifyResponse>("/api/users/verify", {
            method: "POST",
            body: { member_id: memberId },
            token,
        }),
};
