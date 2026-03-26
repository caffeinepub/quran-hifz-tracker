import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import type { HifzEntry, Student } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HifzEntryTable from "../components/HifzEntryTable";
import {
  useEntriesForStudent,
  useStudentsForParent,
} from "../hooks/useQueries";

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
];

const SAMPLE_ENTRIES: HifzEntry[] = [
  {
    id: 1n,
    studentId: 1n,
    date: "2026-03-24",
    createdAt: BigInt(Date.now()),
    jadeedSurah: "Al-Baqarah",
    jadeedAyatFrom: 1n,
    jadeedAyatTo: 10n,
    murajaatDetails: "Juz 30 full review",
    juzHaaliMark: "A",
    notes: "Excellent recitation",
  },
  {
    id: 2n,
    studentId: 1n,
    date: "2026-03-23",
    createdAt: BigInt(Date.now()),
    jadeedSurah: "Al-Baqarah",
    jadeedAyatFrom: 11n,
    jadeedAyatTo: 20n,
    murajaatDetails: "Surah Al-Mulk review",
    juzHaaliMark: "B+",
    notes: "",
  },
];

function StudentCard({
  student,
  isSample,
}: { student: Student; isSample: boolean }) {
  const { data: entries, isLoading } = useEntriesForStudent(student.id);
  const displayEntries =
    entries && entries.length > 0 ? entries : isSample ? SAMPLE_ENTRIES : [];

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-base">
                {student.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {student.studentClass &&
                  `${student.studentClass}${student.section ? ` - ${student.section}` : ""} · `}
                {displayEntries.length} entries recorded
              </p>
            </div>
          </div>
          {isSample && (
            <Badge variant="secondary" className="text-xs">
              Sample
            </Badge>
          )}
          {displayEntries[0] && (
            <div className="text-right">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                Latest: {displayEntries[0].juzHaaliMark}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div
            className="flex justify-center py-6"
            data-ocid="entries.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <HifzEntryTable
            entries={displayEntries}
            readOnly
            isSample={isSample}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function ParentDashboard() {
  const { data: studentsRaw, isLoading } = useStudentsForParent();
  const students =
    studentsRaw && studentsRaw.length > 0 ? studentsRaw : SAMPLE_STUDENTS;
  const isSample = !studentsRaw || studentsRaw.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Progress Reports
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            {isSample
              ? "Sample data — your teacher will link your child's account"
              : "Your child's daily hifz progress"}
          </p>
        </div>

        {isLoading ? (
          <div
            className="flex items-center justify-center py-24"
            data-ocid="parent.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : students.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 text-center"
            data-ocid="parent.empty_state"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">
              No students linked yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Ask your child's teacher to link your account using your Principal
              ID
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {students.map((student, i) => (
              <motion.div
                key={student.id.toString()}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                data-ocid={`parent.item.${i + 1}`}
              >
                <StudentCard student={student} isSample={isSample} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
