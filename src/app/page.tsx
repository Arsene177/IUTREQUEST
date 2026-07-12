import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">IUT Request</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Bienvenue dans la plateforme de gestion des requêtes</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Connectez-vous pour consulter vos demandes, suivre leur avancée et contacter l’administration.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Se connecter
          </Link>
          <Link
            href="/mot-de-passe-oublie"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Mot de passe oublié
          </Link>
        </div>
      </div>
    </main>
  );
}
