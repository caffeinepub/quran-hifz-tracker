import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile, useUserRole } from "./hooks/useQueries";
import AuthPage from "./pages/AuthPage";
import ParentDashboard from "./pages/ParentDashboard";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import StudentDetail from "./pages/StudentDetail";
import TeacherDashboard from "./pages/TeacherDashboard";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const [studentId, setStudentId] = useState<bigint | null>(null);

  if (isInitializing) {
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

  if (!profile || !profile.name) {
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
