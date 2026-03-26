import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  HifzEntryInput,
  StudentInput,
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
        return await actor.getCallerUserProfile();
      } catch {
        // New users without a role will get an error; treat as no profile
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
        return await actor.getCallerUserRole();
      } catch {
        // New users without a role will get an error; treat as no role
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
