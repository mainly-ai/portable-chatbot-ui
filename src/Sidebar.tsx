import { MessageCirclePlus } from "lucide-react"
import { Link } from "react-router"

export default function Sidebar() {
	return (
		<aside className="bg-slate-50 m-2 p-2 rounded-xl flex flex-col gap-2">
			<NewChatButton />
		</aside>
	)
}

function NewChatButton() {
	return (
		<Link to="/" className="border-2 border-dashed border-slate-300 hover:bg-slate-100 rounded-md px-3 py-2 flex items-center gap-2 cursor-pointer">
			<MessageCirclePlus size={20} className="text-slate-700" />
			New Chat
		</Link>
	)
}