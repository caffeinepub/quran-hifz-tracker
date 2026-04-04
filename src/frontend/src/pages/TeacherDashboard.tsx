import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Loader2,
  Pencil,
  Plus,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Student } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { PhoneInput } from "../components/PhoneInput";
import {
  useCreateStudent,
  useStudentsForTeacher,
  useUpdateStudent,
} from "../hooks/useQueries";

// Sample data shown when no real data exists
const SAMPLE_STUDENTS: Student[] = [
  {
    id: 1n,
    name: "Ahmed Al-Rashid",
    studentClass: "Grade 5",
    section: "A",
    parentWhatsapp: "+92300000001",
    createdAt: BigInt(Date.now()),
    teacherId: "sample" as any,
  },
  {
    id: 2n,
    name: "Fatima Hassan",
    studentClass: "Grade 4",
    section: "B",
    parentWhatsapp: "+92300000002",
    createdAt: BigInt(Date.now()),
    teacherId: "sample" as any,
  },
  {
    id: 3n,
    name: "Yusuf Ibrahim",
    studentClass: "Grade 6",
    section: "A",
    parentWhatsapp: "+92300000003",
    createdAt: BigInt(Date.now()),
    teacherId: "sample" as any,
  },
  {
    id: 4n,
    name: "Maryam Khalid",
    studentClass: "Grade 3",
    section: "C",
    parentWhatsapp: "+92300000004",
    createdAt: BigInt(Date.now()),
    teacherId: "sample" as any,
  },
  {
    id: 5n,
    name: "Omar Abdullah",
    studentClass: "Grade 5",
    section: "B",
    parentWhatsapp: "+92300000005",
    createdAt: BigInt(Date.now()),
    teacherId: "sample" as any,
  },
];

type SortField = "name" | "class" | null;
type SortDir = "asc" | "desc";

interface Props {
  onSelectStudent: (id: bigint) => void;
}

export default function TeacherDashboard({ onSelectStudent }: Props) {
  const { data: studentsRaw, isLoading } = useStudentsForTeacher();
  const { mutateAsync: createStudent, isPending: creating } =
    useCreateStudent();
  const { mutateAsync: updateStudent, isPending: updating } =
    useUpdateStudent();

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editClass, setEditClass] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const rawStudents =
    studentsRaw && studentsRaw.length > 0 ? studentsRaw : SAMPLE_STUDENTS;
  const isSample = !studentsRaw || studentsRaw.length === 0;

  // Apply sort
  const students = sortField
    ? [...rawStudents].sort((a, b) => {
        let valA = "";
        let valB = "";
        if (sortField === "name") {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortField === "class") {
          valA = (a.studentClass || "").toLowerCase();
          valB = (b.studentClass || "").toLowerCase();
        }
        const cmp = valA.localeCompare(valB);
        return sortDir === "asc" ? cmp : -cmp;
      })
    : rawStudents;

  function handleSort(field: SortField) {
    if (sortField === field) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        // desc → clear
        setSortField(null);
        setSortDir("asc");
      }
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />;
    if (sortDir === "asc")
      return <ChevronUp className="w-3.5 h-3.5 text-primary" />;
    return <ChevronDown className="w-3.5 h-3.5 text-primary" />;
  }

  function resetForm() {
    setNewName("");
    setNewClass("");
    setNewSection("");
    setNewWhatsapp("");
  }

  function openEdit(student: Student, e: React.MouseEvent) {
    e.stopPropagation();
    setEditStudent(student);
    setEditName(student.name);
    setEditClass(student.studentClass);
    setEditSection(student.section);
    setEditWhatsapp(student.parentWhatsapp);
    setEditOpen(true);
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

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editStudent || !editName.trim()) return;
    try {
      await updateStudent({
        id: editStudent.id,
        input: {
          name: editName.trim(),
          studentClass: editClass.trim(),
          section: editSection.trim(),
          parentWhatsapp: editWhatsapp.trim(),
        },
      });
      toast.success("Student updated successfully");
      setEditOpen(false);
      setEditStudent(null);
    } catch {
      toast.error("Failed to update student");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              My Students
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {isSample
                ? "Sample data — add real students to get started"
                : `${students.length} student${students.length !== 1 ? "s" : ""} enrolled`}
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-ocid="students.open_modal_button"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Student
          </Button>
        </div>

        {/* Sort bar */}
        {!isLoading && students.length > 0 && (
          <div
            className="flex items-center gap-2 mb-5"
            data-ocid="students.panel"
          >
            <span className="text-xs text-muted-foreground font-medium mr-1">
              Sort by:
            </span>
            <button
              type="button"
              onClick={() => handleSort("name")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors select-none cursor-pointer ${
                sortField === "name"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/50"
              }`}
              data-ocid="students.toggle"
            >
              Name
              <SortIcon field="name" />
            </button>
            <button
              type="button"
              onClick={() => handleSort("class")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors select-none cursor-pointer ${
                sortField === "class"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/50"
              }`}
              data-ocid="students.toggle"
            >
              Class
              <SortIcon field="class" />
            </button>
            {sortField && (
              <button
                type="button"
                onClick={() => {
                  setSortField(null);
                  setSortDir("asc");
                }}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div
            className="flex items-center justify-center py-24"
            data-ocid="students.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student, i) => (
              <motion.div
                key={student.id.toString()}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`students.item.${i + 1}`}
              >
                <Card
                  className="cursor-pointer border border-border hover:border-primary/40 hover:shadow-card transition-all group"
                  onClick={() => !isSample && onSelectStudent(student.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-2">
                        {isSample ? (
                          <Badge variant="secondary" className="text-xs">
                            Sample
                          </Badge>
                        ) : (
                          student.studentClass && (
                            <Badge variant="outline" className="text-xs">
                              {student.studentClass}
                              {student.section ? ` - ${student.section}` : ""}
                            </Badge>
                          )
                        )}
                        {!isSample && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={(e) => openEdit(student, e)}
                            title="Edit student"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {student.name}
                    </h3>
                    {student.parentWhatsapp && (
                      <p className="text-xs text-muted-foreground mb-1">
                        WhatsApp: {student.parentWhatsapp}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <CalendarDays className="w-3 h-3" />
                      <span>
                        Enrolled{" "}
                        {new Date(
                          Number(student.createdAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-primary text-xs font-medium">
                      <BookOpen className="w-3 h-3" />
                      <span>View entries →</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && students.length === 0 && (
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
              Add your first student to start tracking hifz
            </p>
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          </div>
        )}
      </main>

      <Footer />

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
              <Label htmlFor="student-name">Student Name</Label>
              <Input
                id="student-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ahmed Al-Rashid"
                autoFocus
                data-ocid="students.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="student-class">Class</Label>
                <Input
                  id="student-class"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  placeholder="e.g. Grade 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-section">Section</Label>
                <Input
                  id="student-section"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="e.g. A"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-whatsapp">Parent WhatsApp Number</Label>
              <PhoneInput
                id="parent-whatsapp"
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Student Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Ahmed Al-Rashid"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-class">Class</Label>
                <Input
                  id="edit-class"
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                  placeholder="e.g. Grade 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section</Label>
                <Input
                  id="edit-section"
                  value={editSection}
                  onChange={(e) => setEditSection(e.target.value)}
                  placeholder="e.g. A"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-whatsapp">Parent WhatsApp Number</Label>
              <PhoneInput
                id="edit-whatsapp"
                value={editWhatsapp}
                onChange={(v) => setEditWhatsapp(v)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updating}
                className="bg-primary text-primary-foreground"
              >
                {updating ? (
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
    </div>
  );
}
