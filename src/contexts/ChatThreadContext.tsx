import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router"

import { type _SSEvent, SSE } from "sse.js"
import { useAuth } from "./AuthContext"

export type Message = {
	content: string
	role: "user" | "assistant" | "task"
	id: string
	hidden?: boolean
}

export type MessageHandle = {
	id: string
}

export type StreamStatus = {
	isActive: boolean
	lastWorkAt: number | null
	messageId: string | null
	showCursor: boolean
}

// An external store for message content. We use this to get better control of when and how react renders the chat.
class MessageContentStore {
	private messages: Map<string, Message> = new Map()
	private listeners: Map<string, ((message: Message) => void)[]> = new Map()

	constructor(messages: Map<string, Message>) {
		this.messages = messages
	}

	get(id: string) {
		return this.messages.get(id)
	}

	subscribe(id: string, listener: (message: Message) => void) {
		if (!this.listeners.has(id)) {
			this.listeners.set(id, [])
		}
		this.listeners.get(id)!.push(listener)
	}

	unsubscribe(id: string, listener: (message: Message) => void) {
		const listeners = this.listeners.get(id)
		if (listeners) {
			this.listeners.set(id, listeners.filter(l => l !== listener))
		}
	}

	createMessage(id: string, message: Message) {
		console.log("createMessage", id, message)
		this.messages.set(id, message)
		this.listeners.get(id)?.forEach(listener => listener(message))
		this.listeners.get("onCreateMessage")?.forEach(listener => listener(message))
	}

	appendMessageContent(id: string, content: string) {
		const message = this.messages.get(id)
		if (message) {
			message.content += content
			this.messages.set(id, message)
			this.listeners.get(id)?.forEach(listener => listener(message))
		}
	}

	setMessageContent(id: string, content: string, role: "user" | "assistant" | "task" = "assistant") {
		let message = this.messages.get(id)
		if (message) {
			message.content = content
			this.messages.set(id, message)
		} else {
			message = {
				content: content,
				role: role,
				id: id
			}
			this.messages.set(id, message)
			this.listeners.get("onCreateMessage")?.forEach(listener => listener(message as Message))
		}
		this.listeners.get(id)?.forEach(listener => listener(message))
	}
}

export const ChatThreadContext = createContext<{
	messageHandles: MessageHandle[]
	messageContentStore: MessageContentStore,
	sendMessage: (message: Message) => void
	streamStatus: StreamStatus
	threadId: string | undefined
}>({
	messageHandles: [],
	messageContentStore: new MessageContentStore(new Map()),
	sendMessage: () => { },
	streamStatus: { isActive: false, lastWorkAt: null, messageId: null, showCursor: false },
	threadId: undefined
})

export function useChatThread() {
	return useContext(ChatThreadContext)
}

export function useMessage(id: string) {
	const { messageContentStore } = useChatThread()
	const [message, setMessage] = useState<Message | undefined>(() => messageContentStore.get(id))

	useEffect(() => {
		// clones the message object so react detects it as a change and rerenders the component
		const handler = (message: Message) => setMessage(Object.assign({}, message))

		// subscribe to message updates
		messageContentStore.subscribe(id, handler)

		// unsubscribe from message updates when the component unmounts
		return () => messageContentStore.unsubscribe(id, handler)
	}, [messageContentStore, id])

	return message
}

function createMessageContentStore() {
	return new MessageContentStore(new Map())
}

export function ChatThreadProvider({ id, children }: { id?: string, children: React.ReactNode }) {
	const [currentId, setCurrentId] = useState<string | undefined>(id)
	const navigate = useNavigate()

	const [messageHandles, setMessageHandles] = useState<MessageHandle[]>([])
	const [messageContentStore, setMessageContentStore] = useState<MessageContentStore>(createMessageContentStore)
	const [streamStatus, setStreamStatus] = useState<StreamStatus>({ isActive: false, lastWorkAt: null, messageId: null, showCursor: false })
	const { getToken } = useAuth()

	useEffect(() => {
		// if the id changes to undefined or another valid id, reset the state
		if (currentId && id !== currentId) {
			setCurrentId(id)
			setMessageHandles([])
			setMessageContentStore(createMessageContentStore())
		} else if (!currentId && id) {
			setCurrentId(id)
		}
	}, [id])

	useEffect(() => {
		// subscribe to the onCreateMessage event so we can keep a shallow list of message handles,
		// this way we don't rerender the entire chat when a message is updated, only when a new message is created.
		const handler = (message: Message) => {
			console.log("onCreateMessage", message)
			setMessageHandles(prev => [...prev, { id: message.id }])
		}
		messageContentStore.subscribe("onCreateMessage", handler)
		return () => {
			messageContentStore.unsubscribe("onCreateMessage", handler)
		}
	}, [messageContentStore])

	const sendMessage = async (message: Message) => {
		if (!message.hidden) {
			messageContentStore.createMessage(message.id, message)
		}
		const sse = new SSE(`${import.meta.env.VITE_API_ROOT ?? ""}/stream_run_payload`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${await getToken()}`
			},
			payload: JSON.stringify({
				"prompt": message.content,
				"thread_id": currentId
			})
		})

		let currentMessageId: string | null = null;
		let currentRole: "assistant" | "task" | null = null;

		setStreamStatus({
			isActive: true,
			lastWorkAt: null,
			messageId: null,
			showCursor: false
		})

		sse.addEventListener("thread_id", (event: _SSEvent) => {
			const data = JSON.parse(event.data)
			console.log('new thread id', data)
			navigate(`/${data}`)
		})

		sse.addEventListener("set", (event: _SSEvent) => {
			const data = JSON.parse(event.data)
			if (!event.id) {
				console.error("set event has no id", event)
				return
			}
			messageContentStore.setMessageContent(event.id, data, currentRole || "assistant")
		})

		sse.addEventListener("work", () => {
			if (!currentMessageId) {
				currentMessageId = Math.random().toString(36).substring(2, 15);
				currentRole = "assistant";
				messageContentStore.createMessage(currentMessageId, {
					content: "",
					role: "assistant",
					id: currentMessageId
				});
				setStreamStatus(prev => ({
					...prev,
					messageId: currentMessageId,
				}));
			}
			setStreamStatus(prev => ({
				...prev,
				lastWorkAt: Date.now(),
				showCursor: true
			}))
		})

		sse.addEventListener("delta", (event: _SSEvent) => {
			const data = JSON.parse(event.data)
			setStreamStatus(prev => ({
				...prev,
				showCursor: false
			}))
			if (event.id && event.id !== currentMessageId) {
				currentMessageId = event.id;
				currentRole = "assistant";
				messageContentStore.setMessageContent(event.id, data, "assistant")
				// Update stream status to point to the new message ID if it changed
				setStreamStatus(prev => ({ ...prev, messageId: event.id }))
			} else {
				if (currentRole !== "assistant") {
					currentMessageId = event.id || Math.random().toString(36).substring(2, 15);
					currentRole = "assistant";
					messageContentStore.createMessage(currentMessageId, {
						content: data,
						role: "assistant",
						id: currentMessageId
					});
					setStreamStatus(prev => ({ ...prev, messageId: currentMessageId }))
				} else {
					if (currentMessageId) {
						messageContentStore.appendMessageContent(currentMessageId, data)
					}
				}
			}
		})

		sse.addEventListener("task", (event: _SSEvent) => {
			const data = JSON.parse(event.data);
			setStreamStatus(prev => ({
				...prev,
				showCursor: false
			}))
			
			if (currentRole === "task" && currentMessageId) {
				messageContentStore.appendMessageContent(currentMessageId, data + "\n")
			} else {
				currentMessageId = event.id || Math.random().toString(36).substring(2, 15);
				currentRole = "task";
				messageContentStore.createMessage(currentMessageId, {
					content: data + "\n",
					role: "task",
					id: currentMessageId
				});
				setStreamStatus(prev => ({ ...prev, messageId: currentMessageId }))
			}
		})

		sse.addEventListener("readystatechange", () => {
			if (sse.readyState >= 2) { // CLOSED
				setStreamStatus({ isActive: false, lastWorkAt: null, messageId: null, showCursor: false })
			}
		})

		sse.stream()
	}

	return (
		<ChatThreadContext.Provider value={{ messageHandles, messageContentStore, sendMessage, streamStatus, threadId: currentId }}>
			{children}
		</ChatThreadContext.Provider>
	)
}