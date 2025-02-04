import Markdown from "markdown-to-jsx"
import { useState } from "react"

import "./Chat.css"
import { useParams } from "react-router"
import { ChatThreadProvider, useChatThread, useMessage } from "./contexts/ChatThreadContext"
import { type Message } from "./contexts/ChatThreadContext"

export default function Chat() {
	const { threadId } = useParams()

	return (
		<ChatThreadProvider id={threadId}>
			<div className="flex flex-col flex-1 overflow-hidden items-center">
				<section className="chat snapping overflow-y-scroll flex flex-col items-center max-w-4xl w-full flex-1">
					<div className="flex flex-col flex-1 pb-8 w-full px-6 gap-8 pt-16">
						<Messages />
					</div>
				</section>
				<Chatbox />
			</div>
		</ChatThreadProvider>
	)
}

function Messages () {
	const { messageHandles } = useChatThread()
	return messageHandles.map((message) => <Message key={message.id} id={message.id} />)
}

function Message({ id }: { id: string }) {
	const message = useMessage(id)
	if (!message) {
		return <div>Loading...</div>
	}
	return (
		<MessageContent message={message} />
	)
}

function splitMarkdown(markdown: string): string[] {
	// This regex matches:
	// 1. Code blocks (```...```)
	// 2. Inline code (`...`)
	// 3. Headers (# ...)
	// 4. Lists (- or * or 1. ...)
	// 5. Paragraphs (any text between newlines)
	const regex = /(?:```[\s\S]*?```)|(?:`[^`]*`)|(?:^#{1,6}\s.*$)|(?:^(?:[*-]|\d+\.)\s+.*$)|(?:^[^`#\s][^\n]+$)/gm

	const matches = markdown.match(regex) || []
	return matches.map(chunk => chunk.trim())
}


function MessageContent({ message }: { message: Message }) {
	const chunks = splitMarkdown(message.content)

	return (
		<div className="flex flex-col gap-3 max-w-[80%]" style={{
			alignSelf: message.role === "user" ? "flex-end" : "flex-start" }}>
			{chunks.map((chunk, index) => <MarkdownChunk key={index} markdown={chunk} />)}
		</div>
	)
}

function MarkdownChunk({ markdown }: { markdown: string }) {
	return <Markdown>{markdown}</Markdown>
}

function Chatbox() {
	const { sendMessage } = useChatThread()

	return (
		<section className="relative flex flex-col items-center max-w-4xl w-full">
			<div className="absolute -top-8 left-6 bg-gradient-to-t from-white to-transparent h-8" style={{ width: 'calc(100% - 3rem)'}} />
			<ChatboxInput onSubmit={sendMessage} />
		</section>
	)
}

function ChatboxInput({ onSubmit }: { onSubmit: (message: Message) => void }) {
	const [input, setInput] = useState("")

	const triggerSubmit = () => {
		onSubmit({ content: input, role: "user", id: Math.random().toString(36).substring(2, 15) })
		setInput("")
	}

	const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			triggerSubmit()
		}
	}

	return (
		<div className="max-w-4xl w-full min-h-32 rounded-xl shadow-2xl shadow-slate-200 mb-6 border border-gray-200 max-h-[40vh] flex flex-col gap-2">
			<textarea
				className="resize-none field-sizing-content flex-1 px-4 pt-3 bg-transparent focus:outline-none"
				placeholder="How can I help you?"
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={onKeyDown}
			/>
			<div className="flex justify-end px-2 pb-2">
				<button
					className="bg-black hover:bg-gray-700 cursor-pointer text-white px-4 rounded-full"
					onClick={triggerSubmit}
				>Send</button>
			</div>
		</div>
	)
}