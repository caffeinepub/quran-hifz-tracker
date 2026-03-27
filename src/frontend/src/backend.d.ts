import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface HifzEntryInput {
    jadeedAyatTo: bigint;
    date: string;
    juzHaaliMark: string;
    notes?: string;
    jadeedSurah: string;
    jadeedAyatFrom: bigint;
    murajaatDetails: string;
}
export type Time = bigint;
export interface HifzEntry {
    id: bigint;
    studentId: bigint;
    jadeedAyatTo: bigint;
    date: string;
    createdAt: Time;
    juzHaaliMark: string;
    notes?: string;
    jadeedSurah: string;
    jadeedAyatFrom: bigint;
    murajaatDetails: string;
}
export interface UserProfile {
    name: string;
    role: string;
    email: string;
}
export interface TeacherCredential {
    email: string;
    password: string;
    name: string;
    claimedBy?: Principal;
}
export interface Student {
    id: bigint;
    name: string;
    studentClass: string;
    section: string;
    parentWhatsapp: string;
    createdAt: Time;
    parentUserId?: Principal;
    teacherId: Principal;
}
export interface StudentWithTeacher {
    id: bigint;
    name: string;
    studentClass: string;
    section: string;
    parentWhatsapp: string;
    createdAt: Time;
    parentUserId?: Principal;
    teacherId: Principal;
    teacherEmail: string;
    teacherName: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface StudentInput {
    name: string;
    studentClass: string;
    section: string;
    parentWhatsapp: string;
}
export interface backendInterface {
    adminDeleteStudent(studentId: bigint): Promise<void>;
    adminGetAllStudents(): Promise<Array<StudentWithTeacher>>;
    adminTransferStudent(studentId: bigint, targetTeacherEmail: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimTeacherAccount(email: string, password: string): Promise<void>;
    createHifzEntry(input: {
        studentId: bigint;
        jadeedAyatTo: bigint;
        date: string;
        juzHaaliMark: string;
        notes?: string;
        jadeedSurah: string;
        jadeedAyatFrom: bigint;
        murajaatDetails: string;
    }): Promise<bigint>;
    createStudent(input: StudentInput): Promise<bigint>;
    createTeacherCredential(email: string, password: string, name: string): Promise<void>;
    deleteHifzEntry(entryId: bigint): Promise<void>;
    deleteStudent(studentId: bigint): Promise<void>;
    deleteTeacherCredential(email: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEntriesForStudent(studentId: bigint): Promise<Array<HifzEntry>>;
    getHifzEntry(entryId: bigint): Promise<HifzEntry | null>;
    getStudent(studentId: bigint): Promise<Student | null>;
    getStudentsForParent(): Promise<Array<Student>>;
    getStudentsForTeacher(): Promise<Array<Student>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    linkParentToStudent(studentId: bigint, parentUserId: Principal): Promise<void>;
    listTeacherCredentials(): Promise<Array<TeacherCredential>>;
    resetTeacherPassword(email: string, newPassword: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateHifzEntry(entryId: bigint, input: HifzEntryInput): Promise<void>;
    updateStudent(studentId: bigint, input: StudentInput): Promise<void>;
}
