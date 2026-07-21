"use client";

import { useRef, useState, type DragEvent } from "react";
import { FolderPlus, FileText, X } from "lucide-react";
import clsx from "clsx";
import { EXTENSIONS_ACCEPTEES, MIME_ACCEPTES, TAILLE_MAX_FICHIER_OCTETS } from "@/lib/constants";
import { formatTailleFichier } from "@/lib/format";

interface FileDropzoneSingleProps {
  label: string;
  multiple?: false;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  id?: string;
}

interface FileDropzoneMultipleProps {
  label: string;
  multiple: true;
  value: File[];
  onChange: (files: File[]) => void;
  error?: string;
  id?: string;
}

type FileDropzoneProps = FileDropzoneSingleProps | FileDropzoneMultipleProps;

function validateFile(file: File): string | null {
  if (!MIME_ACCEPTES.includes(file.type)) return "Format accepté : PDF, JPG ou PNG.";
  if (file.size > TAILLE_MAX_FICHIER_OCTETS) return "Le fichier ne doit pas dépasser 5 Mo.";
  return null;
}

export function FileDropzone(props: FileDropzoneProps) {
  const { label, error, id } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);

    for (const file of incoming) {
      const err = validateFile(file);
      if (err) {
        setLocalError(err);
        return;
      }
    }
    setLocalError(null);

    if (props.multiple) {
      props.onChange([...props.value, ...incoming]);
    } else {
      props.onChange(incoming[0]);
    }
  };

  const removeFile = (index: number) => {
    if (props.multiple) {
      props.onChange(props.value.filter((_, i) => i !== index));
    } else {
      props.onChange(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const displayedError = error ?? localError ?? undefined;
  const files = props.multiple ? props.value : props.value ? [props.value] : [];
  const showDropzone = props.multiple || files.length === 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-[var(--color-ink)]">
        {label}
      </label>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
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
                onClick={() => removeFile(index)}
                aria-label="Retirer le fichier"
                className="text-[var(--color-ink-faint)] hover:text-[var(--color-danger)] transition flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showDropzone && (
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
              {props.multiple ? "Cliquer pour ajouter des fichiers" : "Cliquer pour ajouter un fichier"}
            </p>
            <p className="text-xs text-[var(--color-ink-faint)]">
              {EXTENSIONS_ACCEPTEES.map((e) => e.replace(".", "").toUpperCase()).join(", ")}
              {" "}— MAX 5Mo{props.multiple ? " par fichier" : ""}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple={props.multiple}
        accept={MIME_ACCEPTES.join(",")}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {displayedError && (
        <p className="text-xs font-medium text-[var(--color-danger)]">{displayedError}</p>
      )}
    </div>
  );
}
