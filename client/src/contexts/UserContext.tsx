
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

interface User {
    _id: string;
    email: string;
    gems: number;
    name?: string;
    nickname?: string;
    role?: string;
    organization?: string;
    subject?: string;
    studentId?: string;
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    spendGem: () => Promise<boolean>;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                console.error('Failed to fetch user data');
                // Optional: clear token if invalid
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const spendGem = async (): Promise<boolean> => {
        if (!user || user.gems < 1) return false;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/spend-gem', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUser(prev => prev ? { ...prev, gems: data.gems } : null);
                    return true;
                }
            }
        } catch (error) {
            console.error('Error spending gem:', error);
        }
        return false;
    };

    return (
        <UserContext.Provider value={{ user, loading, spendGem, refreshUser: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
