"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { UploadCloud, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { authApi, type ResultatLigneImport } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api-client";

export default function ImportEtudiantsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resume, setResume] = useState("");
  const [resultats, setResultats] = useState<ResultatLigneImport[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "cellule_informatique")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleImport = async () => {
    if (!fichier) return;
    setIsSubmitting(true);
    setError("");
    setResume("");
    setResultats([]);
    try {
      const data = await authApi.importEtudiants(fichier);
      setResume(data.message);
      setResultats(data.resultats);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur lors de l'import du fichier"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <StaffLayout title="Import étudiants">
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
      </StaffLayout>
    );
  }

  const crees = resultats.filter((r) => r.statut === "cree");
  const ignores = resultats.filter((r) => r.statut === "ignore");

  return (
    <StaffLayout title="Import étudiants">
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Import des comptes étudiants
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Enregistrez en une seule fois tous les comptes étudiants d&apos;une promotion à partir
            d&apos;un fichier Excel, plutôt qu&apos;une saisie manuelle compte par compte.
          </p>
        </header>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Format attendu
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Un fichier <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">.xlsx</code>{" "}
            avec une ligne d&apos;en-tête, contenant ces colonnes (ordre libre, insensible à la casse
            et aux accents) :
          </p>
          <div className="flex flex-wrap gap-2">
            {["matricule", "nom", "prenom", "email", "filiere", "niveau", "mot_de_passe (optionnel)"].map(
              (col) => (
                <span
                  key={col}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {col}
                </span>
              )
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Si <code>mot_de_passe</code> est absent ou vide pour une ligne, un mot de passe
            temporaire est généré automatiquement et affiché dans le résultat de l&apos;import.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-8 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            {fichier ? (
              <>
                <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{fichier.name}</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Cliquer pour choisir un fichier Excel (.xlsx, 2 Mo max)
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={!fichier || isSubmitting}
            onClick={handleImport}
            className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {isSubmitting ? "Import en cours..." : "Importer"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resume && (
          <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 p-4 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{resume}</span>
          </div>
        )}

        {crees.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 px-6 pt-6 pb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              Comptes créés ({crees.length})
            </h3>
            <p className="px-6 text-xs text-gray-500 dark:text-gray-400 pb-3">
              Communiquez ces mots de passe temporaires aux étudiants concernés — ils ne seront
              plus affichés après avoir quitté cette page.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                  <tr>
                    <th className="px-6 py-3">Ligne</th>
                    <th className="px-6 py-3">Matricule</th>
                    <th className="px-6 py-3">Mot de passe temporaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {crees.map((r) => (
                    <tr key={r.ligne}>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{r.ligne}</td>
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{r.matricule}</td>
                      <td className="px-6 py-3 font-mono text-gray-700 dark:text-gray-300">
                        {r.mot_de_passe_genere ?? <span className="italic text-gray-400">fourni dans le fichier</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {ignores.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 px-6 pt-6 pb-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              Lignes ignorées ({ignores.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                  <tr>
                    <th className="px-6 py-3">Ligne</th>
                    <th className="px-6 py-3">Matricule</th>
                    <th className="px-6 py-3">Raison</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {ignores.map((r) => (
                    <tr key={r.ligne}>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{r.ligne}</td>
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{r.matricule || "—"}</td>
                      <td className="px-6 py-3 text-red-600 dark:text-red-400">{r.raison}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
