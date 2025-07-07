"use client";

import { type ReactNode, createContext, useContext } from "react";
import { useSession } from "~/lib/auth-client";

import type { User } from "~/lib/auth";

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data: session, isPending } = useSession();

	const contextValue: AuthContextType = {
		user: session?.user || null,
		isLoading: isPending,
		isAuthenticated: !!session?.user,
	};

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
