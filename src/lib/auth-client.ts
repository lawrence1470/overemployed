import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: "http://localhost:3001", // Replace with your actual base URL
});

export const { signIn, signOut, signUp, useSession } = authClient;
