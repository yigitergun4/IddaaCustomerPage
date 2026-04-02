"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 p-1 bg-[var(--secondary)] border border-[var(--card-border)] rounded-2xl backdrop-blur-md">
            <button
                onClick={() => setTheme("light")}
                className={`p-2 rounded-xl transition-all ${theme === "light"
                        ? "bg-[var(--primary)] text-white shadow-lg"
                        : "text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                    }`}
                title="Açık Tema"
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-2 rounded-xl transition-all ${theme === "dark"
                        ? "bg-[var(--primary)] text-white shadow-lg"
                        : "text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                    }`}
                title="Koyu Tema"
            >
                <Moon className="w-4 h-4" />
            </button>
        </div>
    );
};

export default ThemeToggle;
