"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeContextType, Theme } from "@/types/components";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

    const applyTheme: (themeValue: Theme) => void = (themeValue: Theme) => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        let actualTheme: "light" | "dark" = "dark";

        if (themeValue === "system") {
            actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        } else {
            actualTheme = themeValue;
        }

        root.classList.add(actualTheme);
        setResolvedTheme(actualTheme);

        // Ensure background color is applied to html/body for overscroll
        root.style.colorScheme = actualTheme;
    };

    const setTheme: (newTheme: Theme) => void = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    };

    useEffect(() => {
        const storedTheme: Theme | null = localStorage.getItem("theme") as Theme | null;
        const initialTheme: Theme = storedTheme || "system";

        setThemeState(initialTheme);
        applyTheme(initialTheme);

        // Listen for system changes if in system mode
        const mediaQuery: MediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange: () => void = () => {
            if (localStorage.getItem("theme") === "system" || !localStorage.getItem("theme")) {
                applyTheme("system");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme: () => ThemeContextType = () => {
    const context: ThemeContextType | undefined = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
