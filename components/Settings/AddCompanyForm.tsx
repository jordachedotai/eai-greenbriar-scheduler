"use client";

// Add a portfolio company. Saves to the store, so it appears in Portfolio
// and Calendar at once, not started. Availability for its team comes from
// the seeded generator when a person has no fixture calendar.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getEas } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { BoardMember, PortcoSeed } from "@/lib/types";
import { LogoTile } from "@/components/ui/LogoTile";
import { PeoplePicker } from "./PeoplePicker";
import { Menu } from "@/components/ui/Menu";
import { defaultWindow, quarterLong, quarterRange, windowQuarters, MAX_QUARTERS } from "@/lib/quarters";

type BoardRow = { name: string; role: string; calendarVisible: boolean };
const ROLES = ["Board Chair", "Independent Director", "Director", "Observer"];

function slugify(name: string): string {
  return name.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function AddCompanyForm() {
  const router = useRouter();
  const addPortco = useStore((s) => s.addPortco);
  const existing = useStore((s) => s.portcos);
  const eas = getEas();
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [execName, setExecName] = useState("");
  const [execTitle, setExecTitle] = useState("Chief Executive Officer");
  const [board, setBoard] = useState<BoardRow[]>([
    { name: "", role: "Board Chair", calendarVisible: false },
    { name: "", role: "Independent Director", calendarVisible: false },
    { name: "", role: "Independent Director", calendarVisible: false },
  ]);
  const [eaId, setEaId] = useState(eas[0]?.id ?? "ea1");
  const [team, setTeam] = useState<string[]>([]);
  const defaults = useStore((s) => s.defaults);
  const [startQuarter, setStartQuarter] = useState(defaultWindow([], defaults.quarterCount).startQuarter);
  const [quarterCount, setQuarterCount] = useState(defaults.quarterCount);
  const [error, setError] = useState<string | null>(null);

  const id = slugify(name);
  const valid = name.trim() && city.trim() && address.trim() && execName.trim() && team.length > 0 && !existing[id];

  const submit = () => {
    if (!valid) {
      setError(existing[id] ? "A company with that name already exists." : "Name, HQ city, office address, executive contact, and at least one team member are needed.");
      return;
    }
    const seed: PortcoSeed = {
      id,
      name: name.trim(),
      logo,
      city: city.trim(),
      officeAddress: `${address.trim()}, ${city.trim()}`,
      partnerIds: team,
      execContact: { name: execName.trim(), title: execTitle.trim() || "Chief Executive Officer" },
      startQuarter,
      quarterCount,
      blockHours: defaults.blockHours,
      dinnerTime: defaults.dinnerTime,
      targetQuarters: windowQuarters({ startQuarter, quarterCount }),
      eaId,
    };
    const members: BoardMember[] = board
      .filter((b) => b.name.trim())
      .map((b, i) => ({ id: `${id}-b${i + 1}`, name: b.name.trim(), portcoId: id, role: b.role, calendarVisible: b.calendarVisible }));
    addPortco(seed, members);
    router.push(`/portfolio/${id}`);
  };

  const onLogoFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <form
      className="flex flex-col gap-5"
      data-testid="add-company"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Company name">
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Northgate Industrial" data-testid="add-name" />
        </Field>
        <Field label="Logo">
          <div className="flex items-center gap-3">
            <LogoTile src={logo} name={name || "?"} width={84} height={52} radius={10} />
            <input type="file" accept="image/*" className="text-[14px]" onChange={(e) => onLogoFile(e.target.files?.[0])} data-testid="add-logo" />
          </div>
        </Field>
        <Field label="HQ city">
          <input className={input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Columbus, OH" data-testid="add-city" />
        </Field>
        <Field label="Office address">
          <input className={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="100 Main Street, Suite 400" data-testid="add-address" />
        </Field>
        <Field label="Executive contact">
          <input className={input} value={execName} onChange={(e) => setExecName(e.target.value)} placeholder="Full name" data-testid="add-exec" />
        </Field>
        <Field label="Executive title">
          <input className={input} value={execTitle} onChange={(e) => setExecTitle(e.target.value)} data-testid="add-exec-title" />
        </Field>
        <Field label="Assigned assistant">
          <Menu value={eaId} onChange={setEaId} options={eas.map((ea) => ({ value: ea.id, label: ea.name }))} testId="add-ea" ariaLabel="Assigned assistant" />
        </Field>
        <Field label="Planning window">
          <div className="grid grid-cols-2 gap-2">
            <Menu value={startQuarter} onChange={setStartQuarter} options={quarterRange(2026, 2028).map((q) => ({ value: q, label: `Starts ${quarterLong(q)}` }))} testId="add-start" ariaLabel="Starting quarter" />
            <Menu value={quarterCount} onChange={setQuarterCount} options={Array.from({ length: MAX_QUARTERS }, (_, i) => i + 1).map((n) => ({ value: n, label: `${n} quarter${n === 1 ? "" : "s"}` }))} testId="add-count" ariaLabel="How many quarters" />
          </div>
        </Field>
      </div>

      <Field label="Board members">
        <div className="flex flex-col gap-2" data-testid="add-board">
          {board.map((b, i) => (
            <div key={i} className="grid grid-cols-[1fr_200px_auto] items-center gap-2">
              <input className={input} value={b.name} placeholder="Name" onChange={(e) => setBoard(board.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} data-testid={`add-board-name-${i}`} />
              <Menu value={b.role} onChange={(v) => setBoard(board.map((x, j) => (j === i ? { ...x, role: v } : x)))} options={ROLES.map((r) => ({ value: r, label: r }))} testId={`add-board-role-${i}`} ariaLabel="Board role" />
              <label className="flex items-center gap-2 text-[14px] text-mut">
                <input type="checkbox" checked={b.calendarVisible} onChange={(e) => setBoard(board.map((x, j) => (j === i ? { ...x, calendarVisible: e.target.checked } : x)))} />
                Calendar shared
              </label>
            </div>
          ))}
          <button type="button" className="self-start text-[14px] font-semibold text-brand hover:underline" onClick={() => setBoard([...board, { name: "", role: "Independent Director", calendarVisible: false }])}>
            Add a board member
          </button>
        </div>
      </Field>

      <Field label="Greenbriar team">
        <PeoplePicker value={team} onChange={setTeam} testId="add-team" />
      </Field>

      {error ? <p className="text-[14px] text-red" data-testid="add-error">{error}</p> : null}
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-mut">{id ? `Will appear in Portfolio as ${id}, not started.` : ""}</span>
        <button type="submit" className="inline-flex h-11 items-center rounded-[10px] bg-brand px-[22px] text-[16px] font-semibold text-white shadow-[0_1px_2px_rgba(20,63,31,0.3)] hover:bg-brand2" data-testid="add-save">
          Add portfolio company
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">{label}</span>
      {children}
    </div>
  );
}

const input = "h-10 w-full rounded-[8px] border border-line bg-white px-3 text-[15px] text-txt";
