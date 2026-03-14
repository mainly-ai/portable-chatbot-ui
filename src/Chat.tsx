import Markdown from "./markdown"
import { SidebarImage } from "./SidebarImage"
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
	const { backgroundImage, sidebarImages, setSidebarImage, setBackgroundImage } = useLayoutContext()
	const { messageHandles, streamStatus, threadId, sendMessage } = useChatThread()
	const { getToken } = useAuth()

	const sseRef = useRef<SSE | null>(null)

	// Fetch sidebar image logic
	const fetchSidebarImage = async () => {
		// Close existing connection if any
		if (sseRef.current) {
			sseRef.current.close()
			sseRef.current = null
		}

		try {
			const token = await getToken()
			const url = `${import.meta.env.VITE_API_ROOT ?? ""}/image_update${threadId ? `?thread_id=${threadId}` : ""}`

			console.log("Checking for sidebar/background image updates...", url)
			const sse = new SSE(url, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			sseRef.current = sse

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
				// Close after receiving data (single poll)
				sse.close()
				sseRef.current = null
			})

			sse.addEventListener('error', (e: any) => {
				console.warn("Sidebar image SSE error", e)
				sse.close()
				sseRef.current = null
			})

			sse.stream()
		} catch (e) {
			console.error("Failed to setup sidebar image SSE", e)
		}
	}

	// Poll every 5 minutes
	useEffect(() => {
		fetchSidebarImage() // Initial check
		const interval = setInterval(fetchSidebarImage, 5 * 60 * 1000) // 5 minutes
		return () => {
			clearInterval(interval)
			if (sseRef.current) {
				sseRef.current.close()
			}
		}
	}, [threadId])

	// Thread Status Polling
	useEffect(() => {
		let intervalId: ReturnType<typeof setInterval>
		let isMounted = true

		const checkThreadStatusEndpoint = async () => {
			try {
				const token = await getToken()
				if (!threadId) return
				
				const url = `${import.meta.env.VITE_API_ROOT ?? ""}/thread_status?thread_id=${threadId}`
				
				// Initial check to see if the endpoint exists
				const res = await fetch(url, {
					method: 'GET',
					headers: { 'Authorization': `Bearer ${token}` }
				})
				
				if (res.ok && isMounted) {
					// Endpoint exists, set up periodic timer
					intervalId = setInterval(async () => {
						try {
							const pollRes = await fetch(url, {
								method: 'GET',
								headers: { 'Authorization': `Bearer ${token}` }
							})
							if (pollRes.ok) {
								const data = await pollRes.json()
								if (data.match > 0 || data.matches > 0) {
									sendMessage({
										role: "user",
										content: "Please give me a status of all ongoing jobs.",
										id: crypto.randomUUID(),
										hidden: true
									})
								}
							}
						} catch (e) {
							console.error("Error polling thread_status", e)
						}
					}, 10000) // Polling every 10 seconds
				}
			} catch (e) {
				console.error("Failed to check thread_status endpoint", e)
			}
		}

		checkThreadStatusEndpoint()

		return () => {
			isMounted = false
			clearInterval(intervalId)
		}
	}, [threadId, getToken, sendMessage])

	// Trigger on new messages or stream start
	useEffect(() => {
		if (messageHandles.length > 0) {
			fetchSidebarImage()
		}
	}, [messageHandles.length, streamStatus.isActive])

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
			{/* Sidebar Left */}
			{sidebarImages.left.src && (
				<SidebarImage src={sidebarImages.left.src} width={sidebarImages.left.width} align="left" />
			)}

			{/* Sidebar Right */}
			{sidebarImages.right.src && (
				<SidebarImage src={sidebarImages.right.src} width={sidebarImages.right.width} align="right" />
			)}

			{/* Blur Overlay - Tones down background and sidebars for readability */}
			{(backgroundImage || sidebarImages.left.src || sidebarImages.right.src) && (
				<div className="absolute inset-0 z-10 pointer-events-none backdrop-blur-[2px] bg-white/30 dark:bg-black/30" />
			)}

			{/* Main Content */}
			<div className="flex flex-col flex-1 overflow-hidden items-center z-10 w-full relative pointer-events-none">
				<section className="chat snapping overflow-y-scroll flex flex-col items-center max-w-4xl w-full flex-1 pointer-events-auto">
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




function MessageContent({ message }: { message: Message }) {
	if (message.role === "task") {
		return <TaskMessageContent message={message} />
	}
	return (
		<div className="flex flex-col gap-3 max-w-[80%]" style={{
			alignSelf: message.role === "user" ? "flex-end" : "flex-start"
		}}>
			<MarkdownChunk markdown={message.content} />
			<Cursor messageId={message.id} />
		</div>
	)
}

function TaskMessageContent({ message }: { message: Message }) {
	const [isOpen, setIsOpen] = useState(false);
	const { sendMessage } = useChatThread();

	const handleStatusRequest = (e: React.MouseEvent) => {
		e.stopPropagation();
		sendMessage({
			role: "user",
			content: "Please give me a status of all ongoing jobs.",
			id: crypto.randomUUID(),
			hidden: true
		});
	};

	return (
		<div className="flex flex-col gap-3 max-w-[80%] bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 w-full border border-slate-200 dark:border-slate-700/50 transition-all duration-200" style={{ alignSelf: "flex-start" }}>
			<div 
				className="flex items-center justify-between cursor-pointer w-full select-none"
				onClick={() => setIsOpen(!isOpen)}
			>
				<div className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-wider">
					<span className="mr-2 inline-block w-3">{isOpen ? '▼' : '▶'}</span>
					background task update
					{!isOpen && <span className="ml-2"><Cursor messageId={message.id} /></span>}
				</div>
				<button 
					onClick={handleStatusRequest}
					className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-transparent border-none p-1 rounded-full cursor-pointer flex items-center justify-center"
					title="Request status update"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-5.67"/>
					</svg>
				</button>
			</div>
			{isOpen && (
				<div className="mt-1">
					<MarkdownChunk markdown={message.content} />
					<Cursor messageId={message.id} />
				</div>
			)}
		</div>
	)
}

function MarkdownChunk({ markdown }: { markdown: string }) {
	return <Markdown>{markdown}</Markdown>
}

function Chatbox() {
	const { sendMessage } = useChatThread()
	const [input, setInput] = useState("")

	const triggerSubmit = () => {
		if (!input.trim()) return
		sendMessage({
			role: "user",
			content: input,
			id: crypto.randomUUID()
		})
		setInput("")
	}

	const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {

		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			triggerSubmit()
		}
	}

	return (
		<div className="pointer-events-auto max-w-4xl w-full min-h-32 rounded-xl shadow-2xl shadow-slate-200 dark:shadow-none mb-6 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[40vh] flex flex-col gap-2 transition-colors duration-200">
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