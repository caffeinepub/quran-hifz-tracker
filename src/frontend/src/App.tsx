import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile, useUserRole } from "./hooks/useQueries";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import ParentDashboard from "./pages/ParentDashboard";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import StudentDetail from "./pages/StudentDetail";
import TeacherDashboard from "./pages/TeacherDashboard";

export default function App() {
  const { identity, isInitializing, clear } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const [studentId, setStudentId] = useState<bigint | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const queryClient = useQueryClient();
  const claimAttempted = useRef(false);

  useEffect(() => {
    if (!identity || !actor || actorFetching || claimAttempted.current) return;
    const pending = sessionStorage.getItem("pendingTeacherClaim");
    if (!pending) return;

    claimAttempted.current = true;
    const { email, password } = JSON.parse(pending) as {
      email: string;
      password: string;
    };

    setIsClaiming(true);
    sessionStorage.removeItem("pendingTeacherClaim");

    actor
      .claimTeacherAccount(email, password)
      .then(() => {
        queryClient.invalidateQueries();
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Invalid credentials";
        toast.error(`Login failed: ${msg}`);
        clear();
        claimAttempted.current = false;
      })
      .finally(() => {
        setIsClaiming(false);
      });
  }, [identity, actor, actorFetching, queryClient, clear]);

  if (isInitializing || isClaiming) {
    return <LoadingScreen />;
  }

  if (!identity) {
    return (
      <>
        <AuthPage />
        <Toaster />
      </>
    );
  }

  if (profileLoading || roleLoading) {
    return <LoadingScreen />;
  }

  // Only show profile setup for admin logins (no pending claim in session means admin tab)
  const hasPendingClaim = !!sessionStorage.getItem("pendingTeacherClaim");
  if (!hasPendingClaim && (!profile || !profile.name)) {
    return (
      <>
        <ProfileSetupPage />
        <Toaster />
      </>
    );
  }

  if (studentId !== null) {
    return (
      <>
        <StudentDetail
          studentId={studentId}
          onBack={() => setStudentId(null)}
        />
        <Toaster />
      </>
    );
  }

  if (role === "guest") {
    return (
      <>
        <ParentDashboard />
        <Toaster />
      </>
    );
  }

  if (role === "admin") {
    return (
      <>
        <AdminDashboard onSelectStudent={(id) => setStudentId(id)} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <TeacherDashboard onSelectStudent={(id) => setStudentId(id)} />
      <Toaster />
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <p className="text-muted-foreground font-sans text-sm">Loading...</p>
      </div>
    </div>
  );
}
