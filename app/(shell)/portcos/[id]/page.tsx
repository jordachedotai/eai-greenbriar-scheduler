"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Detail } from "@/components/Detail/Detail";

export default function PortcoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const portco = useStore((s) => s.portcos[id]);
  if (!portco) {
    return (
      <div className="p-8 text-mut">
        No portco with id {id}. <Link href="/portcos" className="text-brand underline">Back to Portcos</Link>
      </div>
    );
  }
  return <Detail portco={portco} />;
}
