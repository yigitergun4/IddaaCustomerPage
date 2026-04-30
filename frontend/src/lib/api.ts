import {
    ApiOptions,
    Match,
    User,
    SessionCheckResponse,
    VerificationResponse,
    League,
} from "../types/lib";

const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export const api = {
    // Matches
    getMatches: (token: string, date?: string) =>
        fetchApi<Match[]>(`/api/matches/${date ? `?date=${date}` : ""}`, { token }),

    // Phone Login
    loginWithPhone: (phone: string) =>
        fetchApi<{ access_token: string; token_type: string }>("/api/users/login", {
            method: "POST",
            body: { phone: phone },
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
        fetchApi<VerificationResponse>("/api/users/verify", {
            method: "POST",
            token,
            body: { member_id: memberId }
        }),

    // Leagues (Mocked for now to fix build)
    getLeagues: (): Promise<League[]> =>
        Promise.resolve([
            { id: 203, name: "Süper Lig", country: "Turkey" },
            { id: 39, name: "Premier League", country: "England" },
            { id: 140, name: "La Liga", country: "Spain" }
        ]),
};
