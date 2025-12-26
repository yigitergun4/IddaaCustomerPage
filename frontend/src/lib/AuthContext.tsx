"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, User } from "./api";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isSessionTerminated: boolean;
    login: (phone: string) => Promise<void>;
    logout: () => Promise<void>;
    clearSessionTerminated: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const SESSION_CHECK_INTERVAL = 30000; // 30 seconds

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSessionTerminated, setIsSessionTerminated] = useState(false);

    // Load token from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (storedToken) {
            setToken(storedToken);
            fetchUser(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    // Session check polling
    useEffect(() => {
        if (!token) return;

        const checkSession = async () => {
            try {
                const response = await api.checkSession(token);
                if (!response.valid) {
                    // Session was terminated
                    setIsSessionTerminated(true);
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem(TOKEN_KEY);
                }
            } catch {
                // Token expired or invalid
                setUser(null);
                setToken(null);
                localStorage.removeItem(TOKEN_KEY);
            }
        };

        const intervalId = setInterval(checkSession, SESSION_CHECK_INTERVAL);
        
        return () => clearInterval(intervalId);
    }, [token]);

    const fetchUser = async (authToken: string, retryCount = 0) => {
        try {
            const userData = await api.getMe(authToken);
            setUser(userData);
            setIsLoading(false);
        } catch (error: unknown) {
            // Only clear token on explicit auth failures, not network errors
            const message = error instanceof Error ? error.message : "";
            
            if (message.includes("Geçersiz") || message.includes("401") || message.includes("Oturum")) {
                // Auth failed - clear token
                localStorage.removeItem(TOKEN_KEY);
                setToken(null);
                setIsLoading(false);
            } else if (retryCount < 2) {
                // Network error - retry after delay
                setTimeout(() => fetchUser(authToken, retryCount + 1), 1000);
            } else {
                // Max retries - give up but keep token
                setIsLoading(false);
            }
        }
    };

    const login = useCallback(async (phone: string) => {
        const response = await api.loginWithPhone(phone);
        const newToken = response.access_token;
        
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setIsSessionTerminated(false);
        
        await fetchUser(newToken);
    }, []);

    const logout = useCallback(async () => {
        if (token) {
            try {
                await api.logout(token);
            } catch {
                // Ignore logout errors
            }
        }
        
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }, [token]);

    const clearSessionTerminated = useCallback(() => {
        setIsSessionTerminated(false);
    }, []);

    return (
        <AuthContext.Provider 
            value={{ 
                user, 
                token, 
                isLoading, 
                isSessionTerminated,
                login, 
                logout,
                clearSessionTerminated
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
