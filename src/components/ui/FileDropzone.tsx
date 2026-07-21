"use client";

import { useRef, useState, type DragEvent } from "react";
import { FolderPlus, FileText, X } from "lucide-react";
import clsx from "clsx";
import { EXTENSIONS_ACCEPTEES, MIME_ACCEPTES, TAILLE_MAX_FICHIER_OCTETS } from "@/lib/constants";
import { formatTailleFichier } from "@/lib/format";

interface FileDropzoneProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  id?: string;
}

export function FileDropzone({ label, value, onChange, error, id }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validateAndSet = (file: File | null) => {
    if (!file) {
      onChange(null);
      return;
    }
    if (!MIME_ACCEPTES.includes(file.type)) {
      setLocalError("Format accepté : PDF, JPG ou PNG.");
      return;
    }
    if (file.size > TAILLE_MAX_FICHIER_OCTETS) {
      setLocalError("Le fichier ne doit pas dépasser 5 Mo.");
      return;
    }
    setLocalError(null);
    onChange(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    validateAndSet(file);
  };

  const displayedError = error ?? localError ?? undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-[var(--color-ink)]">
        {label}
      </label>

      {value ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-control)] bg-[var(--color-canvas-soft)] px-4 py-3">
          <FileText size={20} className="text-[var(--color-brand)] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{value.name}</p>
            <p className="text-xs text-[var(--color-ink-faint)]">
              {formatTailleFichier(value.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => validateAndSet(null)}
            aria-label="Retirer le fichier"
            className="text-[var(--color-ink-faint)] hover:text-[var(--color-danger)] transition flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={clsx(
            "flex items-center justify-center gap-3 rounded-[var(--radius-control)] bg-[var(--color-canvas-soft)] px-4 py-5 cursor-pointer transition border-2 border-dashed",
            isDragging
              ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
              : "border-transparent hover:border-[var(--color-cream-line)]"
          )}
        >
          <FolderPlus size={20} className="text-[var(--color-ink-muted)]" />
          <div className="text-center">
            <p className="text-sm text-[var(--color-ink)]">
              Cliquer pour ajouter un fichier
            </p>
            <p className="text-xs text-[var(--color-ink-faint)]">
              {EXTENSIONS_ACCEPTEES.map((e) => e.replace(".", "").toUpperCase()).join(", ")}{" "}
              — MAX 5Mo
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={MIME_ACCEPTES.join(",")}
        className="hidden"
        onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
      />

      {displayedError && (
        <p className="text-xs font-medium text-[var(--color-danger)]">{displayedError}</p>
      )}
    </div>
  );
}

const NB_FICHIERS_MAX = 5;

interface FileDropzoneMultiProps {
  label: string;
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
  id?: string;
}

/** Variante multi-fichiers de FileDropzone (jusqu'à 5 justificatifs). */
export function FileDropzoneMulti({ label, value, onChange, error, id }: FileDropzoneMultiProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const ajouterFichiers = (fichiers: FileList | File[] | null) => {
    if (!fichiers) return;
    const liste = Array.from(fichiers);
    if (value.length + liste.length > NB_FICHIERS_MAX) {
      setLocalError(`${NB_FICHIERS_MAX} fichiers maximum.`);
      return;
    }
    for (const file of liste) {
      if (!MIME_ACCEPTES.includes(file.type)) {
        setLocalError("Format accepté : PDF, JPG ou PNG.");
        return;
      }
      if (file.size > TAILLE_MAX_FICHIER_OCTETS) {
        setLocalError("Chaque fichier ne doit pas dépasser 5 Mo.");
        return;
      }
    }
    setLocalError(null);
    onChange([...value, ...liste]);
  };

  const retirerFichier = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    ajouterFichiers(e.dataTransfer.files);
  };

  const displayedError = error ?? localError ?? undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-[var(--color-ink)]">
        {label}
      </label>

      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-[var(--radius-control)] bg-[var(--color-canvas-soft)] px-4 py-3"
            >
              <FileText size={20} className="text-[var(--color-brand)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">
                  {formatTailleFichier(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => retirerFichier(index)}
                aria-label={`Retirer ${file.name}`}
                className="text-[var(--color-ink-faint)] hover:text-[var(--color-danger)] transition flex-shrink-0"
              >
                <X size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length < NB_FICHIERS_MAX && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={clsx(
            "flex items-center justify-center gap-3 rounded-[var(--radius-control)] bg-[var(--color-canvas-soft)] px-4 py-5 cursor-pointer transition border-2 border-dashed",
            isDragging
              ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
              : "border-transparent hover:border-[var(--color-cream-line)]"
          )}
        >
          <FolderPlus size={20} className="text-[var(--color-ink-muted)]" />
          <div className="text-center">
            <p className="text-sm text-[var(--color-ink)]">
              {value.length > 0 ? "Ajouter un autre fichier" : "Cliquer pour ajouter un ou plusieurs fichiers"}
            </p>
            <p className="text-xs text-[var(--color-ink-faint)]">
              {EXTENSIONS_ACCEPTEES.map((e) => e.replace(".", "").toUpperCase()).join(", ")}{" "}
              — MAX 5Mo chacun, {NB_FICHIERS_MAX} fichiers maximum
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        accept={MIME_ACCEPTES.join(",")}
        className="hidden"
        onChange={(e) => {
          ajouterFichiers(e.target.files);
          e.target.value = "";
        }}
      />

      {displayedError && (
        <p className="text-xs font-medium text-[var(--color-danger)]">{displayedError}</p>
      )}
    </div>
  );
}
