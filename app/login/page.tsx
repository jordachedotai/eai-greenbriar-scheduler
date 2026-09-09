"use client";

// Mock sign-in. No real auth. Lands on the Portcos page.

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
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <form
        className="w-full max-w-[380px] rounded-xl border border-line bg-panel p-8 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
        onSubmit={(e) => {
          e.preventDefault();
          setLoggedIn(true);
          router.push("/portcos");
        }}
      >
        <div className="mb-6 flex justify-center">
          <Image src="/greenbriar-logo.png" alt="Greenbriar" width={200} height={33} priority />
        </div>
        <h1 className="mb-1 text-center text-[16px] font-semibold">Portco meeting scheduler</h1>
        <p className="mb-6 text-center text-[12.5px] text-mut">Sign in to see your portfolio companies.</p>
        <label className="mb-3 block text-[12px] text-mut">
          Email
          <input className={input} defaultValue={email} readOnly />
        </label>
        <label className="mb-6 block text-[12px] text-mut">
          Password
          <input className={input} type="password" defaultValue="greenbriar2027" readOnly />
        </label>
        <button type="submit" className="w-full rounded-md bg-brand px-3 py-2 text-[13.5px] font-medium text-white hover:bg-brand2" data-testid="sign-in">
          Sign in
        </button>
      </form>
    </main>
  );
}

const input = "mt-1 block w-full rounded border border-line bg-bg px-2.5 py-1.5 text-[13px] text-txt";
