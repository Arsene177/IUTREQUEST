import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

export function formatDate(value: string | Date, pattern = "dd/MM/yyyy"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, pattern, { locale: fr });
}

export function formatDateHeure(value: string | Date): string {
  return formatDate(value, "dd/MM/yyyy HH:mm");
}

export function formatTailleFichier(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function initiales(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export function nomComplet(nom: string, prenom: string): string {
  return `${prenom} ${nom}`;
}
