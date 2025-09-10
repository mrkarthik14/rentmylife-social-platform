"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  UserRoundPen,
  UserRoundCheck,
  Users,
  User,
  EyeOff,
  UserCog,
  CircleUserRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"

type ActivityType = "post" | "booking" | "social"

export interface UserProfile {
  id: string
  name: string
  username: string
  avatarUrl?: string | null
  bio?: string
  interests?: string[]
  verified?: boolean
  stats?: {
    posts?: number
    followers?: number
    following?: number
  }
  ratings?: {
    host?: number // 0-5
    guest?: number // 0-5
  }
}

export interface RentalItem {
  id: string
  title: string
  coverUrl: string
  pricePerNight: number
  rating?: number // 0-5
  location?: string
}

export interface ActivityItem {
  id: string
  type: ActivityType
  dateISO: string
  title: string
  description?: string
}

interface NotificationSettings {
  emailUpdates: boolean
  pushNotifications: boolean
  bookingReminders: boolean
  socialMentions: boolean
}

interface PrivacySettings {
  profileVisibility: "public" | "followers" | "private"
  showActivity: boolean
}

interface PreferenceSettings {
  theme: "system" | "light" | "dark"
  timeFormat: "12h" | "24h"
  language: "en" | "es" | "fr"
}

export interface UserProfileSystemProps {
  user: UserProfile
  rentals?: RentalItem[]
  activity?: ActivityItem[]
  className?: string
  style?: React.CSSProperties
  onUpdateProfile?: (data: Partial<UserProfile>) => Promise<void> | void
  onUpdateSettings?: (data: {
    notifications: NotificationSettings
    privacy: PrivacySettings
    preferences: PreferenceSettings
  }) => Promise<void> | void
  layout?: "compact" | "full"
}

const defaultNotifications: NotificationSettings = {
  emailUpdates: true,
  pushNotifications: true,
  bookingReminders: true,
  socialMentions: true,
}

const defaultPrivacy: PrivacySettings = {
  profileVisibility: "public",
  showActivity: true,
}

const defaultPreferences: PreferenceSettings = {
  theme: "system",
  timeFormat: "12h",
  language: "en",
}

export default function UserProfileSystem({
  user,
  rentals = [],
  activity = [],
  className,
  style,
  onUpdateProfile,
  onUpdateSettings,
  layout = "full",
}: UserProfileSystemProps) {
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(user.avatarUrl ?? null)
  const [isEditing, setIsEditing] = React.useState(false)

  const [formName, setFormName] = React.useState(user.name)
  const [formUsername, setFormUsername] = React.useState(user.username)
  const [formBio, setFormBio] = React.useState(user.bio ?? "")
  const [formInterests, setFormInterests] = React.useState<string[]>(user.interests ?? [])

  const [notifications, setNotifications] = React.useState<NotificationSettings>(defaultNotifications)
  const [privacy, setPrivacy] = React.useState<PrivacySettings>(defaultPrivacy)
  const [preferences, setPreferences] = React.useState<PreferenceSettings>(defaultPreferences)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result as string)
      toast.success("Avatar updated locally. Remember to Save.")
    }
    reader.readAsDataURL(file)
  }

  function addInterestFromInput(e: React.KeyboardEvent<HTMLInputElement>) {
    const target = e.currentTarget
    const value = target.value.trim()
    if (e.key === "Enter" && value) {
      if (!formInterests.includes(value)) {
        setFormInterests((prev) => [...prev, value])
      }
      target.value = ""
    }
  }

  function removeInterest(tag: string) {
    setFormInterests((prev) => prev.filter((t) => t !== tag))
  }

  async function handleSaveProfile() {
    try {
      await onUpdateProfile?.({
        name: formName,
        username: formUsername,
        bio: formBio,
        interests: formInterests,
        avatarUrl: avatarPreview ?? undefined,
      })
      setIsEditing(false)
      toast.success("Profile saved")
    } catch (e) {
      toast.error("Failed to save profile")
    }
  }

  async function handleSaveSettings() {
    try {
      await onUpdateSettings?.({ notifications, privacy, preferences })
      toast.success("Settings updated")
    } catch (e) {
      toast.error("Failed to update settings")
    }
  }

  const followerCount = user.stats?.followers ?? 0
  const followingCount = user.stats?.following ?? 0
  const postCount = user.stats?.posts ?? 0

  const verified = Boolean(user.verified)

  return (
    <section
      className={cn(
        "w-full max-w-full bg-background",
        className,
      )}
      style={style}
      aria-label="User profile system"
    >
      <Card className={cn("bg-card border-border", layout === "compact" ? "p-4" : "p-6")}>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-2 ring-border">
                <AvatarImage
                  src={
                    avatarPreview ??
                    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=256&auto=format&fit=facearea&facepad=3&h=256"
                  }
                  alt={`${user.name} avatar`}
                />
                <AvatarFallback className="bg-secondary text-foreground">
                  <CircleUserRound className="h-10 w-10 opacity-70" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold truncate">{user.name}</h2>
                  {verified && (
                    <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-foreground">
                      <UserRoundCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="text-muted-foreground">
                    <Users className="inline-block h-4 w-4 mr-1 align-[-2px]" aria-hidden="true" />
                    {followerCount.toLocaleString()} Followers
                  </span>
                  <span className="text-muted-foreground">
                    <User className="inline-block h-4 w-4 mr-1 align-[-2px]" aria-hidden="true" />
                    {followingCount.toLocaleString()} Following
                  </span>
                  <span className="text-muted-foreground">
                    Posts {postCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
              <Button variant="secondary" onClick={handleAvatarClick} className="bg-secondary">
                Change Avatar
              </Button>
              <Button variant="default" onClick={() => setIsEditing((v) => !v)}>
                <UserRoundPen className="mr-2 h-4 w-4" aria-hidden="true" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-muted/70">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="rentals">Rentals</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-6">
                {/* About */}
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">About</CardTitle>
                    <CardDescription>Public information on your profile</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {isEditing ? (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Your name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={formUsername}
                            onChange={(e) => setFormUsername(e.target.value)}
                            placeholder="username"
                            prefix="@"
                          />
                          <p className="text-xs text-muted-foreground">Your unique handle</p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={formBio}
                            onChange={(e) => setFormBio(e.target.value)}
                            placeholder="Tell the community about yourself, your interests, and what you offer."
                            rows={4}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Interests</Label>
                          <div className="flex flex-wrap gap-2">
                            {formInterests.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="group bg-secondary"
                              >
                                {tag}
                                <button
                                  type="button"
                                  aria-label={`Remove ${tag}`}
                                  className="ml-2 rounded-sm px-1 text-muted-foreground transition-colors hover:bg-muted/60"
                                  onClick={() => removeInterest(tag)}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <Input
                            aria-label="Add interest"
                            placeholder="Type an interest and press Enter"
                            onKeyDown={addInterestFromInput}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveProfile}>Save</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm leading-6 text-foreground/90 break-words">
                          {user.bio || "No bio provided yet."}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(user.interests?.length ? user.interests : []).map((tag) => (
                            <Badge key={tag} variant="secondary" className="bg-secondary">
                              {tag}
                            </Badge>
                          ))}
                          {!user.interests?.length && (
                            <span className="text-sm text-muted-foreground">No interests added</span>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Ratings and Verification */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Host Rating</CardTitle>
                      <CardDescription>As a property host</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RatingDisplay value={user.ratings?.host ?? 0} />
                    </CardContent>
                  </Card>
                  <Card className="bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Guest Rating</CardTitle>
                      <CardDescription>As a renter/guest</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RatingDisplay value={user.ratings?.guest ?? 0} />
                    </CardContent>
                  </Card>
                  <Card className="bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Verification</CardTitle>
                      <CardDescription>Identity & profile status</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-full",
                            verified ? "bg-accent" : "bg-muted"
                          )}
                          aria-hidden="true"
                        >
                          {verified ? (
                            <UserRoundCheck className="h-5 w-5" />
                          ) : (
                            <EyeOff className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {verified ? "Verified profile" : "Not verified"}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {verified
                              ? "Your profile is verified for safer bookings."
                              : "Verify to increase trust and visibility."}
                          </p>
                        </div>
                      </div>
                      <Button variant={verified ? "secondary" : "default"} className={verified ? "bg-secondary" : ""}>
                        {verified ? "Manage" : "Get verified"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity preview */}
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>A snapshot of your latest actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col gap-4">
                      {activity.slice(0, 5).map((item) => (
                        <li key={item.id} className="flex items-start gap-3">
                          <ActivityIcon type={item.type} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground break-words">
                                {item.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.dateISO).toLocaleString()}
                            </p>
                          </div>
                        </li>
                      ))}
                      {!activity.length && (
                        <li className="text-sm text-muted-foreground">No recent activity</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Activity */}
            <TabsContent value="activity" className="mt-6">
              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Activity Feed</CardTitle>
                  <CardDescription>Posts, bookings, and social interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-5">
                    {activity.map((item) => (
                      <div key={item.id} className="flex items-start gap-4">
                        <ActivityIcon type={item.type} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold min-w-0 truncate">
                              {item.title}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(item.dateISO).toLocaleString()}
                            </span>
                          </div>
                          {item.description && (
                            <p className="mt-1 text-sm text-foreground/90 break-words">
                              {item.description}
                            </p>
                          )}
                          <Separator className="mt-4" />
                        </div>
                      </div>
                    ))}
                    {!activity.length && (
                      <p className="text-sm text-muted-foreground">No activity yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rentals */}
            <TabsContent value="rentals" className="mt-6">
              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">Portfolio</CardTitle>
                      <CardDescription>Your available rentals</CardDescription>
                    </div>
                    <Button>
                      Add Rental
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {rentals.map((rental) => (
                      <article key={rental.id} className="group rounded-xl overflow-hidden border border-border bg-card transition-shadow hover:shadow-sm">
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          <img
                            src={rental.coverUrl || "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop"}
                            alt={rental.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-base font-semibold min-w-0 truncate">{rental.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {rental.location ?? "—"}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-sm font-medium">
                              ${rental.pricePerNight}/night
                            </div>
                            <RatingInline value={rental.rating ?? 0} />
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            <Button variant="secondary" className="bg-secondary">Preview</Button>
                            <Button variant="default">Manage</Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  {!rentals.length && (
                    <p className="text-sm text-muted-foreground">No rentals listed yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="mt-6">
              <div className="grid gap-6">
                {/* Personal Settings */}
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-5 w-5" aria-hidden="true" />
                      <div>
                        <CardTitle className="text-lg">Personal Settings</CardTitle>
                        <CardDescription>Manage your profile details</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="settings-name">Name</Label>
                      <Input
                        id="settings-name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="settings-username">Username</Label>
                      <Input
                        id="settings-username"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="username"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="settings-bio">Bio</Label>
                      <Textarea
                        id="settings-bio"
                        value={formBio}
                        onChange={(e) => setFormBio(e.target.value)}
                        placeholder="Short introduction"
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Interests</Label>
                      <div className="flex flex-wrap gap-2">
                        {formInterests.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-secondary">
                            {tag}
                            <button
                              type="button"
                              aria-label={`Remove ${tag}`}
                              className="ml-2 rounded-sm px-1 text-muted-foreground transition-colors hover:bg-muted/60"
                              onClick={() => removeInterest(tag)}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        aria-label="Add interest"
                        placeholder="Type an interest and press Enter"
                        onKeyDown={addInterestFromInput}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile}>Save Profile</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy */}
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                      <div>
                        <CardTitle className="text-lg">Privacy</CardTitle>
                        <CardDescription>Control what others can see</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="visibility">Profile visibility</Label>
                      <Select
                        value={privacy.profileVisibility}
                        onValueChange={(v: "public" | "followers" | "private") =>
                          setPrivacy((p) => ({ ...p, profileVisibility: v }))
                        }
                      >
                        <SelectTrigger id="visibility" className="w-full">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="followers">Followers only</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Label htmlFor="show-activity" className="block">
                          Show activity feed
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Allow others to see your public actions
                        </p>
                      </div>
                      <Switch
                        id="show-activity"
                        checked={privacy.showActivity}
                        onCheckedChange={(v) =>
                          setPrivacy((p) => ({ ...p, showActivity: v }))
                        }
                        aria-label="Toggle activity visibility"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" aria-hidden="true" />
                      <div>
                        <CardTitle className="text-lg">Notifications</CardTitle>
                        <CardDescription>Stay informed with updates</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <SettingToggle
                      id="notif-email"
                      label="Email updates"
                      description="Receive important updates via email"
                      checked={notifications.emailUpdates}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, emailUpdates: v }))
                      }
                    />
                    <SettingToggle
                      id="notif-push"
                      label="Push notifications"
                      description="Real-time alerts for new activity"
                      checked={notifications.pushNotifications}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, pushNotifications: v }))
                      }
                    />
                    <SettingToggle
                      id="notif-booking"
                      label="Booking reminders"
                      description="Reminders for upcoming bookings"
                      checked={notifications.bookingReminders}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, bookingReminders: v }))
                      }
                    />
                    <SettingToggle
                      id="notif-social"
                      label="Mentions and follows"
                      description="When someone mentions or follows you"
                      checked={notifications.socialMentions}
                      onChange={(v) =>
                        setNotifications((n) => ({ ...n, socialMentions: v }))
                      }
                    />
                  </CardContent>
                </Card>

                {/* Preferences */}
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-5 w-5" aria-hidden="true" />
                      <div>
                        <CardTitle className="text-lg">Preferences</CardTitle>
                        <CardDescription>Personalize your experience</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="pref-theme">Theme</Label>
                        <Select
                          value={preferences.theme}
                          onValueChange={(v: "system" | "light" | "dark") =>
                            setPreferences((p) => ({ ...p, theme: v }))
                          }
                        >
                          <SelectTrigger id="pref-theme">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pref-time">Time format</Label>
                        <Select
                          value={preferences.timeFormat}
                          onValueChange={(v: "12h" | "24h") =>
                            setPreferences((p) => ({ ...p, timeFormat: v }))
                          }
                        >
                          <SelectTrigger id="pref-time">
                            <SelectValue placeholder="Select time format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12h">12-hour</SelectItem>
                            <SelectItem value="24h">24-hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:max-w-xs">
                      <Label htmlFor="pref-language">Language</Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(v: "en" | "es" | "fr") =>
                          setPreferences((p) => ({ ...p, language: v }))
                        }
                      >
                        <SelectTrigger id="pref-language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSaveSettings}>Save Settings</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </section>
  )
}

function SettingToggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="block">
          {label}
        </Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function RatingDisplay({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(5, value))
  const percent = (safe / 5) * 100
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold">{safe.toFixed(1)}</div>
        <span className="text-xs text-muted-foreground">out of 5</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-foreground transition-[width] duration-300"
          style={{ width: `${percent}%` }}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={safe}
          role="progressbar"
        />
      </div>
    </div>
  )
}

function RatingInline({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(5, value))
  return (
    <span className="text-xs text-muted-foreground">{safe.toFixed(1)} / 5</span>
  )
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const base = "h-9 w-9 rounded-full inline-flex items-center justify-center"
  switch (type) {
    case "post":
      return (
        <div className={`${base} bg-accent text-foreground`} aria-hidden="true">
          <UserRoundPen className="h-5 w-5" />
        </div>
      )
    case "booking":
      return (
        <div className={`${base} bg-secondary text-foreground`} aria-hidden="true">
          <User className="h-5 w-5" />
        </div>
      )
    case "social":
      return (
        <div className={`${base} bg-muted text-foreground`} aria-hidden="true">
          <Users className="h-5 w-5" />
        </div>
      )
    default:
      return (
        <div className={`${base} bg-muted text-foreground`} aria-hidden="true">
          <Users className="h-5 w-5" />
        </div>
      )
  }
}