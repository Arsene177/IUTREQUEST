import { Card } from "@/components/ui";

interface StatCardProps {
  value: number;
  label: string;
  accentColor: string;
}

export function StatCard({ value, label, accentColor }: StatCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: accentColor }} />
      <div className="px-5 py-6 text-center">
        <p className="text-4xl font-extrabold text-[var(--color-ink)]">{value}</p>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-muted)] mt-2">
          {label}
        </p>
      </div>
    </Card>
  );
}
