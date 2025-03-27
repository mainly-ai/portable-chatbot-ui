import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

import { ClerkProvider } from '@clerk/clerk-react';
import { useAuth } from "./contexts/AuthContext";

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export function Shell() {
	const { authType } = useAuth();

	if (authType === 'clerk') {
		if (!PUBLISHABLE_KEY) {
			return (
				<p>Clerk is required by the workflow defining this app, but no publishable key was found. Please add a <code>VITE_CLERK_PUBLISHABLE_KEY</code> environment variable to your .env file.</p>
			)
		}

		return (
			<main className="shell-container">
				<ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
					<Sidebar>
						<SignedIn>
							<UserButton showName appearance={{
								elements: {
									avatarBox: "!w-12 !h-12",
									userButtonBox: {
										flexDirection: "row-reverse"
									},
									rootBox: {
										width: "100%",
									},
									button: {
										width: "100%",
										justifyContent: "flex-start",
									}
								}
							}} />
						</SignedIn>
						<SignedOut>
							<SignInButton />
						</SignedOut>
					</Sidebar>

					<Outlet />
				</ClerkProvider>
			</main>
		)
	}

	return (
		<main className="shell-container">
			<Sidebar />
			<Outlet />
		</main>
	)
}
