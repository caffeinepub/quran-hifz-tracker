import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Circle,
  ClipboardCopy,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { StudentInput, StudentWithTeacher } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { PhoneInput } from "../components/PhoneInput";
import {
  useAdminDeleteStudent,
  useAdminGetAllStudents,
  useAdminTransferStudent,
  useAdminUpdateStudent,
  useCreateStudent,
  useCreateTeacherCredential,
  useDeleteTeacherCredential,
  useListTeacherCredentials,
  useResetTeacherPassword,
} from "../hooks/useQueries";

type AdminSortField = "name" | "class" | "teacher" | null;
type AdminSortDir = "asc" | "desc";

interface Props {
  onSelectStudent: (id: bigint) => void;
}

export default function AdminDashboard({ onSelectStudent }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Admin Dashboard
            </h2>
            <p className="text-muted-foreground text-sm">
              Manage students and teacher accounts
            </p>
          </div>
        </div>

        <Tabs defaultValue="students">
          <TabsList className="mb-6">
            <TabsTrigger value="students" data-ocid="admin.tab">
              All Students
            </TabsTrigger>
            <TabsTrigger value="admin" data-ocid="admin.tab">
              Teacher Accounts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="students">
            <StudentsTab onSelectStudent={onSelectStudent} />
          </TabsContent>
          <TabsContent value="admin">
            <TeacherAccountsTab />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function StudentsTab({
  onSelectStudent,
}: { onSelectStudent: (id: bigint) => void }) {
  const { data: students, isLoading } = useAdminGetAllStudents();
  const { data: credentials } = useListTeacherCredentials();
  const { mutateAsync: createStudent, isPending: creating } =
    useCreateStudent();
  const { mutateAsync: deleteStudent, isPending: deleting } =
    useAdminDeleteStudent();
  const { mutateAsync: transferStudent, isPending: transferring } =
    useAdminTransferStudent();
  const { mutateAsync: updateStudent, isPending: updatingStudent } =
    useAdminUpdateStudent();

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<StudentWithTeacher | null>(
    null,
  );
  const [transferTarget, setTransferTarget] =
    useState<StudentWithTeacher | null>(null);
  const [selectedTeacherEmail, setSelectedTeacherEmail] = useState("");
  const [editTarget, setEditTarget] = useState<StudentWithTeacher | null>(null);
  const [editName, setEditName] = useState("");
  const [editClass, setEditClass] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");

  const [sortField, setSortField] = useState<AdminSortField>(null);
  const [sortDir, setSortDir] = useState<AdminSortDir>("asc");

  function handleSort(field: AdminSortField) {
    if (sortField === field) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortField(null);
        setSortDir("asc");
      }
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: AdminSortField }) {
    if (sortField !== field)
      return <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />;
    if (sortDir === "asc")
      return <ChevronUp className="w-3.5 h-3.5 text-primary" />;
    return <ChevronDown className="w-3.5 h-3.5 text-primary" />;
  }

  // Apply sort
  const sortedStudents =
    sortField && students
      ? [...students].sort((a, b) => {
          let valA = "";
          let valB = "";
          if (sortField === "name") {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
          } else if (sortField === "class") {
            valA = (a.studentClass || "").toLowerCase();
            valB = (b.studentClass || "").toLowerCase();
          } else if (sortField === "teacher") {
            valA = (a.teacherName || "").toLowerCase();
            valB = (b.teacherName || "").toLowerCase();
          }
          const cmp = valA.localeCompare(valB);
          return sortDir === "asc" ? cmp : -cmp;
        })
      : students;

  function resetForm() {
    setNewName("");
    setNewClass("");
    setNewSection("");
    setNewWhatsapp("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createStudent({
        name: newName.trim(),
        studentClass: newClass.trim(),
        section: newSection.trim(),
        parentWhatsapp: newWhatsapp.trim(),
      });
      toast.success("Student added successfully");
      resetForm();
      setAddOpen(false);
    } catch {
      toast.error("Failed to add student");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteStudent(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete student");
    }
  }

  async function handleTransfer() {
    if (!transferTarget || !selectedTeacherEmail) return;
    try {
      await transferStudent({
        studentId: transferTarget.id,
        targetTeacherEmail: selectedTeacherEmail,
      });
      toast.success(`${transferTarget.name} transferred successfully`);
      setTransferTarget(null);
      setSelectedTeacherEmail("");
    } catch {
      toast.error("Failed to transfer student");
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await updateStudent({
        id: editTarget.id,
        input: {
          name: editName.trim(),
          studentClass: editClass.trim(),
          section: editSection.trim(),
          parentWhatsapp: editWhatsapp.trim(),
        },
      });
      toast.success(`${editName} updated successfully`);
      setEditTarget(null);
    } catch {
      toast.error("Failed to update student");
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground text-sm">
          {students
            ? `${students.length} student${students.length !== 1 ? "s" : ""} across all teachers`
            : ""}
        </p>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-ocid="students.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Student
        </Button>
      </div>

      {isLoading ? (
        <div
          className="flex items-center justify-center py-24"
          data-ocid="students.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !students || students.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 text-center"
          data-ocid="students.empty_state"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-2">
            No students yet
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Students added by teachers will appear here
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="students.table">
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/60 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Student Name
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/60 transition-colors"
                  onClick={() => handleSort("class")}
                >
                  <div className="flex items-center gap-1">
                    Class / Section
                    <SortIcon field="class" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/60 transition-colors"
                  onClick={() => handleSort("teacher")}
                >
                  <div className="flex items-center gap-1">
                    Teacher
                    <SortIcon field="teacher" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sortedStudents ?? []).map((student, i) => (
                <motion.tr
                  key={student.id.toString()}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-0"
                  data-ocid={`students.item.${i + 1}`}
                >
                  <TableCell
                    className="font-medium cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onSelectStudent(student.id)}
                  >
                    {student.name}
                  </TableCell>
                  <TableCell>
                    {student.studentClass || student.section ? (
                      <Badge variant="outline" className="text-xs">
                        {student.studentClass}
                        {student.section ? ` - ${student.section}` : ""}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {student.teacherName || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {student.teacherEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditTarget(student);
                          setEditName(student.name);
                          setEditClass(student.studentClass);
                          setEditSection(student.section);
                          setEditWhatsapp(student.parentWhatsapp);
                        }}
                        disabled={updatingStudent}
                        data-ocid={`students.edit_button.${i + 1}`}
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTransferTarget(student);
                          setSelectedTeacherEmail("");
                        }}
                        disabled={transferring}
                        data-ocid={`students.transfer_button.${i + 1}`}
                      >
                        <ArrowRightLeft className="w-3 h-3 mr-1" /> Transfer
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget(student)}
                        disabled={deleting}
                        data-ocid={`students.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Student Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent data-ocid="students.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">Student Name</Label>
              <Input
                id="s-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ahmed Al-Rashid"
                autoFocus
                data-ocid="students.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="s-class">Class</Label>
                <Input
                  id="s-class"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  placeholder="e.g. Grade 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-section">Section</Label>
                <Input
                  id="s-section"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="e.g. A"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-whatsapp">Parent WhatsApp Number</Label>
              <PhoneInput
                id="s-whatsapp"
                value={newWhatsapp}
                onChange={(v) => setNewWhatsapp(v)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  resetForm();
                }}
                data-ocid="students.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-primary text-primary-foreground"
                data-ocid="students.submit_button"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
                  </>
                ) : (
                  "Add Student"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-edit-name">Student Name</Label>
              <Input
                id="admin-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Ahmed Al-Rashid"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="admin-edit-class">Class</Label>
                <Input
                  id="admin-edit-class"
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                  placeholder="e.g. Grade 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-edit-section">Section</Label>
                <Input
                  id="admin-edit-section"
                  value={editSection}
                  onChange={(e) => setEditSection(e.target.value)}
                  placeholder="e.g. A"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-edit-whatsapp">
                Parent WhatsApp Number
              </Label>
              <PhoneInput
                id="admin-edit-whatsapp"
                value={editWhatsapp}
                onChange={(v) => setEditWhatsapp(v)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingStudent}
                className="bg-primary text-primary-foreground"
              >
                {updatingStudent ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Student Dialog */}
      <Dialog
        open={!!transferTarget}
        onOpenChange={(open) => {
          if (!open) {
            setTransferTarget(null);
            setSelectedTeacherEmail("");
          }
        }}
      >
        <DialogContent data-ocid="students.modal">
          <DialogHeader>
            <DialogTitle className="font-display">Transfer Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Transfer <strong>{transferTarget?.name}</strong> to a different
              teacher:
            </p>
            <div className="space-y-2">
              <Label>Select New Teacher</Label>
              <Select
                value={selectedTeacherEmail}
                onValueChange={setSelectedTeacherEmail}
              >
                <SelectTrigger data-ocid="students.select">
                  <SelectValue placeholder="Choose a teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {(credentials ?? []).map((cred) => (
                    <SelectItem key={cred.email} value={cred.email}>
                      {cred.name} ({cred.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTransferTarget(null);
                setSelectedTeacherEmail("");
              }}
              data-ocid="students.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTransfer}
              disabled={transferring || !selectedTeacherEmail}
              className="bg-primary text-primary-foreground"
              data-ocid="students.confirm_button"
            >
              {transferring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Confirm Transfer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Student Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent data-ocid="students.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Delete Student</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name}</strong>? This will permanently remove
            the student and all their hifz records. This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="students.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              data-ocid="students.delete_button"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Student"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TeacherAccountsTab() {
  const { data: credentials, isLoading } = useListTeacherCredentials();
  const { mutateAsync: createCredential, isPending: creating } =
    useCreateTeacherCredential();
  const { mutateAsync: deleteCredential, isPending: deleting } =
    useDeleteTeacherCredential();
  const { mutateAsync: resetPassword, isPending: resetting } =
    useResetTeacherPassword();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirm, setNewConfirm] = useState("");
  const [createdCreds, setCreatedCreds] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPwd, setResetPwd] = useState("");

  const [deleteEmail, setDeleteEmail] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  function resetCreateForm() {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewConfirm("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword !== newConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await createCredential({
        email: newEmail.trim(),
        password: newPassword,
        name: newName.trim(),
      });
      setCreatedCreds({ email: newEmail.trim(), password: newPassword });
      toast.success("Teacher account created!");
      resetCreateForm();
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create teacher account");
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetPwd.trim()) {
      toast.error("Enter a new password");
      return;
    }
    try {
      await resetPassword({ email: resetEmail, newPassword: resetPwd });
      toast.success("Password reset successfully");
      setResetOpen(false);
      setResetEmail("");
      setResetPwd("");
    } catch {
      toast.error("Failed to reset password");
    }
  }

  async function handleDelete() {
    try {
      await deleteCredential(deleteEmail);
      toast.success("Teacher account deleted");
      setConfirmDeleteOpen(false);
      setDeleteEmail("");
    } catch {
      toast.error("Failed to delete account");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied to clipboard!"));
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground text-sm">
          {credentials
            ? `${credentials.length} teacher account${credentials.length !== 1 ? "s" : ""}`
            : ""}
        </p>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-ocid="admin.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Teacher Account
        </Button>
      </div>

      {/* Show last created credentials */}
      {createdCreds && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
          data-ocid="admin.success_state"
        >
          <p className="text-sm font-medium text-green-800 mb-2">
            ✅ Account created! Share these credentials with the teacher:
          </p>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <span className="font-mono">Email: {createdCreds.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700 mt-1">
            <span className="font-mono">Password: {createdCreds.password}</span>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  `Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`,
                )
              }
              className="ml-2 text-green-600 hover:text-green-800"
            >
              <ClipboardCopy className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            className="mt-2 text-xs text-green-600 underline"
            onClick={() => setCreatedCreds(null)}
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {isLoading ? (
        <div
          className="flex items-center justify-center py-24"
          data-ocid="admin.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : credentials && credentials.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 text-center"
          data-ocid="admin.empty_state"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-2">
            No teacher accounts yet
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create accounts for teachers so they can log in
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Teacher Account
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="admin.table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(credentials ?? []).map((cred, i) => (
                <TableRow key={cred.email} data-ocid={`admin.row.${i + 1}`}>
                  <TableCell className="font-medium">{cred.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cred.email}
                  </TableCell>
                  <TableCell>
                    {cred.claimedBy ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Claimed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Circle className="w-3 h-3" /> Not Claimed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResetEmail(cred.email);
                          setResetOpen(true);
                        }}
                        disabled={resetting}
                        data-ocid={`admin.edit_button.${i + 1}`}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Reset
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setDeleteEmail(cred.email);
                          setConfirmDeleteOpen(true);
                        }}
                        disabled={deleting}
                        data-ocid={`admin.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Account Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent data-ocid="admin.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Create Teacher Account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-name">Teacher Name</Label>
              <Input
                id="t-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ustadh Abdullah"
                autoFocus
                data-ocid="admin.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-email">Email</Label>
              <Input
                id="t-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="teacher@school.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-password">Password</Label>
              <Input
                id="t-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-confirm">Confirm Password</Label>
              <Input
                id="t-confirm"
                type="password"
                value={newConfirm}
                onChange={(e) => setNewConfirm(e.target.value)}
                placeholder="Repeat password"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  resetCreateForm();
                }}
                data-ocid="admin.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-primary text-primary-foreground"
                data-ocid="admin.submit_button"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent data-ocid="admin.sheet">
          <DialogHeader>
            <DialogTitle className="font-display">Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Resetting password for: <strong>{resetEmail}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-pwd">New Password</Label>
              <Input
                id="new-pwd"
                type="password"
                value={resetPwd}
                onChange={(e) => setResetPwd(e.target.value)}
                placeholder="New password"
                autoFocus
                data-ocid="admin.input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetOpen(false)}
                data-ocid="admin.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={resetting}
                className="bg-primary text-primary-foreground"
                data-ocid="admin.confirm_button"
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent data-ocid="admin.modal">
          <DialogHeader>
            <DialogTitle className="font-display">
              Delete Teacher Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the account for{" "}
            <strong>{deleteEmail}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              data-ocid="admin.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              data-ocid="admin.confirm_button"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
