"use client";

// Mock sign-in, to reference/design/Tokens.dc.html. No real auth.

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { getCurrentEa } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const setLoggedIn = useStore((s) => s.setLoggedIn);
  const ea = getCurrentEa();
  const email = `${ea.name.toLowerCase().replace(/\s+/g, ".")}@greenbriar.com`;
  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <div className="h-[64px] shrink-0 bg-header" />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <form
          className="flex w-full max-w-[420px] flex-col gap-5 rounded-[14px] border border-line bg-white px-9 py-8 shadow-[var(--shadow-card)]"
          onSubmit={(e) => {
            e.preventDefault();
            setLoggedIn(true);
            router.push("/portfolio");
          }}
        >
          <div className="flex justify-center">
            <Image src="/greenbriar-logo.png" alt="Greenbriar" width={160} height={26} priority />
          </div>
          <div className="flex flex-col gap-1 text-center">
            <h1 className="serif text-[26px] font-semibold leading-tight">Portfolio meeting scheduler</h1>
            <p className="text-[16px] text-mut">Sign in to see your portfolio companies.</p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Email</span>
            <input className={input} defaultValue={email} readOnly />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Password</span>
            <input className={input} type="password" defaultValue="greenbriar2027" readOnly />
          </label>
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-[10px] bg-brand text-[16px] font-semibold text-white shadow-[0_1px_2px_rgba(20,63,31,0.3)] hover:bg-brand2" data-testid="sign-in">
            Sign in
          </button>
          <p className="text-center text-[13px] text-mut">Demo sign-in. No password is checked.</p>
        </form>
      </div>
    </main>
  );
}

const label = "text-[13px] font-semibold uppercase tracking-[0.04em] text-mut";
const input = "h-11 w-full rounded-[10px] border border-line bg-bg px-3.5 text-[16px] text-txt";
