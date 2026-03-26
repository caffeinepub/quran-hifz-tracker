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
import { BookOpen, CalendarDays, Loader2, Plus, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Student } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useCreateStudent, useStudentsForTeacher } from "../hooks/useQueries";

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

interface Props {
  onSelectStudent: (id: bigint) => void;
}

export default function TeacherDashboard({ onSelectStudent }: Props) {
  const { data: studentsRaw, isLoading } = useStudentsForTeacher();
  const { mutateAsync: createStudent, isPending: creating } =
    useCreateStudent();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");

  const students =
    studentsRaw && studentsRaw.length > 0 ? studentsRaw : SAMPLE_STUDENTS;
  const isSample = !studentsRaw || studentsRaw.length === 0;

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
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
              <Input
                id="parent-whatsapp"
                value={newWhatsapp}
                onChange={(e) => setNewWhatsapp(e.target.value)}
                placeholder="e.g. +923001234567"
                type="tel"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g. +92 for Pakistan)
              </p>
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
    </div>
  );
}
