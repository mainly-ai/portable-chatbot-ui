import Markdown from "./markdown"
import { useState, useEffect, useRef } from "react"

import "./Chat.css"
import { useParams } from "react-router"
import { ChatThreadProvider, useChatThread, useMessage } from "./contexts/ChatThreadContext"
import { type Message } from "./contexts/ChatThreadContext"

import { useLayoutContext } from "./contexts/LayoutContext"
import { type _SSEvent, SSE } from "sse.js"
import { useAuth } from "./contexts/AuthContext"

export default function Chat() {
	const { threadId } = useParams()

	return (
		<ChatThreadProvider id={threadId}>
			<ChatLayout />
		</ChatThreadProvider>
	)
}

function ChatLayout() {
	const { backgroundImage, sidebarImages } = useLayoutContext()

	const isVideo = (url: string) => {
		return url.match(/\.(mp4|webm|ogg)$/i)
	}

	return (
		<div className="flex flex-col flex-1 overflow-hidden items-center relative w-full h-full">
			{/* Background Layer */}
			{backgroundImage && (
				<div className="absolute inset-0 z-0 pointer-events-none">
					{isVideo(backgroundImage) ? (
						<video
							src={backgroundImage}
							autoPlay
							loop
							muted
							className="w-full h-full object-cover"
						/>
					) : (
						<img
							src={backgroundImage}
							alt="chat background"
							className="w-full h-full object-cover"
						/>
					)}
					{/* Overlay to ensure text readability if needed, though user didn't ask for it, it's safer. 
                        But user might want full control. I'll leave it raw as requested "render a background image". */}
				</div>
			)}

			{/* Sidebar Left */}
			{sidebarImages.left.src && (
				<div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 touch-none pointer-events-none">
					<img
						src={sidebarImages.left.src}
						className="max-w-[300px] max-h-[80vh] object-contain rounded-xl shadow-lg"
						alt="sidebar left"
						style={sidebarImages.left.width ? { maxWidth: sidebarImages.left.width } : {}}
					/>
				</div>
			)}

			{/* Sidebar Right */}
			{sidebarImages.right.src && (
				<div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 touch-none pointer-events-none">
					<img
						src={sidebarImages.right.src}
						className="max-w-[300px] max-h-[80vh] object-contain rounded-xl shadow-lg"
						alt="sidebar right"
						style={sidebarImages.right.width ? { maxWidth: sidebarImages.right.width } : {}}
					/>
				</div>
			)}

			{/* Blur Overlay - Tones down background and sidebars for readability */}
			{(backgroundImage || sidebarImages.left.src || sidebarImages.right.src) && (
				<div className="absolute inset-0 z-10 pointer-events-none backdrop-blur-[2px] bg-white/30 dark:bg-black/30" />
			)}

			{/* Main Content */}
			<div className="flex flex-col flex-1 overflow-hidden items-center z-10 w-full relative">
				<section className="chat snapping overflow-y-scroll flex flex-col items-center max-w-4xl w-full flex-1">
					<div className="flex flex-col flex-1 pb-8 w-full px-6 gap-8 pt-16">
						<Messages />
					</div>
				</section>
				<Chatbox />
			</div>
		</div>
	)
}

function Messages() {
	const { messageHandles } = useChatThread()


	// {testMessages.map((message) => <MessageContent key={message.id} message={message} />)}

	return (
		<>
			{messageHandles.map((message) => <Message key={message.id} id={message.id} />)}
		</>
	);
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

function Cursor({ messageId }: { messageId: string }) {
	const { streamStatus } = useChatThread()
	const [status, setStatus] = useState<"working" | "broken" | "hidden">("hidden")

	useEffect(() => {
		if (!streamStatus.isActive || streamStatus.messageId !== messageId || !streamStatus.showCursor) {
			setStatus("hidden")
			return
		}

		setStatus("working")

		const interval = setInterval(() => {
			if (streamStatus.lastWorkAt && Date.now() - streamStatus.lastWorkAt > 15000) {
				setStatus("broken")
			} else {
				setStatus("working")
			}
		}, 100)

		return () => clearInterval(interval)
	}, [streamStatus, messageId])

	if (status === "hidden") return null

	return (
		<span className={`cursor-animation ${status === "broken" ? "broken" : ""}`}>
			{status === "broken" ? "⚠️" : "●"}
		</span>
	)
}

function splitMarkdown(markdown: string): string[] {
	// This regex matches:
	// 1. Code blocks (```...```)
	// 2. Inline code (`...`)
	// 3. Headers (# ..., possibly indented)
	// 4. Lists (- or * or 1. ..., possibly indented)
	// 5. Paragraphs (any text between newlines, possibly indented, not matching other patterns)
	const regex = /(?:```[\s\S]*?```)|(?:`[^`]*`)|(?:^\s*#{1,6}\s.*$)|(?:^\s*(?:[*-]|\d+\.)\s+.*$)|(?:^\s*[^`#\s][^\n]+$)/gm

	const matches = markdown.match(regex) || []
	return matches.map(chunk => chunk.trim())
}


function MessageContent({ message }: { message: Message }) {
	const chunks = splitMarkdown(message.content)

	return (
		<div className="flex flex-col gap-3 max-w-[80%]" style={{
			alignSelf: message.role === "user" ? "flex-end" : "flex-start"
		}}>
			{chunks.map((chunk, index) => <MarkdownChunk key={index} markdown={chunk} />)}
			<Cursor messageId={message.id} />
		</div>
	)
}

function MarkdownChunk({ markdown }: { markdown: string }) {
	return <Markdown>{markdown}</Markdown>
}

function Chatbox() {
	const { sendMessage, threadId } = useChatThread()
	const { setSidebarImage, setBackgroundImage } = useLayoutContext()
	const { getToken } = useAuth()
	const sidebarFetchEnabled = useRef(true)
	const isLoopActive = useRef(false)
	const threadIdRef = useRef(threadId)

	useEffect(() => {
		threadIdRef.current = threadId
	}, [threadId])

	useEffect(() => {
		return () => {
			sidebarFetchEnabled.current = false
		}
	}, [])

	const fetchSidebarImage = async () => {
		if (!sidebarFetchEnabled.current) {
			isLoopActive.current = false
			return
		}

		console.log("Scheduling sidebar fetch in 10s...")
		setTimeout(async () => {
			if (!sidebarFetchEnabled.current) {
				isLoopActive.current = false
				return
			}

			try {
				const token = await getToken()
				const currentThreadId = threadIdRef.current
				const url = `${import.meta.env.VITE_API_ROOT ?? ""}/image_update${currentThreadId ? `?thread_id=${currentThreadId}` : ""}`

				console.log("Fetching sidebar image from", url)
				const sse = new SSE(url, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				})

				sse.addEventListener('sidebar-img', (event: _SSEvent) => {
					try {
						const decodedData = JSON.parse(event.data)

						// Parse Left Sidebar
						const leftMatch = decodedData.match(/<sidebar-img\s+([^>]*)\/>/i)
						if (leftMatch) {
							const attributes = leftMatch[1]
							const srcMatch = attributes.match(/src=["'](.*?)["']/i)
							const widthMatch = attributes.match(/width=["'](.*?)["']/i)
							if (srcMatch) {
								setSidebarImage('left', srcMatch[1], widthMatch ? widthMatch[1] : undefined)
							}
						}

						// Parse Right Sidebar
						const rightMatch = decodedData.match(/<sidebar-img-right\s+([^>]*)\/>/i)
						if (rightMatch) {
							const attributes = rightMatch[1]
							const srcMatch = attributes.match(/src=["'](.*?)["']/i)
							const widthMatch = attributes.match(/width=["'](.*?)["']/i)
							if (srcMatch) {
								setSidebarImage('right', srcMatch[1], widthMatch ? widthMatch[1] : undefined)
							}
						}

						// Parse Background Image
						const bgMatch = decodedData.match(/<background-img\s+([^>]*)\/>/i)
						if (bgMatch) {
							const attributes = bgMatch[1]
							const srcMatch = attributes.match(/src=["'](.*?)["']/i)
							if (srcMatch) {
								setBackgroundImage(srcMatch[1])
							}
						}

					} catch (e) {
						console.error("Failed to parse sidebar/background SSE data", e)
					}
					sse.close()
					// Recurse on success
					fetchSidebarImage()
				})

				sse.addEventListener('error', (e: any) => {
					console.warn("Sidebar image SSE error, disabling feature.", e)
					sidebarFetchEnabled.current = false
					isLoopActive.current = false
					sse.close()
				})

				sse.stream()
			} catch (e) {
				console.error("Failed to setup sidebar image SSE, disabling feature.", e)
				sidebarFetchEnabled.current = false
				isLoopActive.current = false
			}
		}, 10000)
	}

	const handleSendMessage = (message: Message) => {
		sendMessage(message)

		if (sidebarFetchEnabled.current && !isLoopActive.current) {
			isLoopActive.current = true
			// Start the first fetch (will wait 10s)
			fetchSidebarImage()
		}
	}

	return (
		<section className="relative flex flex-col items-center max-w-4xl w-full">
			<div className="absolute -top-8 left-6 bg-gradient-to-t from-white dark:from-slate-950 to-transparent h-8 transition-colors duration-200" style={{ width: 'calc(100% - 3rem)' }} />
			<ChatboxInput onSubmit={handleSendMessage} />
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
		<div className="max-w-4xl w-full min-h-32 rounded-xl shadow-2xl shadow-slate-200 dark:shadow-none mb-6 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[40vh] flex flex-col gap-2 transition-colors duration-200">
			<textarea
				className="resize-none field-sizing-content flex-1 px-4 pt-3 bg-transparent focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
				placeholder="How can I help you?"
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={onKeyDown}
			/>
			<div className="flex justify-end px-2 pb-2">
				<button
					className="bg-black dark:bg-slate-100 hover:bg-gray-700 dark:hover:bg-slate-300 cursor-pointer text-white dark:text-slate-900 px-4 rounded-full transition-colors duration-200"
					onClick={triggerSubmit}
				>Send</button>
			</div>
		</div>
	)
}