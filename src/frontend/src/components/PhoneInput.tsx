import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+93", flag: "🇦🇫", name: "Afghanistan" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+1", flag: "🇺🇸", name: "USA/Canada" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+98", flag: "🇮🇷", name: "Iran" },
  { code: "+964", flag: "🇮🇶", name: "Iraq" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "+213", flag: "🇩🇿", name: "Algeria" },
  { code: "+216", flag: "🇹🇳", name: "Tunisia" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

/**
 * Splits a full phone number like "+91 9876543210" or "+923001234567" into
 * { countryCode, localNumber }. If the stored value already starts with a
 * known country code the function returns that code; otherwise it defaults
 * to "+91".
 */
function splitPhone(full: string): {
  countryCode: string;
  localNumber: string;
} {
  if (!full) return { countryCode: "+91", localNumber: "" };

  // Strip any leading whitespace
  const trimmed = full.trim();

  // Sort codes longest-first so "+880" matches before "+88" etc.
  const sorted = [...COUNTRY_CODES].sort(
    (a, b) => b.code.length - a.code.length,
  );

  for (const { code } of sorted) {
    if (trimmed.startsWith(code)) {
      return {
        countryCode: code,
        localNumber: trimmed.slice(code.length).trimStart(),
      };
    }
  }

  // No match — keep raw value as local, default to +91
  return { countryCode: "+91", localNumber: trimmed };
}

export function PhoneInput({
  value,
  onChange,
  id,
  placeholder,
}: PhoneInputProps) {
  const { countryCode: initCode, localNumber: initLocal } = splitPhone(value);
  const [countryCode, setCountryCode] = useState(initCode);
  const [localNumber, setLocalNumber] = useState(initLocal);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep internal state in sync when the parent resets the value
  useEffect(() => {
    const { countryCode: c, localNumber: l } = splitPhone(value);
    setCountryCode(c);
    setLocalNumber(l);
  }, [value]);

  function handleCodeSelect(code: string) {
    setCountryCode(code);
    setOpen(false);
    setSearch("");
    onChange(code + (localNumber ? ` ${localNumber}` : ""));
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const local = e.target.value;
    setLocalNumber(local);
    onChange(countryCode + (local ? ` ${local}` : ""));
  }

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const filtered = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search),
  );

  const selected = COUNTRY_CODES.find((c) => c.code === countryCode);

  return (
    <div className="flex gap-2">
      {/* Country code selector */}
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-3 flex items-center gap-1 min-w-[90px] font-mono text-sm"
          onClick={() => setOpen((o) => !o)}
        >
          <span>{selected?.flag}</span>
          <span>{countryCode}</span>
          <ChevronDown className="w-3 h-3 ml-auto opacity-60" />
        </Button>

        {open && (
          <div className="absolute z-50 top-full mt-1 left-0 w-64 rounded-md border bg-popover shadow-lg">
            <div className="p-2 border-b">
              <Input
                autoFocus
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent cursor-pointer ${
                    c.code === countryCode ? "bg-accent font-medium" : ""
                  }`}
                  onClick={() => handleCodeSelect(c.code)}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1 text-left">{c.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {c.code}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No results
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Local number input */}
      <Input
        id={id}
        value={localNumber}
        onChange={handleLocalChange}
        placeholder={placeholder ?? "9876543210"}
        type="tel"
        className="flex-1"
      />
    </div>
  );
}
