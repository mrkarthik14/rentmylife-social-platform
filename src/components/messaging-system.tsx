"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  MessageSquare,
  MessageSquarePlus,
  MessageSquareText,
  MessageSquareReply,
  MessageSquareMore,
  MessageSquareDot,
  MessagesSquare,
  Speech,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type ID = string

type User = {
  id: ID
  name: string
  avatarUrl?: string
}

type Attachment = {
  id: ID
  name: string
  type: "image" | "file" | "video" | "audio" | "other"
  url: string
  size?: number
}

type MessageStatus = "sending" | "sent" | "delivered" | "read"

export type Message = {
  id: ID
  senderId: ID
  content?: string
  createdAt: string | Date
  status: MessageStatus
  attachments?: Attachment[]
  thread?: Message[]
  replyToId?: ID
}

export type Conversation = {
  id: ID
  name?: string
  isGroup: boolean
  participants: User[]
  lastMessage?: Message
  unread: number
  typingUserIds?: ID[]
  photoUrl?: string
}

type SOSPayload = {
  conversationId?: ID
  fromUserId: ID
  recipients: { phone?: string; userId?: ID }[]
  message: string
  mode: "sms" | "call" | "both"
}

export type MessagingSystemProps = {
  className?: string
  style?: React.CSSProperties
  conversations: Conversation[]
  activeConversationId?: ID
  currentUserId: ID
  onSelectConversation?: (id: ID) => void
  onSendMessage?: (conversationId: ID, data: { text?: string; files?: File[]; replyToId?: ID }) => Promise<void> | void
  onSearch?: (query: string) => void
  onLoadMoreMessages?: (conversationId: ID) => Promise<void> | void
  onSendSOS?: (payload: SOSPayload) => Promise<void> | void
  onMarkRead?: (conversationId: ID) => Promise<void> | void
  isLoading?: boolean
}

type Draft = {
  text: string
  files: File[]
  replyingToId?: ID
}

const formatTime = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const getInitials = (name?: string) => {
  if (!name) return "U"
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[1]![0]).toUpperCase()
}

const statusLabel: Record<MessageStatus, string> = {
  sending: "Sending…",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
}

const statusDotColor: Record<MessageStatus, string> = {
  sending: "bg-muted-foreground",
  sent: "bg-muted-foreground",
  delivered: "bg-chart-3",
  read: "bg-chart-2",
}

export default function MessagingSystem({
  className,
  style,
  conversations,
  activeConversationId: activeIdProp,
  currentUserId,
  onSelectConversation,
  onSendMessage,
  onSearch,
  onLoadMoreMessages,
  onSendSOS,
  onMarkRead,
  isLoading,
}: MessagingSystemProps) {
  const [activeId, setActiveId] = useState<ID | undefined>(activeIdProp ?? conversations[0]?.id)
  const [query, setQuery] = useState("")
  const [drafts, setDrafts] = useState<Record<ID, Draft>>({})
  const [showListOnMobile, setShowListOnMobile] = useState(true)
  const [threadForMessage, setThreadForMessage] = useState<{ conversationId: ID; messageId: ID } | null>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeIdProp && activeIdProp !== activeId) {
      setActiveId(activeIdProp)
    }
  }, [activeIdProp])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  )

  useEffect(() => {
    // Mark as read on open
    if (activeConversation && activeConversation.unread > 0) {
      onMarkRead?.(activeConversation.id)
    }
  }, [activeConversation?.id])

  useEffect(() => {
    // autoscroll to bottom on open/new
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [activeConversation?.id, activeConversation?.lastMessage?.id])

  // SOS handling
  const handleSOS = async (mode: "sms" | "call" | "both") => {
    if (!onSendSOS) {
      toast("SOS not configured", {
        description: "Connect Twilio handlers to enable emergency alerts.",
      })
      return
    }
    const participants =
      activeConversation?.participants.filter((p) => p.id !== currentUserId) ?? []
    const payload: SOSPayload = {
      conversationId: activeConversation?.id,
      fromUserId: currentUserId,
      recipients: participants.map((p) => ({ userId: p.id })),
      message: "Emergency SOS from Rent My Life conversation",
      mode,
    }
    try {
      await Promise.resolve(onSendSOS(payload))
      toast.success("SOS sent", { description: `Dispatched via ${mode}` })
    } catch (e) {
      toast.error("Failed to send SOS")
    }
  }

  const setDraft = (cid: ID, patch: Partial<Draft>) => {
    setDrafts((prev) => {
      const d = prev[cid] ?? { text: "", files: [] }
      return { ...prev, [cid]: { ...d, ...patch } }
    })
  }

  const currentDraft: Draft = useMemo(() => {
    if (!activeConversation) return { text: "", files: [] }
    return drafts[activeConversation.id] ?? { text: "", files: [] }
  }, [activeConversation?.id, drafts])

  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => {
      const name = c.name || c.participants.map((p) => p.name).join(", ")
      return name.toLowerCase().includes(q)
    })
  }, [conversations, query])

  const handleSelectConversation = (id: ID) => {
    setActiveId(id)
    onSelectConversation?.(id)
    setShowListOnMobile(false)
  }

  const handleSend = async () => {
    if (!activeConversation) return
    const text = currentDraft.text.trim()
    const files = currentDraft.files
    if (!text && files.length === 0) return
    try {
      await Promise.resolve(onSendMessage?.(activeConversation.id, { text, files, replyToId: currentDraft.replyingToId }))
      setDraft(activeConversation.id, { text: "", files: [], replyingToId: undefined })
      messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    } catch {
      toast.error("Message failed to send")
    }
  }

  const onFilesPicked = (files: FileList | null) => {
    if (!files || !activeConversation) return
    const list = Array.from(files)
    setDraft(activeConversation.id, { files: [...(currentDraft.files ?? []), ...list] })
  }

  const removeFile = (file: File) => {
    if (!activeConversation) return
    setDraft(
      activeConversation.id,
      { files: (currentDraft.files ?? []).filter((f) => f !== file) }
    )
  }

  // Demo-safe messages rendering. Consumers should pass messages via activeConversation.lastMessage or an accessor.
  // For this component, we expect parent to provide message list via conversation-level context.
  // To display something meaningful if none provided, we derive a tiny synthetic list.
  const syntheticMessages: Message[] = useMemo(() => {
    const other = activeConversation?.participants.find((p) => p.id !== currentUserId)
    if (!activeConversation) return []
    return [
      {
        id: "m1",
        senderId: other?.id ?? "other",
        content: "Hi there! How can I help with your rental?",
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        status: "read",
      },
      {
        id: "m2",
        senderId: currentUserId,
        content: "Hello! Could we extend the booking by 2 days?",
        createdAt: new Date(Date.now() - 1000 * 60 * 25),
        status: "delivered",
        thread: [
          {
            id: "t1",
            senderId: other?.id ?? "other",
            content: "Sure, I can do that.",
            createdAt: new Date(Date.now() - 1000 * 60 * 20),
            status: "read",
          },
        ],
      },
    ]
  }, [activeConversation?.id])

  const messages: Message[] = syntheticMessages // In production, replace with real messages array from parent.

  const isMobileView = useMediaQuery("(max-width: 768px)")

  return (
    <TooltipProvider delayDuration={200}>
      <section
        className={cn(
          "w-full max-w-full bg-card border border-border rounded-2xl overflow-hidden",
          "flex flex-col",
          className
        )}
        style={style}
        aria-label="Messaging system"
      >
        <header className="flex items-center gap-2 p-4 sm:p-5 border-b border-border bg-card">
          {isMobileView && !showListOnMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="mr-1"
              onClick={() => setShowListOnMobile(true)}
              aria-label="Back to conversations"
            >
              <MessagesSquare className="size-4" />
            </Button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="size-5 text-foreground/80" aria-hidden />
            <h3 className="text-base sm:text-lg font-semibold truncate">Messages</h3>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Speech className="size-4" aria-hidden />
                  SOS
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => handleSOS("sms")}>Send SOS SMS</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSOS("call")}>Place SOS Call</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSOS("both")}>SMS + Call</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={() => toast("New chat", { description: "Start a new conversation flow." })}
                >
                  <MessageSquarePlus className="size-4" aria-hidden />
                  New
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start a new conversation</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="flex min-h-[520px] h-[min(72vh,800px)]">
          {/* Conversation list */}
          <aside
            className={cn(
              "w-full sm:max-w-[320px] border-r border-border bg-card flex-shrink-0 min-w-0",
              isMobileView ? (showListOnMobile ? "block" : "hidden") : "block"
            )}
            aria-label="Conversation list"
          >
            <div className="p-4 sm:p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="relative w-full">
                  <Input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      onSearch?.(e.target.value)
                    }}
                    placeholder="Search conversations"
                    className="pl-3 pr-10 bg-secondary"
                    aria-label="Search conversations"
                  />
                  <MessageSquareText className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
                </div>
              </div>
              <div className="mt-3">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="all">Direct</TabsTrigger>
                    <TabsTrigger value="groups">Groups</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" />
                  <TabsContent value="groups" />
                </Tabs>
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-136px)]">
              <ul className="p-2">
                {filteredConversations.length === 0 && (
                  <li className="p-6 text-sm text-muted-foreground">No conversations found.</li>
                )}
                {filteredConversations.map((c) => {
                  const otherNames =
                    c.name ??
                    c.participants.filter((p) => p.id !== currentUserId).map((p) => p.name).join(", ")
                  const isActive = c.id === activeConversation?.id
                  const last = c.lastMessage?.content ?? "Start the conversation"
                  const avatar = c.photoUrl || c.participants.find((p) => p.id !== currentUserId)?.avatarUrl
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectConversation(c.id)}
                        className={cn(
                          "w-full text-left px-3 py-3 rounded-xl hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive ? "bg-accent" : "bg-transparent"
                        )}
                        aria-current={isActive}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-10">
                            <AvatarImage
                              src={avatar || "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop"}
                              alt={otherNames}
                            />
                            <AvatarFallback>{getInitials(otherNames)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="font-medium truncate">{otherNames}</p>
                              {c.isGroup && (
                                <Badge variant="secondary" className="h-5 rounded-full text-xs">Group</Badge>
                              )}
                              {c.unread > 0 && (
                                <span className="ml-auto inline-flex items-center justify-center bg-chart-3/15 text-chart-3 text-[11px] px-2 py-0.5 rounded-full">
                                  {c.unread}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate break-words">{last}</p>
                          </div>
                        </div>
                        {c.typingUserIds && c.typingUserIds.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="relative flex size-2">
                              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-chart-3/40"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-3"></span>
                            </span>
                            Typing…
                          </div>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          </aside>

          {/* Chat window */}
          <main
            className={cn(
              "flex-1 min-w-0 bg-card flex flex-col",
              isMobileView ? (showListOnMobile ? "hidden" : "flex") : "flex"
            )}
            role="region"
            aria-label="Chat window"
          >
            {activeConversation ? (
              <>
                <div className="p-4 sm:p-5 border-b border-border flex items-center gap-3">
                  {isMobileView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowListOnMobile(true)}
                      aria-label="Back to conversations"
                    >
                      <MessagesSquare className="size-4" />
                    </Button>
                  )}
                  <Avatar className="size-10">
                    <AvatarImage
                      src={
                        activeConversation.photoUrl ||
                        activeConversation.participants.find((p) => p.id !== currentUserId)?.avatarUrl ||
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
                      }
                      alt={activeConversation.name ?? "Conversation"}
                    />
                    <AvatarFallback>
                      {getInitials(
                        activeConversation.name ||
                          activeConversation.participants.find((p) => p.id !== currentUserId)?.name
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {activeConversation.name ||
                        activeConversation.participants.filter((p) => p.id !== currentUserId).map((p) => p.name).join(", ")}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activeConversation.typingUserIds && activeConversation.typingUserIds.length > 0 ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <span className="inline-block size-1.5 rounded-full bg-chart-3 animate-bounce [animation-delay:-120ms]" />
                            <span className="inline-block size-1.5 rounded-full bg-chart-3 animate-bounce [animation-delay:-60ms]" />
                            <span className="inline-block size-1.5 rounded-full bg-chart-3 animate-bounce" />
                          </span>
                          Typing…
                        </span>
                      ) : (
                        <span className="truncate">
                          {activeConversation.participants.length} participants
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Conversation actions">
                          <MessageSquareMore className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast("Muted")}>Mute</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast("Archived")}>Archive</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast("Marked as unread")}>Mark as Unread</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex-1 min-h-0 min-w-0 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,320px)]">
                  {/* Messages area */}
                  <div className="min-w-0 min-h-0 flex flex-col">
                    <ScrollArea className="flex-1">
                      <div className="p-4 sm:p-6 space-y-4">
                        <LoadMore onClick={() => onLoadMoreMessages?.(activeConversation.id)} />
                        {messages.map((m) => {
                          const isMe = m.senderId === currentUserId
                          const sender =
                            activeConversation.participants.find((p) => p.id === m.senderId) ||
                            { id: m.senderId, name: "You" }
                          return (
                            <article key={m.id} className={cn("flex w-full gap-3", isMe ? "justify-end" : "justify-start")}>
                              {!isMe && (
                                <Avatar className="size-8 mt-0.5">
                                  <AvatarImage
                                    src={
                                      sender.avatarUrl ||
                                      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop"
                                    }
                                    alt={sender.name}
                                  />
                                  <AvatarFallback>{getInitials(sender.name)}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className={cn("max-w-[78%] sm:max-w-[70%] md:max-w-[60%] min-w-0")}>
                                <div
                                  className={cn(
                                    "rounded-2xl px-3 py-2 break-words w-fit",
                                    isMe ? "bg-primary text-primary-foreground ml-auto" : "bg-secondary"
                                  )}
                                >
                                  {m.content && (
                                    <p className={cn("text-sm", "whitespace-pre-wrap")}>{m.content}</p>
                                  )}
                                  {m.attachments && m.attachments.length > 0 && (
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                      {m.attachments.map((a) => (
                                        <AttachmentPreview key={a.id} attachment={a} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className={cn("flex items-center gap-2 mt-1 text-[11px] text-muted-foreground", isMe ? "justify-end" : "justify-start")}>
                                  <time aria-label={new Date(m.createdAt).toLocaleString()}>{formatTime(m.createdAt)}</time>
                                  <span className={cn("inline-flex items-center gap-1", isMe ? "order-first sm:order-none" : "")}>
                                    <span className={cn("inline-block size-1.5 rounded-full", statusDotColor[m.status])} />
                                    {statusLabel[m.status]}
                                  </span>
                                  {m.thread && m.thread.length > 0 && (
                                    <>
                                      <span className="text-muted-foreground/40">•</span>
                                      <button
                                        className="inline-flex items-center gap-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                                        onClick={() => setThreadForMessage({ conversationId: activeConversation.id, messageId: m.id })}
                                        aria-haspopup="dialog"
                                        aria-expanded={threadForMessage?.messageId === m.id}
                                      >
                                        <MessageSquareReply className="size-3.5" />
                                        {m.thread.length} replies
                                      </button>
                                    </>
                                  )}
                                  <span className="hidden sm:inline text-muted-foreground/40">•</span>
                                  <button
                                    className="inline-flex items-center gap-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                                    onClick={() => setDraft(activeConversation.id, { replyingToId: m.id })}
                                  >
                                    Reply
                                  </button>
                                </div>
                                {currentDraft.replyingToId === m.id && (
                                  <div className="mt-1">
                                    <ReplyingTo onCancel={() => setDraft(activeConversation.id, { replyingToId: undefined })} />
                                  </div>
                                )}
                              </div>
                              {isMe && (
                                <Avatar className="size-8 mt-0.5">
                                  <AvatarImage
                                    src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=200&auto=format&fit=crop"
                                    alt="You"
                                  />
                                  <AvatarFallback>{getInitials("You")}</AvatarFallback>
                                </Avatar>
                              )}
                            </article>
                          )
                        })}
                        <div ref={messageEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Composer */}
                    <div className="border-t border-border p-3 sm:p-4">
                      {currentDraft.files.length > 0 && (
                        <>
                          <div className="flex flex-wrap gap-2 p-2 mb-2 bg-secondary rounded-xl">
                            {currentDraft.files.map((f, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-card border border-border"
                              >
                                <span className="text-xs max-w-[120px] truncate">{f.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => removeFile(f)}
                                  aria-label={`Remove ${f.name}`}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Separator className="mb-2" />
                        </>
                      )}
                      <div className="flex items-end gap-2">
                        <label
                          className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-secondary hover:bg-muted cursor-pointer border border-border"
                          aria-label="Attach files"
                        >
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => onFilesPicked(e.target.files)}
                            aria-hidden
                          />
                          <MessageSquareDot className="size-5 text-foreground/80" aria-hidden />
                        </label>
                        <Textarea
                          value={currentDraft.text}
                          onChange={(e) => activeConversation && setDraft(activeConversation.id, { text: e.target.value })}
                          placeholder="Write a message…"
                          className="min-h-[44px] max-h-[160px] resize-none bg-secondary"
                          onKeyDown={(e) => {
                            if ((e.key === "Enter" && !e.shiftKey)) {
                              e.preventDefault()
                              handleSend()
                            }
                          }}
                          aria-label="Message input"
                        />
                        <Button
                          variant="default"
                          onClick={handleSend}
                          disabled={isLoading || (!currentDraft.text.trim() && currentDraft.files.length === 0)}
                          className="h-10"
                          aria-label="Send message"
                        >
                          <MessageSquareReply className="size-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Thread panel */}
                  <div
                    className={cn(
                      "border-l border-border bg-card min-h-0 hidden lg:flex flex-col",
                      threadForMessage ? "lg:flex" : "lg:hidden"
                    )}
                    aria-label="Thread panel"
                  >
                    {threadForMessage ? (
                      <>
                        <div className="p-4 border-b border-border flex items-center justify-between">
                          <p className="font-medium">Thread</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setThreadForMessage(null)}
                            aria-label="Close thread"
                          >
                            Close
                          </Button>
                        </div>
                        <ScrollArea className="flex-1">
                          <div className="p-4 space-y-3">
                            {renderThread(messages, threadForMessage.messageId, activeConversation, currentUserId)}
                          </div>
                        </ScrollArea>
                        <div className="p-3 border-t border-border">
                          <Input
                            placeholder="Reply to thread…"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                toast.success("Thread reply sent")
                              }
                            }}
                            aria-label="Reply to thread"
                            className="bg-secondary"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="hidden" />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 grid place-items-center p-8">
                <div className="text-center max-w-sm">
                  <div className="mx-auto w-12 h-12 rounded-2xl grid place-items-center bg-accent mb-3">
                    <MessageSquare className="size-6" />
                  </div>
                  <h4 className="text-lg font-semibold mb-1">Select a conversation</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose a chat from the list or start a new one to begin messaging.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </section>
    </TooltipProvider>
  )
}

function LoadMore({ onClick }: { onClick?: () => void }) {
  return (
    <div className="flex justify-center">
      <Button variant="outline" size="sm" onClick={onClick}>
        Load previous messages
      </Button>
    </div>
  )
}

function ReplyingTo({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs bg-accent px-2.5 py-1.5 rounded-full">
      Replying in thread
      <button
        onClick={onCancel}
        className="underline decoration-dotted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        Cancel
      </button>
    </div>
  )
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.type === "image") {
    return (
      <div className="relative overflow-hidden rounded-xl bg-muted">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="block w-full h-full object-cover max-w-full"
          loading="lazy"
        />
      </div>
    )
  }
  return (
    <div className="px-2 py-1.5 rounded-lg bg-card border border-border text-xs truncate">
      {attachment.name}
    </div>
  )
}

function renderThread(messages: Message[], messageId: ID, conversation: Conversation, currentUserId: ID) {
  const parent = messages.find((m) => m.id === messageId)
  if (!parent) return null
  const all: Message[] = [parent, ...(parent.thread ?? [])]
  return all.map((m) => {
    const isMe = m.senderId === currentUserId
    const sender = conversation.participants.find((p) => p.id === m.senderId)
    return (
      <div key={m.id} className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}>
        {!isMe && (
          <Avatar className="size-6 mt-0.5">
            <AvatarImage
              src={
                sender?.avatarUrl ||
                "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop"
              }
              alt={sender?.name ?? "User"}
            />
            <AvatarFallback className="text-[10px]">{getInitials(sender?.name)}</AvatarFallback>
          </Avatar>
        )}
        <div className={cn("max-w-[85%]")}>
          <div className={cn("rounded-xl px-3 py-1.5 text-xs", isMe ? "bg-primary text-primary-foreground" : "bg-secondary")}>
            {m.content}
          </div>
          <div className={cn("mt-1 text-[10px] text-muted-foreground", isMe ? "text-right" : "text-left")}>
            {formatTime(m.createdAt)} • {statusLabel[m.status]}
          </div>
        </div>
      </div>
    )
  })
}

// Small hook for responsive behavior
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean>(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const m = window.matchMedia(query)
    const onChange = () => setMatches(m.matches)
    onChange()
    m.addEventListener?.("change", onChange)
    return () => m.removeEventListener?.("change", onChange)
  }, [query])
  return matches
}