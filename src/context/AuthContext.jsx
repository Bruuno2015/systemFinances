import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Theme Management
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const storedTheme = localStorage.getItem('fincontrol_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (storedTheme) {
            setTheme(storedTheme);
        } else if (systemPrefersDark) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('fincontrol_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        // Check for stored user on mount
        try {
            const storedUser = localStorage.getItem('fincontrol_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Failed to parse stored user:', error);
            localStorage.removeItem('fincontrol_user');
        } finally {
            setLoading(false);
        }
    }, []);

    // Session Timeout Logic (30 minutes of inactivity)
    useEffect(() => {
        let timeoutId;

        const resetTimeout = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (user) {
                timeoutId = setTimeout(() => {
                    logout();
                    alert('Sua sessão expirou por inatividade (Compliance ISO/TISAX). Faça login novamente.');
                    window.location.href = '/login';
                }, 30 * 60 * 1000); // 30 minutes
            }
        };

        const events = ['load', 'mousemove', 'mousedown', 'click', 'scroll', 'keypress'];
        
        if (user) {
            resetTimeout();
            events.forEach(evt => window.addEventListener(evt, resetTimeout));
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(evt => window.removeEventListener(evt, resetTimeout));
        };
    }, [user]);

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/auth/login`, { email, password });
            const userData = response.data;
            setUser(userData);
            localStorage.setItem('fincontrol_user', JSON.stringify(userData));
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || 'Erro ao realizar login' 
            };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fincontrol_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, theme, toggleTheme }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
