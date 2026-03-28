import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, MessageCircle, Target, Trash2 } from "lucide-react";
import type { HifzEntry } from "../backend.d";

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

function AttendanceBadge({ status }: { status: string }) {
  if (!status) return <span className="text-muted-foreground">—</span>;

  const styles: Record<string, string> = {
    Present:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    Absent:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
    "Not Prepared":
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    Uzur: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  };

  const cls = styles[status] || "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}
    >
      {status}
    </span>
  );
}

interface Props {
  entries: HifzEntry[];
  readOnly?: boolean;
  isSample?: boolean;
  onEdit?: (entry: HifzEntry) => void;
  onDelete?: (entry: HifzEntry) => void;
  onSendWhatsApp?: (entry: HifzEntry) => void;
}

export default function HifzEntryTable({
  entries,
  readOnly,
  onEdit,
  onDelete,
  onSendWhatsApp,
}: Props) {
  const sorted = [...entries].sort((a, b) => (a.date > b.date ? -1 : 1));

  if (sorted.length === 0) {
    return (
      <div
        className="text-center py-10 text-muted-foreground text-sm"
        data-ocid="entries.empty_state"
      >
        No hifz entries recorded yet
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-border overflow-hidden"
      data-ocid="entries.table"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs font-semibold text-muted-foreground w-24">
              Date
            </TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground w-28">
              Status
            </TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">
              Jadeed Surah
            </TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground w-24">
              Ayat
            </TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">
              Murajaat Juz
            </TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground w-20">
              Juz Mark
            </TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">
              Notes
            </TableHead>
            {!readOnly && <TableHead className="w-28" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((entry, i) => {
            const [mJuz, mMarks, attendanceStatus, tJuz, tPagesFrom, tPagesTo] =
              parseMurajaat(entry.murajaatDetails);
            const hasTarget = tJuz || tPagesFrom || tPagesTo;
            return (
              <TableRow
                key={entry.id.toString()}
                className="hover:bg-muted/20"
                data-ocid={`entries.row.${i + 1}`}
              >
                <TableCell className="text-xs font-medium text-foreground">
                  {new Date(entry.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <AttendanceBadge status={attendanceStatus} />
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-foreground">
                    {entry.jadeedSurah}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {entry.jadeedAyatFrom.toString()}–
                  {entry.jadeedAyatTo.toString()}
                </TableCell>
                <TableCell className="text-xs max-w-[200px]">
                  {mJuz && mJuz !== "none" ? (
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{mJuz}</div>
                      {mMarks && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
                          {mMarks}
                        </span>
                      )}
                      {hasTarget && (
                        <div className="flex items-start gap-1 mt-0.5">
                          <Target className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight">
                            {tJuz}
                            {tPagesFrom || tPagesTo
                              ? `, pg ${tPagesFrom}${tPagesTo ? `–${tPagesTo}` : ""}`
                              : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : hasTarget ? (
                    <div className="flex items-start gap-1">
                      <Target className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight">
                        {tJuz}
                        {tPagesFrom || tPagesTo
                          ? `, pg ${tPagesFrom}${tPagesTo ? `–${tPagesTo}` : ""}`
                          : ""}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-foreground">
                  {entry.juzHaaliMark || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                  {entry.notes || <span>—</span>}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onSendWhatsApp && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:text-green-600"
                          onClick={() => onSendWhatsApp(entry)}
                          title="Send via WhatsApp"
                          data-ocid={`entries.whatsapp_button.${i + 1}`}
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:text-primary"
                        onClick={() => onEdit?.(entry)}
                        data-ocid={`entries.edit_button.${i + 1}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:text-destructive"
                        onClick={() => onDelete?.(entry)}
                        data-ocid={`entries.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
