import { MessageCirclePlus, Moon, Sun, Monitor } from "lucide-react"
import { Link } from "react-router"
import { useTheme } from "./contexts/ThemeContext"

export default function Sidebar({ children }: React.PropsWithChildren) {
	return (
		<aside className="bg-slate-50 dark:bg-slate-900 m-2 p-2 rounded-xl flex flex-col justify-between gap-2 transition-colors duration-200">
			<div className="flex flex-col gap-2">
				<NewChatButton />
				<ThemeToggle />
			</div>
			<div className="flex flex-col gap-2">
				{children}
			</div>
		</aside>
	)
}

function NewChatButton() {
	return (
		<Link to="/" className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors duration-200">
			<MessageCirclePlus size={20} className="text-slate-700 dark:text-slate-200" />
			<span className="text-slate-700 dark:text-slate-200">New Chat</span>
		</Link>
	)
}

function ThemeToggle() {
	const { theme, setTheme } = useTheme()

	return (
		<div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-md">
			<button
				onClick={() => setTheme("light")}
				className={`p-1.5 rounded-sm transition-colors ${theme === 'light' ? 'bg-white shadow-sm' : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
				title="Light mode"
			>
				<Sun size={16} />
			</button>
			<button
				onClick={() => setTheme("system")}
				className={`p-1.5 rounded-sm transition-colors ${theme === 'system' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100' : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
				title="System theme"
			>
				<Monitor size={16} />
			</button>
			<button
				onClick={() => setTheme("dark")}
				className={`p-1.5 rounded-sm transition-colors ${theme === 'dark' ? 'bg-slate-600 shadow-sm text-white' : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
				title="Dark mode"
			>
				<Moon size={16} />
			</button>
		</div>
	)
}