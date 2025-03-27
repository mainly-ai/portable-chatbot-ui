import { useClerk } from "@clerk/clerk-react";
import { createContext, useCallback, useContext, useMemo } from "react";

type AuthType = "clerk" | "unknown";

const AuthContext = createContext<{
	authType: AuthType;
}>({
	authType: "unknown",
});

export const SessionContext = createContext<{
	getToken: () => Promise<string>;
}>({
	getToken: async () => "",
});

export function useAuth() {
	const { authType } = useContext(AuthContext);
	const { getToken } = useContext(SessionContext);

	return { authType, getToken };
}

export function AuthProvider({ children }: React.PropsWithChildren) {
	const authType = useMemo(() => {
		// read _mainly_auth_provider cookie
		const cookies: Record<string, string> = document.cookie
			.split(";")
			.reduce((acc, cookie) => {
				const cookieParts = cookie.trim().split(/=(.+)/);
				if (cookieParts.length >= 2) {
					const key = cookieParts[0].trim();
					const value = cookieParts[1].trim();
					acc[key] = value;
				}
				return acc;
			}, {} as Record<string, string>);
		return cookies._mainly_auth_provider ?? "unknown";
	}, []) as AuthType;

	if (authType === "clerk") {
		return (
			<AuthContext.Provider value={{ authType }}>
				<ClerkSessionProvider>{children}</ClerkSessionProvider>
			</AuthContext.Provider>
		);
	}

	return <AuthContext.Provider value={{ authType }}>{children}</AuthContext.Provider>;
}

function ClerkSessionProvider({ children }: React.PropsWithChildren) {
	const clerk = useClerk();

	const getToken = useCallback(async () => {
		const token = await clerk.session?.getToken();
		if (!token) {
			throw new Error("No token found");
		}
		return token;
	}, [clerk]);

	return <SessionContext.Provider value={{ getToken }}>{children}</SessionContext.Provider>;
}
