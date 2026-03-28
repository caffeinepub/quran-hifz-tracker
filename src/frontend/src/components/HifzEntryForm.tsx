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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Loader2, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { HifzEntry } from "../backend.d";
import { useCreateHifzEntry, useUpdateHifzEntry } from "../hooks/useQueries";

const SURAHS = [
  "Al-Fatihah",
  "Al-Baqarah",
  "Ali 'Imran",
  "An-Nisa",
  "Al-Ma'idah",
  "Al-An'am",
  "Al-A'raf",
  "Al-Anfal",
  "At-Tawbah",
  "Yunus",
  "Hud",
  "Yusuf",
  "Ar-Ra'd",
  "Ibrahim",
  "Al-Hijr",
  "An-Nahl",
  "Al-Isra",
  "Al-Kahf",
  "Maryam",
  "Ta-Ha",
  "Al-Anbiya",
  "Al-Hajj",
  "Al-Mu'minun",
  "An-Nur",
  "Al-Furqan",
  "Ash-Shu'ara",
  "An-Naml",
  "Al-Qasas",
  "Al-Ankabut",
  "Ar-Rum",
  "Luqman",
  "As-Sajdah",
  "Al-Ahzab",
  "Saba",
  "Fatir",
  "Ya-Sin",
  "As-Saffat",
  "Sad",
  "Az-Zumar",
  "Ghafir",
  "Fussilat",
  "Ash-Shura",
  "Az-Zukhruf",
  "Ad-Dukhan",
  "Al-Jathiyah",
  "Al-Ahqaf",
  "Muhammad",
  "Al-Fath",
  "Al-Hujurat",
  "Qaf",
  "Adh-Dhariyat",
  "At-Tur",
  "An-Najm",
  "Al-Qamar",
  "Ar-Rahman",
  "Al-Waqi'ah",
  "Al-Hadid",
  "Al-Mujadila",
  "Al-Hashr",
  "Al-Mumtahanah",
  "As-Saf",
  "Al-Jumu'ah",
  "Al-Munafiqun",
  "At-Taghabun",
  "At-Talaq",
  "At-Tahrim",
  "Al-Mulk",
  "Al-Qalam",
  "Al-Haqqah",
  "Al-Ma'arij",
  "Nuh",
  "Al-Jinn",
  "Al-Muzzammil",
  "Al-Muddaththir",
  "Al-Qiyamah",
  "Al-Insan",
  "Al-Mursalat",
  "An-Naba",
  "An-Nazi'at",
  "Abasa",
  "At-Takwir",
  "Al-Infitar",
  "Al-Mutaffifin",
  "Al-Inshiqaq",
  "Al-Buruj",
  "At-Tariq",
  "Al-A'la",
  "Al-Ghashiyah",
  "Al-Fajr",
  "Al-Balad",
  "Ash-Shams",
  "Al-Layl",
  "Ad-Duha",
  "Ash-Sharh",
  "At-Tin",
  "Al-Alaq",
  "Al-Qadr",
  "Al-Bayyinah",
  "Az-Zalzalah",
  "Al-Adiyat",
  "Al-Qari'ah",
  "At-Takathur",
  "Al-Asr",
  "Al-Humazah",
  "Al-Fil",
  "Quraysh",
  "Al-Ma'un",
  "Al-Kawthar",
  "Al-Kafirun",
  "An-Nasr",
  "Al-Masad",
  "Al-Ikhlas",
  "Al-Falaq",
  "An-Nas",
];

const JUZ_LIST = Array.from({ length: 30 }, (_, i) => i + 1);

const ATTENDANCE_OPTIONS = [
  {
    value: "Present",
    label: "Present",
    selected:
      "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300",
  },
  {
    value: "Absent",
    label: "Absent",
    selected:
      "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/40 dark:border-red-500 dark:text-red-300",
  },
  {
    value: "Not Prepared",
    label: "Not Prepared",
    selected:
      "bg-orange-100 border-orange-500 text-orange-800 dark:bg-orange-900/40 dark:border-orange-500 dark:text-orange-300",
  },
  {
    value: "Uzur",
    label: "Uzur",
    selected:
      "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-300",
  },
];

interface Props {
  studentId: bigint;
  entry?: HifzEntry | null;
  onClose: () => void;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// Format: juz|marks|attendance|targetJuz|targetPagesFrom|targetPagesTo
function parseMurajaat(
  raw: string,
): [string, string, string, string, string, string] {
  const parts = raw.split("|");
  return [
    parts[0] || "",
    parts[1] || "",
    parts[2] || "",
    parts[3] || "",
    parts[4] || "",
    parts[5] || "",
  ];
}

export default function HifzEntryForm({ studentId, entry, onClose }: Props) {
  const isEdit = !!entry;
  const { mutateAsync: createEntry, isPending: creating } =
    useCreateHifzEntry();
  const { mutateAsync: updateEntry, isPending: updating } =
    useUpdateHifzEntry();
  const isPending = creating || updating;

  const parsed = parseMurajaat(entry?.murajaatDetails || "");

  const [attendance, setAttendance] = useState(() => parsed[2]);
  const [date, setDate] = useState(entry?.date || today());
  const [jadeedSurah, setJadeedSurah] = useState(entry?.jadeedSurah || "");
  const [surahPickerOpen, setSurahPickerOpen] = useState(false);
  const [juzPickerOpen, setJuzPickerOpen] = useState(false);
  const [targetJuzPickerOpen, setTargetJuzPickerOpen] = useState(false);
  const [ayatFrom, setAyatFrom] = useState(
    entry?.jadeedAyatFrom ? entry.jadeedAyatFrom.toString() : "",
  );
  const [ayatTo, setAyatTo] = useState(
    entry?.jadeedAyatTo ? entry.jadeedAyatTo.toString() : "",
  );

  const [murajaatJuz, setMurajaatJuz] = useState(() => parsed[0]);
  const [murajaatMarks, setMurajaatMarks] = useState(() => parsed[1]);

  // Murajaat Target fields
  const [targetJuz, setTargetJuz] = useState(() => parsed[3]);
  const [targetPagesFrom, setTargetPagesFrom] = useState(() => parsed[4]);
  const [targetPagesTo, setTargetPagesTo] = useState(() => parsed[5]);

  const [mark, setMark] = useState(entry?.juzHaaliMark || "");
  const [notes, setNotes] = useState(entry?.notes || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attendance) {
      toast.error("Please select attendance status");
      return;
    }
    if (!date) {
      toast.error("Please enter the date");
      return;
    }

    const murajaatDetails = `${murajaatJuz}|${murajaatMarks}|${attendance}|${targetJuz}|${targetPagesFrom}|${targetPagesTo}`;

    const input = {
      studentId,
      date,
      jadeedSurah: jadeedSurah.trim(),
      jadeedAyatFrom: BigInt(ayatFrom || "0"),
      jadeedAyatTo: BigInt(ayatTo || "0"),
      murajaatDetails,
      juzHaaliMark: mark.trim(),
      notes: notes.trim() || undefined,
    };

    try {
      if (isEdit && entry) {
        await updateEntry({ id: entry.id, input, studentId });
        toast.success("Entry updated");
      } else {
        await createEntry(input);
        toast.success("Entry added");
      }
      onClose();
    } catch {
      toast.error("Failed to save entry");
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" data-ocid="entries.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit Hifz Entry" : "Add Hifz Entry"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Attendance Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Attendance Status <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {ATTENDANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAttendance(opt.value)}
                  data-ocid="entries.toggle"
                  className={`py-2 px-1 rounded-md text-xs font-semibold border-2 transition-all text-center ${
                    attendance === opt.value
                      ? opt.selected
                      : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {!attendance && (
              <p className="text-xs text-muted-foreground">
                Please select one option above
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="entry-date" className="text-sm">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="entry-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9"
                data-ocid="entries.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="juz-mark" className="text-sm">
                Juz Haali Mark
              </Label>
              <Input
                id="juz-mark"
                value={mark}
                onChange={(e) => setMark(e.target.value)}
                placeholder="e.g. A, B+, 85%"
                className="h-9"
                data-ocid="entries.input"
              />
            </div>
          </div>

          {/* Jadeed Surah Picker */}
          <div className="space-y-1.5">
            <Label className="text-sm">Jadeed Surah</Label>
            <Popover open={surahPickerOpen} onOpenChange={setSurahPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 justify-between font-normal"
                  data-ocid="entries.select"
                >
                  <span className={jadeedSurah ? "" : "text-muted-foreground"}>
                    {jadeedSurah
                      ? `${SURAHS.indexOf(jadeedSurah) + 1}. ${jadeedSurah}`
                      : "Select Surah"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(480px,calc(100vw-2rem))] p-2"
                align="start"
                sideOffset={4}
              >
                <div
                  className="max-h-64 overflow-y-auto overscroll-contain"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  style={{
                    WebkitOverflowScrolling: "touch",
                    touchAction: "pan-y",
                    overflowY: "auto",
                  }}
                >
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                    {SURAHS.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setJadeedSurah(s);
                          setSurahPickerOpen(false);
                        }}
                        className={`text-left px-2 py-1.5 rounded text-xs leading-tight hover:bg-accent hover:text-accent-foreground transition-colors ${
                          jadeedSurah === s
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                      >
                        <span className="font-semibold opacity-60">
                          {i + 1}.
                        </span>{" "}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ayat-from" className="text-sm">
                Ayat From
              </Label>
              <Input
                id="ayat-from"
                type="number"
                min="1"
                value={ayatFrom}
                onChange={(e) => setAyatFrom(e.target.value)}
                placeholder="1"
                className="h-9"
                data-ocid="entries.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ayat-to" className="text-sm">
                Ayat To
              </Label>
              <Input
                id="ayat-to"
                type="number"
                min="1"
                value={ayatTo}
                onChange={(e) => setAyatTo(e.target.value)}
                placeholder="10"
                className="h-9"
                data-ocid="entries.input"
              />
            </div>
          </div>

          {/* Murajaat Juz Picker */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Murajaat Juz</Label>
              <Popover open={juzPickerOpen} onOpenChange={setJuzPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 justify-between font-normal"
                    data-ocid="entries.select"
                  >
                    <span
                      className={murajaatJuz ? "" : "text-muted-foreground"}
                    >
                      {murajaatJuz || "Select Juz"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[min(400px,calc(100vw-2rem))] p-2"
                  align="start"
                  sideOffset={4}
                >
                  <div
                    className="max-h-32 overflow-y-auto overscroll-contain"
                    onWheel={(e) => e.stopPropagation()}
                    style={{
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                      overflowY: "auto",
                    }}
                  >
                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: "repeat(15, minmax(0, 1fr))",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMurajaatJuz("");
                          setJuzPickerOpen(false);
                        }}
                        style={{ gridColumn: "1 / -1" }}
                        className="text-center px-2 py-1 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border border-dashed border-muted-foreground/30 mb-1"
                      >
                        — None —
                      </button>
                      {JUZ_LIST.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setMurajaatJuz(`Juz ${n}`);
                            setJuzPickerOpen(false);
                          }}
                          className={`text-center px-1 py-1.5 rounded text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors ${
                            murajaatJuz === `Juz ${n}`
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/40"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="murajaat-marks" className="text-sm">
                Murajaat Marks{" "}
                <span className="text-muted-foreground text-xs">(max 10)</span>
              </Label>
              <Input
                id="murajaat-marks"
                type="number"
                min="0"
                max="10"
                value={murajaatMarks}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || (Number(v) >= 0 && Number(v) <= 10))
                    setMurajaatMarks(v);
                }}
                placeholder="0 – 10"
                className="h-9"
                data-ocid="entries.input"
              />
            </div>
          </div>

          {/* Murajaat Target — optional */}
          <div className="rounded-lg border border-dashed border-border p-3 space-y-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-primary" />
              <Label className="text-sm font-semibold text-foreground">
                Murajaat Target
              </Label>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Juz</Label>
                <Popover
                  open={targetJuzPickerOpen}
                  onOpenChange={setTargetJuzPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-9 justify-between font-normal text-xs"
                      data-ocid="entries.select"
                    >
                      <span
                        className={targetJuz ? "" : "text-muted-foreground"}
                      >
                        {targetJuz || "Juz"}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[min(400px,calc(100vw-2rem))] p-2"
                    align="start"
                    sideOffset={4}
                  >
                    <div
                      className="max-h-32 overflow-y-auto overscroll-contain"
                      onWheel={(e) => e.stopPropagation()}
                      style={{
                        WebkitOverflowScrolling: "touch",
                        touchAction: "pan-y",
                        overflowY: "auto",
                      }}
                    >
                      <div
                        className="grid gap-1"
                        style={{
                          gridTemplateColumns: "repeat(15, minmax(0, 1fr))",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setTargetJuz("");
                            setTargetJuzPickerOpen(false);
                          }}
                          style={{ gridColumn: "1 / -1" }}
                          className="text-center px-2 py-1 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border border-dashed border-muted-foreground/30 mb-1"
                        >
                          — None —
                        </button>
                        {JUZ_LIST.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setTargetJuz(`Juz ${n}`);
                              setTargetJuzPickerOpen(false);
                            }}
                            className={`text-center px-1 py-1.5 rounded text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors ${
                              targetJuz === `Juz ${n}`
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/40"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="target-pages-from"
                  className="text-xs text-muted-foreground"
                >
                  Pages From
                </Label>
                <Input
                  id="target-pages-from"
                  type="number"
                  min="1"
                  value={targetPagesFrom}
                  onChange={(e) => setTargetPagesFrom(e.target.value)}
                  placeholder="e.g. 1"
                  className="h-9 text-xs"
                  data-ocid="entries.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="target-pages-to"
                  className="text-xs text-muted-foreground"
                >
                  Pages To
                </Label>
                <Input
                  id="target-pages-to"
                  type="number"
                  min="1"
                  value={targetPagesTo}
                  onChange={(e) => setTargetPagesTo(e.target.value)}
                  placeholder="e.g. 20"
                  className="h-9 text-xs"
                  data-ocid="entries.input"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm">
              Notes{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations..."
              rows={2}
              className="resize-none"
              data-ocid="entries.textarea"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="entries.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground"
              data-ocid="entries.submit_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : isEdit ? (
                "Update Entry"
              ) : (
                "Add Entry"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
