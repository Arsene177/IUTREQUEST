import { Card } from "@/components/ui";

interface StatCardProps {
  value: number;
  label: string;
  accentColor: string;
  onClick?: () => void;
  active?: boolean;
}

export function StatCard({ value, label, accentColor, onClick, active }: StatCardProps) {
  return (
    <Card
      className={`flex flex-col overflow-hidden transition ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      } ${active ? "ring-2 ring-[var(--color-brand)]" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? Boolean(active) : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
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
