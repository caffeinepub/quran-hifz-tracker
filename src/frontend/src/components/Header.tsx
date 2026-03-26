import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, LogOut, User } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";

interface HeaderProps {
  onBack?: () => void;
  backLabel?: string;
}

export default function Header({ onBack, backLabel }: HeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useUserProfile();

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="bg-sidebar text-sidebar-foreground shadow-sm border-b border-sidebar-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent mr-1"
              data-ocid="nav.link"
            >
              ← {backLabel || "Back"}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-base leading-tight text-sidebar-primary">
                Hifz Tracker
              </h1>
              <p className="text-xs text-sidebar-foreground/60 leading-none">
                Quran Memorization
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {identity && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
                  data-ocid="nav.button"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">
                    {profile?.name || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  className="text-muted-foreground text-xs"
                  disabled
                >
                  <User className="w-3 h-3 mr-2" />
                  {profile?.role === "guest" ? "Parent" : "Teacher"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={clear}
                  className="text-destructive"
                  data-ocid="nav.button"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
