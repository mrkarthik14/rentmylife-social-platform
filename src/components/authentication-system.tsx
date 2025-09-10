"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  UserRound,
  LogIn,
  UserRoundPlus,
  UserLock,
  KeyRound,
  Fingerprint,
  UserCog,
  UserRoundCheck,
  UserRoundPen,
  IdCard,
  Contact,
  CircleUser,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type Role = "guest" | "user" | "companion" | "admin";

interface AuthenticationSystemProps {
  className?: string;
  defaultTab?: "user" | "admin" | "profile";
  onAuth?: (payload: { type: "login" | "signup" | "admin-login"; role: Role; email?: string; userId?: string }) => void;
  onProfileSave?: (profile: { displayName: string; bio: string; interests: string[]; verified: boolean; avatarUrl?: string }) => void;
}

const interestOptions = [
  "Travel",
  "Food",
  "Music",
  "Fitness",
  "Outdoors",
  "Gaming",
  "Art",
  "Tech",
  "Movies",
  "Books",
];

export default function AuthenticationSystem({
  className,
  defaultTab = "user",
  onAuth,
  onProfileSave,
}: AuthenticationSystemProps) {
  // Shared UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // User Auth state
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState<Role>("user");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Admin Auth state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");

  // Profile setup state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [verified, setVerified] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Avatar preview management with cleanup
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  // Simple validators
  const isEmailValid = (val: string) => /^\S+@\S+\.\S+$/.test(val);
  const isPasswordStrong = (val: string) => val.length >= 8;

  const canSubmitUser = useMemo(() => {
    if (forgotMode) return isEmailValid(forgotEmail);
    if (authMode === "login") return isEmailValid(userEmail) && userPassword.length > 0;
    return (
      isEmailValid(userEmail) &&
      isPasswordStrong(userPassword) &&
      confirmPassword === userPassword &&
      !!userRole
    );
  }, [authMode, userEmail, userPassword, confirmPassword, userRole, forgotMode, forgotEmail]);

  const canSubmitAdmin = useMemo(() => {
    if (!isEmailValid(adminEmail) || adminPassword.length === 0) return false;
    if (twoFAEnabled) return /^\d{6}$/.test(twoFACode);
    return true;
  }, [adminEmail, adminPassword, twoFAEnabled, twoFACode]);

  // Handlers
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!canSubmitUser) return;

    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      if (forgotMode) {
        toast.success("Password reset link sent");
        setInfo("We’ve sent a password reset link if an account exists for that email.");
        setForgotMode(false);
        setForgotEmail("");
        return;
      }
      if (authMode === "signup") {
        toast.success("Account created");
        setInfo("Welcome! Your account has been created.");
        onAuth?.({ type: "signup", role: userRole, email: userEmail });
      } else {
        toast.success("Logged in");
        setInfo("You’re now signed in.");
        onAuth?.({ type: "login", role: userRole, email: userEmail });
      }
      setUserPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast.error("Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!canSubmitAdmin) return;

    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      if (twoFAEnabled && !/^\d{6}$/.test(twoFACode)) {
        throw new Error("Invalid 2FA code");
      }
      toast.success("Admin access granted");
      setInfo("Welcome back, admin.");
      onAuth?.({ type: "admin-login", role: "admin", email: adminEmail });
      setTwoFACode("");
    } catch (err) {
      setError("Admin authentication failed. Check your credentials and 2FA.");
      toast.error("Admin login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocial = async (provider: "google" | "apple") => {
    setSubmitting(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 700));
      toast.success(`Signed in with ${provider === "google" ? "Google" : "Apple"}`);
    } catch {
      toast.error("Social login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      onProfileSave?.({
        displayName: displayName.trim(),
        bio,
        interests,
        verified,
        avatarUrl: avatarPreview,
      });
      toast.success("Profile saved");
      setInfo("Your profile has been updated.");
    } catch {
      setError("Unable to save profile. Please try again.");
      toast.error("Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={`w-full max-w-full ${className ?? ""}`}
      aria-label="Authentication and profile management"
    >
      <Card className="bg-card border-border rounded-[var(--radius)] shadow-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-[-0.02em]">
                Access your account
              </CardTitle>
              <CardDescription className="text-sm">
                Sign in, create an account, or manage your profile.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground rounded-full">
              <UserRound className="h-3.5 w-3.5 mr-1.5" aria-hidden />
              Secure
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Tabs defaultValue={defaultTab} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="bg-muted/60">
                <TabsTrigger value="user" className="gap-2">
                  <LogIn className="h-4 w-4" aria-hidden />
                  User
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-2">
                  <UserLock className="h-4 w-4" aria-hidden />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <UserRoundPen className="h-4 w-4" aria-hidden />
                  Profile
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="user" className="mt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Card className="bg-card border-border rounded-[var(--radius)]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg">User access</CardTitle>
                        <CardDescription className="text-[13px]">
                          Log in or create a new account
                        </CardDescription>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2 py-1">
                        {authMode === "login" ? (
                          <LogIn className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <UserRoundPlus className="h-3.5 w-3.5" aria-hidden />
                        )}
                        <span className="text-xs font-medium">
                          {authMode === "login" ? "Login" : "Signup"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUserSubmit} className="space-y-4" noValidate>
                      {!forgotMode && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="user-email">Email</Label>
                            <Input
                              id="user-email"
                              type="email"
                              inputMode="email"
                              autoComplete="email"
                              placeholder="you@example.com"
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              aria-invalid={!!userEmail && !isEmailValid(userEmail)}
                              aria-describedby="user-email-desc"
                              className="bg-background"
                              required
                            />
                            <small id="user-email-desc" className="text-muted">
                              Use a valid email address.
                            </small>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="user-password">Password</Label>
                            <Input
                              id="user-password"
                              type="password"
                              autoComplete={authMode === "login" ? "current-password" : "new-password"}
                              placeholder={authMode === "login" ? "Your password" : "At least 8 characters"}
                              value={userPassword}
                              onChange={(e) => setUserPassword(e.target.value)}
                              aria-invalid={authMode === "signup" ? !!userPassword && !isPasswordStrong(userPassword) : undefined}
                              className="bg-background"
                              required
                            />
                            {authMode === "signup" && (
                              <small className="text-muted">Use 8+ characters for strong security.</small>
                            )}
                          </div>

                          {authMode === "signup" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm password</Label>
                                <Input
                                  id="confirm-password"
                                  type="password"
                                  autoComplete="new-password"
                                  placeholder="Re-enter password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  aria-invalid={!!confirmPassword && confirmPassword !== userPassword}
                                  className="bg-background"
                                  required
                                />
                                {!!confirmPassword && confirmPassword !== userPassword && (
                                  <p className="text-[13px] text-destructive">Passwords do not match.</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label>Role</Label>
                                <Select
                                  onValueChange={(v: Role) => setUserRole(v)}
                                  defaultValue="user"
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="guest">Guest</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="companion">Companion</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                <small className="text-muted">Choose how you’ll use the platform.</small>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {forgotMode && (
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email">Account email</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            aria-invalid={!!forgotEmail && !isEmailValid(forgotEmail)}
                            className="bg-background"
                            required
                          />
                          <small className="text-muted">
                            We’ll send a reset link to this address.
                          </small>
                        </div>
                      )}

                      {error && (
                        <div role="alert" className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">
                          {error}
                        </div>
                      )}
                      {info && !error && (
                        <div role="status" aria-live="polite" className="rounded-md bg-accent px-3 py-2 text-sm">
                          {info}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="remember" />
                          <Label htmlFor="remember" className="text-sm font-normal text-muted">
                            Remember me
                          </Label>
                        </div>
                        {!forgotMode ? (
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setInfo(null);
                              setForgotMode(true);
                            }}
                            className="text-sm underline underline-offset-4 hover:no-underline"
                          >
                            Forgot password?
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setInfo(null);
                              setForgotMode(false);
                            }}
                            className="text-sm underline underline-offset-4 hover:no-underline"
                          >
                            Back to sign in
                          </button>
                        )}
                      </div>

                      <div className="pt-1 flex flex-col sm:flex-row gap-3">
                        <Button
                          type="submit"
                          disabled={submitting || !canSubmitUser}
                          className="w-full sm:w-auto"
                        >
                          {submitting ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/60 border-t-transparent" />
                              Processing
                            </span>
                          ) : forgotMode ? (
                            "Send reset link"
                          ) : authMode === "login" ? (
                            <span className="inline-flex items-center gap-2">
                              <LogIn className="h-4 w-4" aria-hidden />
                              Sign in
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <UserRoundPlus className="h-4 w-4" aria-hidden />
                              Create account
                            </span>
                          )}
                        </Button>
                        {!forgotMode && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setAuthMode((m) => (m === "login" ? "signup" : "login"));
                              setError(null);
                              setInfo(null);
                            }}
                            className="w-full sm:w-auto"
                          >
                            {authMode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
                          </Button>
                        )}
                      </div>
                    </form>

                    {!forgotMode && (
                      <>
                        <div className="my-6">
                          <Separator />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Button
                            variant="outline"
                            className="w-full bg-background"
                            onClick={() => handleSocial("google")}
                            disabled={submitting}
                            aria-label="Continue with Google"
                          >
                            <CircleUser className="h-4 w-4 mr-2" aria-hidden />
                            Continue with Google
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full bg-background"
                            onClick={() => handleSocial("apple")}
                            disabled={submitting}
                            aria-label="Continue with Apple"
                          >
                            <Contact className="h-4 w-4 mr-2" aria-hidden />
                            Continue with Apple
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border rounded-[var(--radius)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Roles overview</CardTitle>
                    <CardDescription className="text-[13px]">
                      Choose the right role for your needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <RoleItem
                      icon={<UserRound className="h-4 w-4" aria-hidden />}
                      title="Guest"
                      desc="Browse publicly available content without an account."
                      active={userRole === "guest"}
                    />
                    <RoleItem
                      icon={<IdCard className="h-4 w-4" aria-hidden />}
                      title="User"
                      desc="Book rentals, join conversations, and follow companions."
                      active={userRole === "user"}
                    />
                    <RoleItem
                      icon={<UserCog className="h-4 w-4" aria-hidden />}
                      title="Companion"
                      desc="Offer services, build a profile, and engage socially."
                      active={userRole === "companion"}
                    />
                    <RoleItem
                      icon={<UserLock className="h-4 w-4" aria-hidden />}
                      title="Admin"
                      desc="Administrative access for platform operations."
                      active={userRole === "admin"}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="mt-6">
              <Card className="bg-card border-border rounded-[var(--radius)]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Administrator login</CardTitle>
                      <CardDescription className="text-[13px]">
                        Restricted access area
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      <UserLock className="h-3.5 w-3.5 mr-1" aria-hidden />
                      Admin
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAdminSubmit} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Admin email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="admin@rentmylife.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        aria-invalid={!!adminEmail && !isEmailValid(adminEmail)}
                        className="bg-background"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="bg-background"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Two-factor authentication</p>
                          <p className="text-xs text-muted">Optional, adds an extra layer of security</p>
                        </div>
                      </div>
                      <Switch
                        checked={twoFAEnabled}
                        onCheckedChange={(v) => {
                          setTwoFAEnabled(!!v);
                          setTwoFACode("");
                        }}
                        aria-label="Enable two-factor authentication"
                      />
                    </div>

                    {twoFAEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="twofa-code">6-digit code</Label>
                        <Input
                          id="twofa-code"
                          inputMode="numeric"
                          pattern="\d{6}"
                          placeholder="123456"
                          value={twoFACode}
                          onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          aria-invalid={!!twoFACode && !/^\d{6}$/.test(twoFACode)}
                          className="bg-background tracking-[0.2em] text-center"
                          required
                        />
                        <small className="text-muted">Enter the code from your authenticator app.</small>
                      </div>
                    )}

                    {error && (
                      <div role="alert" className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">
                        {error}
                      </div>
                    )}
                    {info && !error && (
                      <div role="status" aria-live="polite" className="rounded-md bg-accent px-3 py-2 text-sm">
                        {info}
                      </div>
                    )}

                    <div className="pt-2">
                      <Button type="submit" disabled={submitting || !canSubmitAdmin} className="w-full sm:w-auto">
                        {submitting ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/60 border-t-transparent" />
                            Verifying
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <KeyRound className="h-4 w-4" aria-hidden />
                            Log in as admin
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <Card className="bg-card border-border rounded-[var(--radius)]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Profile setup</CardTitle>
                      <CardDescription className="text-[13px]">
                        Build a public profile for social and rentals
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {verified ? (
                        <Badge className="rounded-full">
                          <UserRoundCheck className="h-3.5 w-3.5 mr-1" aria-hidden />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded-full">
                          <IdCard className="h-3.5 w-3.5 mr-1" aria-hidden />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleProfileSave} className="grid gap-6" noValidate>
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                      <div className="relative">
                        <Avatar className="h-20 w-20 ring-2 ring-border">
                          <AvatarImage
                            src={
                              avatarPreview ??
                              "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=400&auto=format&fit=crop"
                            }
                            alt="Profile avatar"
                          />
                          <AvatarFallback className="bg-muted text-foreground">
                            <CircleUser className="h-6 w-6" aria-hidden />
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UserRoundPen className="h-4 w-4 mr-2" aria-hidden />
                          Change avatar
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file && file.size > 5 * 1024 * 1024) {
                              toast.error("Image too large (max 5MB)");
                              return;
                            }
                            setAvatarFile(file);
                          }}
                          aria-label="Upload avatar"
                        />
                      </div>

                      <div className="grid w-full gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="display-name">Display name</Label>
                          <Input
                            id="display-name"
                            placeholder="How others will see you"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="bg-background"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            placeholder="Tell others about yourself, your interests, and offerings..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="bg-background min-h-24"
                            maxLength={500}
                          />
                          <div className="text-xs text-muted">{bio.length}/500</div>
                        </div>

                        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                          <div className="flex items-center gap-2">
                            <UserRoundCheck className="h-4 w-4" aria-hidden />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">Verification badge</p>
                              <p className="text-xs text-muted">
                                Request verification to build trust with others.
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={verified}
                            onCheckedChange={(v) => setVerified(!!v)}
                            aria-label="Toggle verification request"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Interests</Label>
                      <div className="flex flex-wrap gap-2">
                        {interestOptions.map((tag) => {
                          const active = interests.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleInterest(tag)}
                              aria-pressed={active}
                              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                active
                                  ? "bg-foreground text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {error && (
                      <div role="alert" className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">
                        {error}
                      </div>
                    )}
                    {info && !error && (
                      <div role="status" aria-live="polite" className="rounded-md bg-accent px-3 py-2 text-sm">
                        {info}
                      </div>
                    )}
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto bg-background"
                    onClick={() => {
                      setDisplayName("");
                      setBio("");
                      setVerified(false);
                      setInterests([]);
                      setAvatarFile(null);
                      setError(null);
                      setInfo("Cleared unsaved changes.");
                    }}
                    disabled={submitting}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => handleProfileSave(e as any)}
                    disabled={submitting || !displayName.trim()}
                    className="w-full sm:w-auto"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/60 border-t-transparent" />
                        Saving
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <UserRoundPen className="h-4 w-4" aria-hidden />
                        Save profile
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted">
            By continuing, you agree to our Terms and Privacy Policy.
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              <ScanIcon className="h-3.5 w-3.5 mr-1" aria-hidden />
              2FA Ready
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              <ShieldIcon className="h-3.5 w-3.5 mr-1" aria-hidden />
              Encrypted
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
}

// Small, focused subcomponent for role descriptions
function RoleItem({
  icon,
  title,
  desc,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-[calc(var(--radius)-6px)] border p-3 ${
        active ? "border-foreground bg-accent" : "border-border"
      }`}
    >
      <div className="mt-0.5 shrink-0 text-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
    </div>
  );
}

// Decorative icons composed from allowed list
function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  // Compose a "shield-like" metaphor using allowed icons in a subtle way
  return <UserLock {...props} />;
}
function ScanIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Fingerprint {...props} />;
}