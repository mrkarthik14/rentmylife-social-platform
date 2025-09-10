"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import {
  Instagram,
  MessageSquareText,
  MessageSquareReply,
  MessageCircleHeart,
  Rss,
  Reply,
  Twitter,
  MessageSquareHeart,
  MessageSquareShare,
  MessageCirclePlus,
  Speech,
  ThumbsDown,
  Facebook,
  Podcast,
  ScrollText,
  Clapperboard,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

type Media = {
  id: string
  type: "image" | "video"
  url: string
  alt?: string
}

type PollOption = {
  id: string
  label: string
  votes: number
}

type Poll = {
  id: string
  options: PollOption[]
  endsAt?: string
  votedOptionId?: string
}

type Comment = {
  id: string
  author: User
  content: string
  createdAt: string
  score: number
  children?: Comment[]
}

type User = {
  id: string
  name: string
  handle: string
  avatar?: string
  isFollowing?: boolean
}

type Post = {
  id: string
  author: User
  content: string
  createdAt: string
  media?: Media[]
  linkUrl?: string
  poll?: Poll
  tags?: string[]
  liked?: boolean
  likeCount: number
  commentCount: number
  reshareCount: number
  score: number
  comments?: Comment[]
  platform?: "twitter" | "instagram" | "reddit" | "threads"
  pinned?: boolean
  reported?: boolean
}

type CreatePostPayload = {
  text: string
  mediaFiles: File[]
  linkUrl?: string
  pollOptions?: string[]
}

export type SocialFeedSystemProps = {
  className?: string
  style?: React.CSSProperties
  initialPosts?: Post[]
  isAdmin?: boolean
  onCreatePost?: (payload: CreatePostPayload) => Promise<Post | void> | Post | void
  onReport?: (postId: string) => Promise<void> | void
  onDelete?: (postId: string) => Promise<void> | void
  onPinToggle?: (postId: string, pinned: boolean) => Promise<void> | void
}

const demoUsers: User[] = [
  {
    id: "u1",
    name: "Ava Chen",
    handle: "avachen",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
    isFollowing: true,
  },
  {
    id: "u2",
    name: "Liam Patel",
    handle: "liamp",
    avatar:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=400&auto=format&fit=crop",
    isFollowing: false,
  },
  {
    id: "u3",
    name: "Zoe Park",
    handle: "zoepark",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=400&auto=format&fit=crop",
    isFollowing: true,
  },
]

const demoPosts: Post[] = [
  {
    id: "p1",
    author: demoUsers[0],
    content:
      "Exploring the city with a rented e-bike today! #mobility @liamp The sunset was unreal.",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    media: [
      {
        id: "m1",
        type: "image",
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop",
        alt: "Bike at sunset",
      },
    ],
    tags: ["mobility", "travel"],
    likeCount: 32,
    commentCount: 5,
    reshareCount: 3,
    score: 89,
    platform: "instagram",
    comments: [
      {
        id: "c1",
        author: demoUsers[1],
        content: "Looks amazing! Where did you rent it from? #curious",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        score: 10,
        children: [
          {
            id: "c1-1",
            author: demoUsers[0],
            content: "Downtown hub on 4th. Super easy process!",
            createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
            score: 7,
          },
        ],
      },
    ],
  },
  {
    id: "p2",
    author: demoUsers[2],
    content:
      "Quick thought: community tools are more powerful when they’re rented, not bought. #RentMyLife",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    tags: ["RentMyLife"],
    likeCount: 14,
    commentCount: 2,
    reshareCount: 1,
    score: 40,
    platform: "twitter",
    poll: {
      id: "poll1",
      options: [
        { id: "o1", label: "Agree", votes: 21 },
        { id: "o2", label: "Depends", votes: 9 },
        { id: "o3", label: "Disagree", votes: 4 },
      ],
    },
  },
  {
    id: "p3",
    author: demoUsers[1],
    content:
      "Weekend project idea: a shared camera kit for the neighborhood. Thoughts? https://unsplash.com #community",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    likeCount: 6,
    commentCount: 0,
    reshareCount: 0,
    score: 12,
    linkUrl: "https://unsplash.com",
    platform: "reddit",
  },
]

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

function autoLinkText(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = []
  const regex = /(@[a-zA-Z0-9_]+)|(#\w+)|(https?:\/\/[^\s]+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith("@")) {
      const handle = token.slice(1)
      parts.push(
        <Link
          key={`${match.index}-m`}
          href={`/profile/${handle}`}
          className="text-foreground underline decoration-[--color-brand] underline-offset-4 hover:opacity-80"
        >
          {token}
        </Link>
      )
    } else if (token.startsWith("#")) {
      const tag = token.slice(1)
      parts.push(
        <Link
          key={`${match.index}-t`}
          href={`/social/tags/${tag}`}
          className="text-foreground underline decoration-[--color-brand] underline-offset-4 hover:opacity-80"
        >
          {token}
        </Link>
      )
    } else {
      parts.push(
        <a
          key={`${match.index}-l`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline decoration-[--color-brand] underline-offset-4 hover:opacity-80"
        >
          {token}
        </a>
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function platformIcon(p?: Post["platform"]) {
  const common = "h-4 w-4"
  switch (p) {
    case "instagram":
      return <Instagram className={common} aria-hidden />
    case "twitter":
      return <Twitter className={common} aria-hidden />
    case "reddit":
      return <Rss className={common} aria-hidden />
    case "threads":
      return <ScrollText className={common} aria-hidden />
    default:
      return <Speech className={common} aria-hidden />
  }
}

function pct(n: number, total: number) {
  if (total === 0) return 0
  return Math.round((n / total) * 100)
}

function MediaGrid({ media }: { media: Media[] }) {
  if (!media?.length) return null
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 overflow-hidden rounded-[var(--radius)]">
      {media.map((m) => (
        <div key={m.id} className="relative w-full max-w-full overflow-hidden rounded-md bg-secondary" style={{ aspectRatio: "1 / 1" }}>
          {m.type === "image" ? (
            <Image
              src={m.url}
              alt={m.alt || "media"}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : (
            <video controls className="absolute inset-0 h-full w-full object-cover">
              <source src={m.url} />
            </video>
          )}
        </div>
      ))}
    </div>
  )
}

function PollBlock({
  poll,
  onVote,
}: {
  poll: Poll
  onVote?: (optionId: string) => void
}) {
  const total = poll.options.reduce((a, b) => a + b.votes, 0)
  return (
    <div className="mt-3 space-y-2">
      {poll.options.map((o) => {
        const percentage = pct(o.votes, total)
        const isVoted = poll.votedOptionId === o.id
        return (
          <button
            key={o.id}
            onClick={() => onVote?.(o.id)}
            className={cn(
              "relative w-full overflow-hidden rounded-md border border-border bg-secondary text-left transition hover:brightness-[0.98] focus:outline-none focus:ring-2 focus:ring-[--ring]",
              isVoted && "ring-1 ring-[--ring]"
            )}
            aria-pressed={isVoted}
          >
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div
                className="h-full bg-accent"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="relative z-10 flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0 truncate">{o.label}</span>
              <span className="text-sm text-muted-foreground">{percentage}%</span>
            </div>
          </button>
        )
      })}
      {poll.endsAt && (
        <div className="text-xs text-muted-foreground">Ends {new Date(poll.endsAt).toLocaleString()}</div>
      )}
    </div>
  )
}

function CommentItem({
  comment,
  depth = 0,
  onReply,
  onVote,
}: {
  comment: Comment
  depth?: number
  onReply?: (parentId: string, text: string) => void
  onVote?: (id: string, delta: 1 | -1) => void
}) {
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState("")
  return (
    <div className="w-full max-w-full min-w-0">
      <div className={cn("flex w-full max-w-full gap-3", depth > 0 && "mt-3 pl-3")}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/profile/${comment.author.handle}`} className="text-sm font-medium hover:opacity-80">
              {comment.author.name}
            </Link>
            <span className="text-xs text-muted-foreground">@{comment.author.handle}</span>
            <span className="text-xs text-muted-foreground">· {timeAgo(comment.createdAt)}</span>
          </div>
          <div className="prose prose-sm mt-1 max-w-none break-words">
            <p className="whitespace-pre-wrap">{autoLinkText(comment.content)}</p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => onVote?.(comment.id, 1)}
            >
              <MessageCirclePlus className="h-4 w-4 mr-1" aria-hidden />
              <span className="text-xs">{comment.score}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => onVote?.(comment.id, -1)}
            >
              <ThumbsDown className="h-4 w-4 mr-1" aria-hidden />
              <span className="text-xs">Down</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setReplying((v) => !v)}
            >
              <MessageSquareReply className="h-4 w-4 mr-1" aria-hidden />
              <span className="text-xs">Reply</span>
            </Button>
          </div>
          {replying && (
            <div className="mt-2 flex items-start gap-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-16"
              />
              <Button
                onClick={() => {
                  if (!text.trim()) return
                  onReply?.(comment.id, text.trim())
                  setText("")
                  setReplying(false)
                }}
              >
                Reply
              </Button>
            </div>
          )}
          {comment.children?.length ? (
            <div className="mt-2 border-l border-border pl-3">
              {comment.children.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  depth={depth + 1}
                  onReply={onReply}
                  onVote={onVote}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function PostCard({
  post,
  isAdmin,
  onLike,
  onReshare,
  onComment,
  onFollowToggle,
  onReport,
  onDelete,
  onPinToggle,
  onVoteComment,
  onReplyComment,
  onVotePoll,
}: {
  post: Post
  isAdmin?: boolean
  onLike?: (id: string) => void
  onReshare?: (id: string) => void
  onComment?: (id: string) => void
  onFollowToggle?: (userId: string) => void
  onReport?: (id: string) => void
  onDelete?: (id: string) => void
  onPinToggle?: (id: string, pinned: boolean) => void
  onVoteComment?: (commentId: string, delta: 1 | -1) => void
  onReplyComment?: (parentId: string, text: string) => void
  onVotePoll?: (postId: string, optionId: string) => void
}) {
  return (
    <Card className={cn("bg-card")}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${post.author.handle}`} className="font-medium hover:opacity-80">
                {post.author.name}
              </Link>
              <span className="text-sm text-muted-foreground truncate">@{post.author.handle}</span>
              <span className="text-sm text-muted-foreground">· {timeAgo(post.createdAt)}</span>
              <Badge variant="secondary" className="ml-1 shrink-0 gap-1">
                {platformIcon(post.platform)}
                <span className="text-xs capitalize">{post.platform || "social"}</span>
              </Badge>
              {post.pinned && (
                <Badge className="bg-accent text-foreground">Pinned</Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {post.tags?.slice(0, 3).map((t) => (
                <Link key={t} href={`/social/tags/${t}`}>
                  <Badge variant="outline" className="hover:bg-secondary">#{t}</Badge>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={post.author.isFollowing ? "secondary" : "default"}
              onClick={() => onFollowToggle?.(post.author.id)}
              aria-pressed={post.author.isFollowing}
            >
              {post.author.isFollowing ? "Following" : "Follow"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Post actions">
                  <Speech className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onReport?.(post.id)}>
                  Report
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onPinToggle?.(post.id, !post.pinned)}>
                      {post.pinned ? "Unpin" : "Pin"} post
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(post.id)}>
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="prose mt-2 max-w-none break-words">
          <p className="whitespace-pre-wrap">{autoLinkText(post.content)}</p>
        </div>
        {post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block overflow-hidden rounded-[var(--radius)] border border-border bg-secondary p-3 hover:brightness-[0.98]"
          >
            <div className="text-sm font-medium truncate">{post.linkUrl}</div>
            <div className="text-xs text-muted-foreground">External link</div>
          </a>
        )}
        {post.media?.length ? <MediaGrid media={post.media} /> : null}
        {post.poll ? (
          <PollBlock
            poll={post.poll}
            onVote={(optionId) => onVotePoll?.(post.id, optionId)}
          />
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 gap-2 text-muted-foreground hover:text-foreground",
                  post.liked && "text-foreground"
                )}
                onClick={() => onLike?.(post.id)}
                aria-pressed={!!post.liked}
              >
                <MessageSquareHeart className="h-4 w-4" aria-hidden />
                <span className="text-sm">{post.likeCount}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Like</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => onComment?.(post.id)}
              >
                <MessageSquareText className="h-4 w-4" aria-hidden />
                <span className="text-sm">{post.commentCount}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Comment</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => onReshare?.(post.id)}
              >
                <MessageSquareShare className="h-4 w-4" aria-hidden />
                <span className="text-sm">{post.reshareCount}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reshare</TooltipContent>
          </Tooltip>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <MessageCirclePlus className="h-3.5 w-3.5" aria-hidden />
            <span>score {post.score}</span>
          </div>
        </TooltipProvider>
      </CardFooter>
      {post.comments?.length ? (
        <div className="px-6 pb-4">
          <Separator className="my-2" />
          <div className="space-y-4">
            {post.comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                onVote={onVoteComment}
                onReply={onReplyComment}
              />
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function Composer({
  onSubmit,
}: {
  onSubmit: (payload: CreatePostPayload) => Promise<void> | void
}) {
  const [text, setText] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [polling, setPolling] = useState(false)
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mediaPreviews = useMemo(() => mediaFiles.map((f) => ({ url: URL.createObjectURL(f), type: f.type.startsWith("video") ? "video" : "image" as const })), [mediaFiles])

  useEffect(() => {
    return () => {
      mediaPreviews.forEach((m) => URL.revokeObjectURL(m.url))
    }
  }, [mediaPreviews])

  const canPost = text.trim().length > 0 || mediaFiles.length > 0 || (polling && pollOptions.some((o) => o.trim()))

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Create a post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Share an update, link, or start a poll..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-24"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input
            placeholder="https://link.example"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            inputMode="url"
          />
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary p-2">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Add media
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setMediaFiles(files)
                }}
              />
              <div className="text-xs text-muted-foreground">{mediaFiles.length} file(s)</div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="poll" checked={polling} onCheckedChange={setPolling} />
              <Label htmlFor="poll" className="text-sm">Poll</Label>
            </div>
          </div>
        </div>
        {polling && (
          <div className="space-y-2 rounded-md border border-border bg-secondary p-3">
            <div className="text-sm font-medium">Poll options</div>
            <div className="grid gap-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions]
                      next[i] = e.target.value
                      setPollOptions(next)
                    }}
                    placeholder={`Option ${i + 1}`}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Remove option"
                    >
                      <ThumbsDown className="h-4 w-4 rotate-180" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 5 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPollOptions((prev) => [...prev, ""])}
                >
                  Add option
                </Button>
              )}
            </div>
          </div>
        )}
        {mediaPreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {mediaPreviews.map((m, idx) => (
              <div key={idx} className="relative overflow-hidden rounded-md bg-secondary" style={{ aspectRatio: "1 / 1" }}>
                {m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video controls className="h-full w-full object-cover">
                    <source src={m.url} />
                  </video>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-2">
        <div className="mr-auto flex items-center gap-2 text-muted-foreground">
          <Instagram className="h-4 w-4" aria-hidden />
          <Twitter className="h-4 w-4" aria-hidden />
          <Rss className="h-4 w-4" aria-hidden />
          <ScrollText className="h-4 w-4" aria-hidden />
          <Clapperboard className="h-4 w-4" aria-hidden />
        </div>
        <Button
          disabled={!canPost}
          onClick={async () => {
            await onSubmit({
              text: text.trim(),
              mediaFiles,
              linkUrl: linkUrl.trim() || undefined,
              pollOptions: polling ? pollOptions.filter(Boolean) : undefined,
            })
            setText("")
            setLinkUrl("")
            setMediaFiles([])
            setPolling(false)
            setPollOptions(["", ""])
          }}
        >
          Post
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function SocialFeedSystem({
  className,
  style,
  initialPosts,
  isAdmin = false,
  onCreatePost,
  onReport,
  onDelete,
  onPinToggle,
}: SocialFeedSystemProps) {
  const [posts, setPosts] = useState<Post[]>(() =>
    (initialPosts && initialPosts.length ? initialPosts : demoPosts).map((p) => ({
      ...p,
      liked: false,
    }))
  )
  const [filter, setFilter] = useState<"recency" | "popularity">("recency")
  const [tagFilter, setTagFilter] = useState<string | undefined>(undefined)
  const [loadingMore, setLoadingMore] = useState(false)
  const loadRef = useRef<HTMLDivElement>(null)

  const allTags = useMemo(() => {
    const s = new Set<string>()
    posts.forEach((p) => p.tags?.forEach((t) => s.add(t)))
    return Array.from(s)
  }, [posts])

  const sortedFiltered = useMemo(() => {
    let res = [...posts]
    if (tagFilter) {
      res = res.filter((p) => p.tags?.includes(tagFilter))
    }
    res.sort((a, b) => {
      if (filter === "recency") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      // popularity
      return (b.score + b.likeCount * 2 + b.commentCount) - (a.score + a.likeCount * 2 + a.commentCount)
    })
    // pinned first
    res.sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
    return res
  }, [posts, filter, tagFilter])

  const loadMore = useCallback(async () => {
    if (loadingMore) return
    setLoadingMore(true)
    await new Promise((r) => setTimeout(r, 800))
    const more: Post[] = Array.from({ length: 3 }).map((_, i) => ({
      id: `m-${Date.now()}-${i}`,
      author: demoUsers[(i + 1) % demoUsers.length],
      content:
        i % 2 === 0
          ? "Fresh drop: renting my podcast mic setup this weekend. DM if interested! #audio"
          : "Test footage from a rented cine camera. Unreal dynamic range. #film",
      createdAt: new Date().toISOString(),
      media:
        i % 2
          ? [
              {
                id: `mm-${i}`,
                type: "image",
                url: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
              },
            ]
          : undefined,
      likeCount: Math.floor(Math.random() * 10),
      commentCount: Math.floor(Math.random() * 4),
      reshareCount: Math.floor(Math.random() * 3),
      score: Math.floor(Math.random() * 30),
      platform: i % 2 ? "instagram" : "twitter",
      tags: i % 2 ? ["film"] : ["audio"],
    }))
    setPosts((prev) => [...prev, ...more])
    setLoadingMore(false)
  }, [loadingMore])

  useEffect(() => {
    if (!loadRef.current) return
    const el = loadRef.current
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMore()
          }
        })
      },
      { rootMargin: "600px 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  const handleCreate = useCallback(
    async (payload: CreatePostPayload) => {
      const newPost: Post = {
        id: `new-${Date.now()}`,
        author: demoUsers[0],
        content: payload.text,
        createdAt: new Date().toISOString(),
        media: payload.mediaFiles.map((f, idx) => ({
          id: `nf-${idx}`,
          type: f.type.startsWith("video") ? "video" : "image",
          url: URL.createObjectURL(f),
        })),
        linkUrl: payload.linkUrl,
        likeCount: 0,
        commentCount: 0,
        reshareCount: 0,
        score: 0,
        platform: "threads",
        poll: payload.pollOptions?.length
          ? {
              id: `poll-${Date.now()}`,
              options: payload.pollOptions.map((label, i) => ({
                id: `po-${i}`,
                label,
                votes: 0,
              })),
            }
          : undefined,
        tags: extractTags(payload.text),
      }
      setPosts((prev) => [newPost, ...prev])
      toast.success("Post created")
      try {
        await onCreatePost?.(payload)
      } catch {
        // no-op; demo
      }
    },
    [onCreatePost]
  )

  const extractTags = (t: string) =>
    Array.from(new Set((t.match(/#\w+/g) || []).map((v) => v.slice(1))))

  const toggleLike = (id: string) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) }
          : p
      )
    )

  const reshare = (id: string) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, reshareCount: p.reshareCount + 1 } : p))
    )

  const addComment = (id: string) => {
    const text = prompt("Write a comment") || ""
    if (!text.trim()) return
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              commentCount: p.commentCount + 1,
              comments: [
                ...(p.comments || []),
                {
                  id: `c-${Date.now()}`,
                  author: demoUsers[0],
                  content: text.trim(),
                  createdAt: new Date().toISOString(),
                  score: 0,
                },
              ],
            }
          : p
      )
    )
  }

  const followToggle = (userId: string) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.author.id === userId
          ? { ...p, author: { ...p.author, isFollowing: !p.author.isFollowing } }
          : p
      )
    )

  const reportPost = async (postId: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reported: true } : p)))
    toast.message("Reported", { description: "Thanks for helping keep the community safe." })
    try {
      await onReport?.(postId)
    } catch {
      // ignore
    }
  }

  const deletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    toast.success("Post deleted")
    try {
      await onDelete?.(postId)
    } catch {
      // ignore
    }
  }

  const pinToggle = async (postId: string, pinned: boolean) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, pinned } : p)))
    toast.success(pinned ? "Post pinned" : "Post unpinned")
    try {
      await onPinToggle?.(postId, pinned)
    } catch {
      // ignore
    }
  }

  const voteComment = (commentId: string, delta: 1 | -1) => {
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        comments: mutateComments(p.comments, (c) => {
          if (c.id === commentId) c.score += delta
        }),
      }))
    )
  }

  const replyComment = (parentId: string, text: string) => {
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        comments: mutateComments(p.comments, (c) => {
          if (c.id === parentId) {
            if (!c.children) c.children = []
            c.children.push({
              id: `c-${Date.now()}`,
              author: demoUsers[0],
              content: text,
              createdAt: new Date().toISOString(),
              score: 0,
            })
          }
        }),
      }))
    )
  }

  const votePoll = (postId: string, optionId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || !p.poll) return p
        if (p.poll.votedOptionId) return p
        const updated = {
          ...p,
          poll: {
            ...p.poll,
            votedOptionId: optionId,
            options: p.poll.options.map((o) =>
              o.id === optionId ? { ...o, votes: o.votes + 1 } : o
            ),
          },
        }
        return updated
      })
    )
  }

  return (
    <section className={cn("w-full max-w-full space-y-4", className)} style={style}>
      <div className="w-full max-w-full space-y-3 rounded-[var(--radius)] bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold">Social Feed</h3>
          <div className="ml-auto flex items-center gap-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-auto">
              <TabsList className="bg-secondary">
                <TabsTrigger value="recency">Recent</TabsTrigger>
                <TabsTrigger value="popularity">Popular</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select onValueChange={(v) => setTagFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[160px] bg-secondary">
                <SelectValue placeholder="Filter tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {allTags.map((t) => (
                  <SelectItem key={t} value={t}>
                    #{t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full"></div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Facebook className="h-3.5 w-3.5" aria-hidden />
            <Twitter className="h-3.5 w-3.5" aria-hidden />
            <Instagram className="h-3.5 w-3.5" aria-hidden />
            <Podcast className="h-3.5 w-3.5" aria-hidden />
            <span>Integrations ready</span>
          </div>
        </div>
        <Composer onSubmit={handleCreate} />
      </div>

      <div className="space-y-4">
        {sortedFiltered.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            isAdmin={isAdmin}
            onLike={toggleLike}
            onReshare={reshare}
            onComment={addComment}
            onFollowToggle={followToggle}
            onReport={reportPost}
            onDelete={deletePost}
            onPinToggle={pinToggle}
            onVoteComment={voteComment}
            onReplyComment={replyComment}
            onVotePoll={votePoll}
          />
        ))}
        <div ref={loadRef} className="flex items-center justify-center py-6">
          {loadingMore ? (
            <div className="rounded-full bg-secondary px-3 py-1 text-sm text-muted-foreground">
              Loading more...
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Scroll for more</div>
          )}
        </div>
      </div>
    </section>
  )
}

function mutateComments(list: Comment[] | undefined, mut: (c: Comment) => void): Comment[] | undefined {
  if (!list) return list
  return list.map((c) => {
    const clone: Comment = {
      ...c,
      children: c.children ? mutateComments(c.children, mut) : c.children,
    }
    mut(clone)
    return clone
  })
}