import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Principal } from "@icp-sdk/core/principal";
import {
  Check,
  Download,
  Edit2,
  Link2,
  Loader2,
  MessageCircle,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { HifzEntry } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HifzEntryForm from "../components/HifzEntryForm";
import HifzEntryTable from "../components/HifzEntryTable";
import {
  useDeleteHifzEntry,
  useEntriesForStudent,
  useLinkParent,
  useStudent,
  useUpdateStudent,
} from "../hooks/useQueries";

// Sample data for demo
const SAMPLE_ENTRIES: HifzEntry[] = [
  {
    id: 1n,
    studentId: 1n,
    date: "2026-03-24",
    createdAt: BigInt(Date.now()),
    jadeedSurah: "Al-Baqarah",
    jadeedAyatFrom: 1n,
    jadeedAyatTo: 10n,
    murajaatDetails: "Juz 30||Present",
    juzHaaliMark: "A",
    notes: "Excellent recitation, strong tajweed",
  },
  {
    id: 2n,
    studentId: 1n,
    date: "2026-03-23",
    createdAt: BigInt(Date.now()),
    jadeedSurah: "Al-Baqarah",
    jadeedAyatFrom: 11n,
    jadeedAyatTo: 20n,
    murajaatDetails: "Juz 15|8|Present",
    juzHaaliMark: "B+",
    notes: "",
  },
  {
    id: 3n,
    studentId: 1n,
    date: "2026-03-22",
    createdAt: BigInt(Date.now()),
    jadeedSurah: "Al-Fatihah",
    jadeedAyatFrom: 1n,
    jadeedAyatTo: 7n,
    murajaatDetails: "||Uzur",
    juzHaaliMark: "A+",
    notes: "Memorized perfectly, smooth flow",
  },
];

interface Props {
  studentId: bigint;
  onBack: () => void;
}

function buildWhatsAppMessage(studentName: string, entry: HifzEntry): string {
  const parts = entry.murajaatDetails?.split("|");
  const juz = parts?.[0]?.trim() || "";
  const marks = parts?.[1]?.trim() || "";
  const attendance = parts?.[2]?.trim() || "";

  const lines = [
    "Assalam o Alaikum,",
    "",
    `Daily Hifz update for *${studentName}* (${entry.date}):`,
    "",
  ];

  if (attendance) {
    lines.push(`*Attendance:* ${attendance}`);
  }

  lines.push(
    `*Jadeed Hifz:* ${entry.jadeedSurah} (Ayat ${entry.jadeedAyatFrom}\u2013${entry.jadeedAyatTo})`,
  );

  if (juz) {
    const murajaatLine = marks
      ? `*Muraja'at:* ${juz} (Marks: ${marks})`
      : `*Muraja'at:* ${juz}`;
    lines.push(murajaatLine);
  }

  lines.push(`*Juz Haali Mark:* ${entry.juzHaaliMark}`);

  if (entry.notes) lines.push(`*Notes:* ${entry.notes}`);
  return lines.join("\n");
}

export default function StudentDetail({ studentId, onBack }: Props) {
  const { data: student, isLoading: studentLoading } = useStudent(studentId);
  const { data: entriesRaw, isLoading: entriesLoading } =
    useEntriesForStudent(studentId);
  const { mutateAsync: updateStudent, isPending: updatingStudent } =
    useUpdateStudent();
  const { mutateAsync: linkParent, isPending: linkingParent } = useLinkParent();
  const { mutateAsync: deleteEntry } = useDeleteHifzEntry();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [parentInput, setParentInput] = useState("");
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HifzEntry | null>(null);

  const entries =
    entriesRaw && entriesRaw.length > 0 ? entriesRaw : SAMPLE_ENTRIES;
  const isSample = !entriesRaw || entriesRaw.length === 0;

  async function handleSaveName() {
    if (!nameInput.trim() || !student) return;
    try {
      await updateStudent({
        id: student.id,
        input: {
          name: nameInput.trim(),
          studentClass: student.studentClass,
          section: student.section,
          parentWhatsapp: student.parentWhatsapp,
        },
      });
      toast.success("Name updated");
      setEditingName(false);
    } catch {
      toast.error("Failed to update name");
    }
  }

  async function handleLinkParent(e: React.FormEvent) {
    e.preventDefault();
    if (!parentInput.trim() || !student) return;
    try {
      const principal = Principal.fromText(parentInput.trim());
      await linkParent({ studentId: student.id, parentPrincipal: principal });
      toast.success("Parent linked successfully");
      setParentInput("");
    } catch {
      toast.error("Invalid principal ID or failed to link");
    }
  }

  async function handleDeleteEntry(entry: HifzEntry) {
    try {
      await deleteEntry({ entryId: entry.id, studentId: studentId });
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  function handleSendWhatsApp(entry: HifzEntry) {
    const whatsapp = student?.parentWhatsapp?.replace(/[^\d+]/g, "");
    if (!whatsapp) {
      toast.error("No WhatsApp number saved for this student's parent");
      return;
    }
    const message = buildWhatsAppMessage(student?.name || "Student", entry);
    const url = `https://wa.me/${whatsapp.replace("+", "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  function handleDownloadReport() {
    const rows = entries.map((entry) => {
      const parts = entry.murajaatDetails?.split("|") || [];
      return {
        Date: entry.date,
        "Jadeed Surah": entry.jadeedSurah,
        "Ayat From": Number(entry.jadeedAyatFrom),
        "Ayat To": Number(entry.jadeedAyatTo),
        "Murajaat Juz": parts[0]?.trim() || "",
        "Murajaat Marks": parts[1]?.trim() || "",
        Attendance: parts[2]?.trim() || "",
        "Juz Haali Mark": entry.juzHaaliMark,
        Notes: entry.notes,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hifz Report");
    XLSX.writeFile(wb, `${displayName}_hifz_report.xlsx`);
  }

  if (studentLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onBack={onBack} backLabel="All Students" />
        <main
          className="flex-1 flex items-center justify-center"
          data-ocid="student.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  const displayName = student?.name || "Student";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onBack={onBack} backLabel="All Students" />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Student name header */}
        <div className="flex items-center gap-4 flex-wrap">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-9 text-lg font-display font-bold w-60"
                autoFocus
                data-ocid="student.input"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveName}
                disabled={updatingStudent}
                data-ocid="student.save_button"
              >
                {updatingStudent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingName(false)}
                data-ocid="student.cancel_button"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {displayName}
              </h2>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-primary"
                onClick={() => {
                  setNameInput(displayName);
                  setEditingName(true);
                }}
                data-ocid="student.edit_button"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          {student?.studentClass && (
            <Badge variant="outline">
              {student.studentClass}
              {student.section ? ` - ${student.section}` : ""}
            </Badge>
          )}
          {isSample && <Badge variant="secondary">Sample Data</Badge>}
        </div>

        {/* Parent WhatsApp info */}
        {student?.parentWhatsapp && (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Parent WhatsApp
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                {student.parentWhatsapp}
              </p>
            </div>
            {entries[0] && (
              <Button
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-400 shrink-0"
                onClick={() => handleSendWhatsApp(entries[0])}
              >
                Send Today's Update
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Link parent card */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" /> Link Parent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student?.parentUserId && (
                <div className="mb-3 p-2 bg-secondary rounded text-secondary-foreground text-xs font-mono break-all">
                  {student.parentUserId.toString()}
                </div>
              )}
              <form onSubmit={handleLinkParent} className="space-y-2">
                <Label htmlFor="parent-id" className="text-xs">
                  Parent Principal ID
                </Label>
                <Input
                  id="parent-id"
                  value={parentInput}
                  onChange={(e) => setParentInput(e.target.value)}
                  placeholder="xxxx-xxxxx-..."
                  className="h-8 text-xs font-mono"
                  data-ocid="student.input"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full bg-primary text-primary-foreground text-xs"
                  disabled={linkingParent}
                  data-ocid="student.submit_button"
                >
                  {linkingParent ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  {student?.parentUserId ? "Update Parent" : "Link Parent"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Entries summary */}
          <div className="md:col-span-2 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="font-display text-2xl font-bold text-primary">
                    {entries.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total Entries
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="font-display text-2xl font-bold text-primary">
                    {entries[0]?.jadeedSurah?.split(" ")[0] || "\u2014"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current Surah
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="font-display text-2xl font-bold text-primary">
                    {entries[0]?.juzHaaliMark || "\u2014"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Latest Mark
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Entries table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Hifz Entries
            </h3>
            <div className="flex items-center gap-2">
              {!isSample && entries.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleDownloadReport}
                  data-ocid="entries.download_button"
                >
                  <Download className="w-4 h-4 mr-2" /> Download Report
                </Button>
              )}
              <Button
                onClick={() => {
                  setEditingEntry(null);
                  setEntryFormOpen(true);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-ocid="entries.open_modal_button"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Entry
              </Button>
            </div>
          </div>

          {entriesLoading ? (
            <div
              className="flex items-center justify-center py-12"
              data-ocid="entries.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <HifzEntryTable
              entries={entries}
              isSample={isSample}
              onEdit={(entry) => {
                setEditingEntry(entry);
                setEntryFormOpen(true);
              }}
              onDelete={handleDeleteEntry}
              onSendWhatsApp={
                student?.parentWhatsapp ? handleSendWhatsApp : undefined
              }
            />
          )}
        </div>
      </main>

      <Footer />

      {entryFormOpen && (
        <HifzEntryForm
          studentId={studentId}
          entry={editingEntry}
          onClose={() => {
            setEntryFormOpen(false);
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}
