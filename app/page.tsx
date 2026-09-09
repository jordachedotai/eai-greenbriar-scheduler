"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const loggedIn = useStore((s) => s.loggedIn);
  useEffect(() => {
    router.replace(loggedIn ? "/portcos" : "/login");
  }, [loggedIn, router]);
  return <div className="py-20 text-center text-mut">Loading</div>;
}
