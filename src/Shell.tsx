import { Outlet } from "react-router";
import Sidebar from "./Sidebar";

export function Shell() {
  return (
		<main className="shell-container">
			<Sidebar />
			<Outlet />
		</main>
	)
}
