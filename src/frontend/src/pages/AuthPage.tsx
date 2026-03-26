import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AuthPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-sidebar border-b border-sidebar-border px-4 h-14 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-sidebar-primary flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-sidebar-primary text-sm">
            Hifz Tracker
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Decorative geometric element */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full bg-primary/10" />
              <div className="absolute inset-2 rounded-full bg-primary/15" />
              <div className="absolute inset-4 rounded-full bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground text-center mb-2">
              Quran Hifz Tracker
            </h1>
            <p className="text-muted-foreground text-center text-sm leading-relaxed max-w-xs">
              Track your students' memorization journey with daily updates for
              parents
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="font-display text-lg font-semibold text-foreground mb-1">
                  Welcome
                </h2>
                <p className="text-muted-foreground text-sm">
                  Sign in to continue to your dashboard
                </p>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11"
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="auth.primary_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                    in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Teachers and parents both sign in here
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Daily Entries", desc: "Track jadeed & murajaat" },
              { label: "Parent Access", desc: "Real-time progress view" },
              { label: "Juz Marks", desc: "Record haali grades" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-card border border-border rounded-lg p-3"
              >
                <p className="font-semibold text-foreground text-xs mb-1">
                  {item.label}
                </p>
                <p className="text-muted-foreground text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
