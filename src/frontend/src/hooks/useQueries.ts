import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  HifzEntryInput,
  StudentInput,
  StudentWithTeacher,
  TeacherCredential,
  UserProfile,
  UserRole,
} from "../backend.d";
import { useActor } from "./useActor";

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const raw = await actor.getCallerUserProfile();
        // Handle both plain object and Candid optional array [ UserProfile ] | []
        if (Array.isArray(raw)) return (raw[0] as UserProfile) ?? null;
        return raw as UserProfile | null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const raw = await actor.getCallerUserRole();
        if (!raw) return null;
        // Handle Candid variant object { admin: null } or string enum
        if (typeof raw === "object" && raw !== null) {
          if ("admin" in (raw as object)) return "admin";
          if ("guest" in (raw as object)) return "guest";
          return "user";
        }
        // String enum value
        return String(raw);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["userRole"] });
    },
  });
}

export function useStudentsForTeacher() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["studentsForTeacher"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStudentsForTeacher();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStudentsForParent() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["studentsForParent"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStudentsForParent();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStudent(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["student", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStudent(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEntriesForStudent(studentId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["entries", studentId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntriesForStudent(studentId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentInput) => {
      if (!actor) throw new Error("Not connected");
      return actor.createStudent(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studentsForTeacher"] }),
  });
}

export function useUpdateStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: StudentInput }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateStudent(id, input);
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["student", id.toString()] });
      qc.invalidateQueries({ queryKey: ["studentsForTeacher"] });
    },
  });
}

export function useDeleteStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteStudent(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studentsForTeacher"] }),
  });
}

export function useCreateHifzEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: HifzEntryInput & { studentId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createHifzEntry(input);
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({
        queryKey: ["entries", input.studentId.toString()],
      });
    },
  });
}

export function useUpdateHifzEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
      studentId: _studentId,
    }: { id: bigint; input: HifzEntryInput; studentId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateHifzEntry(id, input);
    },
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: ["entries", studentId.toString()] });
    },
  });
}

export function useDeleteHifzEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      studentId: _studentId,
    }: { entryId: bigint; studentId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteHifzEntry(entryId);
    },
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: ["entries", studentId.toString()] });
    },
  });
}

export function useLinkParent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      parentPrincipal,
    }: { studentId: bigint; parentPrincipal: Principal }) => {
      if (!actor) throw new Error("Not connected");
      return actor.linkParentToStudent(studentId, parentPrincipal);
    },
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: ["student", studentId.toString()] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignCallerUserRole(user, role);
    },
  });
}

export function useClaimTeacherAccount() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: { email: string; password: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.claimTeacherAccount(email, password);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["userRole"] });
    },
  });
}

export function useListTeacherCredentials() {
  const { actor, isFetching } = useActor();
  return useQuery<TeacherCredential[]>({
    queryKey: ["teacherCredentials"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTeacherCredentials();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTeacherCredential() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: { email: string; password: string; name: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createTeacherCredential(email, password, name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacherCredentials"] }),
  });
}

export function useDeleteTeacherCredential() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteTeacherCredential(email);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacherCredentials"] }),
  });
}

export function useResetTeacherPassword() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      newPassword,
    }: { email: string; newPassword: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.resetTeacherPassword(email, newPassword);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacherCredentials"] }),
  });
}

export function useAdminGetAllStudents() {
  const { actor, isFetching } = useActor();
  return useQuery<StudentWithTeacher[]>({
    queryKey: ["adminAllStudents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllStudents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminDeleteStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.adminDeleteStudent(studentId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAllStudents"] }),
  });
}

export function useAdminTransferStudent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      targetTeacherEmail,
    }: { studentId: bigint; targetTeacherEmail: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.adminTransferStudent(studentId, targetTeacherEmail);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminAllStudents"] }),
  });
}
