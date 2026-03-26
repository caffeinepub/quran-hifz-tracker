import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, GraduationCap, Heart, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveProfile } from "../hooks/useQueries";

export default function ProfileSetupPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "guest">("user");
  const { mutateAsync: saveProfile, isPending } = useSaveProfile();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      await saveProfile({ name: name.trim(), role });
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
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Your Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="h-11"
              data-ocid="profile.input"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">I am a...</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  role === "user"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
                data-ocid="profile.radio"
              >
                <GraduationCap className="w-6 h-6" />
                <span className="font-medium text-sm">Teacher</span>
                <span className="text-xs text-center leading-tight opacity-75">
                  Manage students & record entries
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("guest")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  role === "guest"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
                data-ocid="profile.radio"
              >
                <Heart className="w-6 h-6" />
                <span className="font-medium text-sm">Parent</span>
                <span className="text-xs text-center leading-tight opacity-75">
                  View your child's progress
                </span>
              </button>
            </div>
          </div>

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
            ) : (
              "Get Started"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
