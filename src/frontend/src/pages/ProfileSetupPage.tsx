import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  GraduationCap,
  Heart,
  KeyRound,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useClaimTeacherAccount, useSaveProfile } from "../hooks/useQueries";

type Mode = "teacher" | "teacher-login" | "parent";

const ADMIN_EMAIL = "murtazatinwala@msbinstitute.com";

export default function ProfileSetupPage() {
  const [mode, setMode] = useState<Mode>("teacher");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const { mutateAsync: saveProfile, isPending: savePending } = useSaveProfile();
  const { mutateAsync: claimAccount, isPending: claimPending } =
    useClaimTeacherAccount();

  const isPending = savePending || claimPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "teacher-login") {
      if (!loginEmail.trim() || !loginPassword.trim()) {
        toast.error("Please enter your email and password");
        return;
      }
      try {
        await claimAccount({
          email: loginEmail.trim(),
          password: loginPassword.trim(),
        });
        toast.success("Logged in as teacher!");
      } catch {
        toast.error("Invalid email or password");
      }
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      await saveProfile({
        name: name.trim(),
        role: mode === "teacher" ? "user" : "guest",
        email: mode === "teacher" ? email.trim() : "",
      });
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Tell us who you are to get started
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-6 shadow-card space-y-6"
        >
          {/* Role selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">I am a...</Label>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setMode("teacher")}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  mode === "teacher"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
                data-ocid="profile.radio"
              >
                <GraduationCap className="w-6 h-6 shrink-0" />
                <div>
                  <div className="font-medium text-sm">Teacher</div>
                  <div className="text-xs opacity-75">
                    Manage students & record entries
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode("teacher-login")}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  mode === "teacher-login"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
                data-ocid="profile.radio"
              >
                <KeyRound className="w-6 h-6 shrink-0" />
                <div>
                  <div className="font-medium text-sm">
                    I have teacher login
                  </div>
                  <div className="text-xs opacity-75">
                    Use credentials provided by admin
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode("parent")}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  mode === "parent"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
                data-ocid="profile.radio"
              >
                <Heart className="w-6 h-6 shrink-0" />
                <div>
                  <div className="font-medium text-sm">Parent</div>
                  <div className="text-xs opacity-75">
                    View your child's progress
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Teacher: name + email */}
          {mode === "teacher" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-11"
                  data-ocid="profile.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`e.g. ${ADMIN_EMAIL}`}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Admin email automatically gets admin privileges
                </p>
              </div>
            </div>
          )}

          {/* Teacher login: email + password */}
          {mode === "teacher-login" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="teacher@school.com"
                  className="h-11"
                  data-ocid="profile.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password given by admin"
                  className="h-11"
                />
              </div>
            </div>
          )}

          {/* Parent: name only */}
          {mode === "parent" && (
            <div className="space-y-2">
              <Label htmlFor="parent-name">Your Name</Label>
              <Input
                id="parent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="h-11"
                data-ocid="profile.input"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold"
            disabled={isPending}
            data-ocid="profile.submit_button"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : mode === "teacher-login" ? (
              "Login as Teacher"
            ) : (
              "Get Started"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
