"use client";

// The signed-in shell: sidebar, header, page content, presenter menu.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/Shell/Sidebar";
import { Header } from "@/components/Shell/Header";
import { PresenterMenu } from "@/components/Presenter/PresenterMenu";
import { EmailDrawer } from "@/components/Drafts/EmailDrawer";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const loggedIn = useStore((s) => s.loggedIn);
  const router = useRouter();

  useEffect(() => {
    if (ready && !loggedIn) router.replace("/login");
  }, [ready, loggedIn, router]);

  if (!ready || !loggedIn) return <div className="py-20 text-center text-mut">Loading</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <PresenterMenu />
      <EmailDrawer />
    </div>
  );
}
