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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Loader2 } from "lucide-react";
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

const JUZ_LIST = Array.from({ length: 30 }, (_, i) => `Juz ${i + 1}`);

interface Props {
  studentId: bigint;
  entry?: HifzEntry | null;
  onClose: () => void;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function parseMurajaat(raw: string): [string, string] {
  const parts = raw.split("|");
  return [parts[0] || "", parts[1] || ""];
}

export default function HifzEntryForm({ studentId, entry, onClose }: Props) {
  const isEdit = !!entry;
  const { mutateAsync: createEntry, isPending: creating } =
    useCreateHifzEntry();
  const { mutateAsync: updateEntry, isPending: updating } =
    useUpdateHifzEntry();
  const isPending = creating || updating;

  const [date, setDate] = useState(entry?.date || today());
  const [jadeedSurah, setJadeedSurah] = useState(entry?.jadeedSurah || "");
  const [surahPickerOpen, setSurahPickerOpen] = useState(false);
  const [ayatFrom, setAyatFrom] = useState(
    entry ? entry.jadeedAyatFrom.toString() : "",
  );
  const [ayatTo, setAyatTo] = useState(
    entry ? entry.jadeedAyatTo.toString() : "",
  );

  const [murajaatJuz, setMurajaatJuz] = useState(
    () => parseMurajaat(entry?.murajaatDetails || "")[0],
  );
  const [murajaatMarks, setMurajaatMarks] = useState(
    () => parseMurajaat(entry?.murajaatDetails || "")[1],
  );

  const [mark, setMark] = useState(entry?.juzHaaliMark || "");
  const [notes, setNotes] = useState(entry?.notes || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jadeedSurah.trim() || !ayatFrom || !ayatTo) {
      toast.error("Please fill in all required fields");
      return;
    }

    const murajaatDetails = murajaatJuz
      ? murajaatMarks
        ? `${murajaatJuz}|${murajaatMarks}`
        : murajaatJuz
      : "";

    const input = {
      studentId,
      date,
      jadeedSurah: jadeedSurah.trim(),
      jadeedAyatFrom: BigInt(ayatFrom),
      jadeedAyatTo: BigInt(ayatTo),
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

          <div className="space-y-1.5">
            <Label className="text-sm">
              Jadeed Surah <span className="text-destructive">*</span>
            </Label>
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
                className="w-[480px] p-2"
                align="start"
                sideOffset={4}
              >
                <div className="max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-1">
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
                Ayat From <span className="text-destructive">*</span>
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
                Ayat To <span className="text-destructive">*</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Murajaat Juz</Label>
              <Select value={murajaatJuz} onValueChange={setMurajaatJuz}>
                <SelectTrigger className="h-9" data-ocid="entries.select">
                  <SelectValue placeholder="Select Juz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {JUZ_LIST.map((juz) => (
                    <SelectItem key={juz} value={juz}>
                      {juz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
