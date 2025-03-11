import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";

export function Shell() {
  return (
		<main className="shell-container">
			<SignedIn>
				<Sidebar />
				<Outlet />
			</SignedIn>
			<SignedOut>
				<div className="flex items-center justify-center col-span-2">
					<SignIn />
				</div>
			</SignedOut>
		</main>
	)
}
