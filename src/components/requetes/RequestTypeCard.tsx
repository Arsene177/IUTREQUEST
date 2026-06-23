"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";

interface RequestTypeCardProps {
  title: string;
  description: string;
  href: string;
}

export function RequestTypeCard({ title, description, href }: RequestTypeCardProps) {
  const router = useRouter();
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.push(href);
      }}
      className="px-8 py-7 text-center cursor-pointer hover:shadow-md transition"
    >
      <p className="text-xl font-extrabold text-[var(--color-ink)]">{title}</p>
      <p className="text-sm text-[var(--color-ink-muted)] mt-2">{description}</p>
    </Card>
  );
}
