import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/politique-d-utilisation")({
  head: () => ({
    meta: [
      { title: "Politique d'utilisation — AgriConnect" },
      {
        name: "description",
        content:
          "Politique d'utilisation d'AgriConnect : règles de conduite, contenus autorisés, modération, messagerie, analyse IA et sanctions.",
      },
      { property: "og:title", content: "Politique d'utilisation — AgriConnect" },
      {
        property: "og:description",
        content:
          "Règles de conduite, contenus autorisés, modération et sanctions sur la plateforme AgriConnect.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://agriconnect-mr.com/politique-d-utilisation" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://agriconnect-mr.com/politique-d-utilisation",
      },
    ],
  }),
  component: PolicyPage,
});

const sections = [
  {
    title: "1. Objet de la politique",
    body: "Cette politique complète les conditions d'utilisation d'AgriConnect. Elle précise les règles de conduite attendues des membres, les contenus autorisés, les mécanismes de modération et les sanctions applicables. La plateforme est éditée par Agrosky (Nouakchott, Mauritanie).",
  },
  {
    title: "2. Comptes et identité",
    body: "Chaque membre doit fournir des informations exactes et à jour. L'utilisation d'une fausse identité, la création de comptes multiples à des fins de spam ou de manipulation, et l'usurpation d'identité sont interdites. Le titulaire d'un compte en est entièrement responsable.",
  },
  {
    title: "3. Contenus autorisés et interdits",
    body: "Les publications doivent être liées au secteur agricole : produits, services, équipements, terrains, offres d'emploi, conseils professionnels. Sont strictement interdits : contenus illégaux, contrefaçons, produits phytosanitaires non autorisés, contenus discriminatoires, violents, choquants, trompeurs ou nuisibles. AgriConnect se réserve le droit de retirer tout contenu non conforme sans préavis.",
  },
  {
    title: "4. Bonnes pratiques commerciales",
    body: "Les annonces doivent refléter la réalité du bien ou du service proposé. Les prix, les quantités, les localisations et les conditions de livraison doivent être exacts. Toute pratique de prix trompeuse, de surbooking ou de fausse représentation est prohibée.",
  },
  {
    title: "5. Messagerie et contacts",
    body: "La messagerie est réservée aux échanges professionnels liés à la plateforme. Sont interdits : spam, démarchage abusif, messages à caractère publicitaire non sollicité, harcèlement, menaces et tentatives de détourner les transactions hors de la plateforme dans le but d'échapper aux règles de sécurité.",
  },
  {
    title: "6. Analyse des plantes par IA",
    body: "L'outil d'analyse des plantes fournit une indication à titre informatif. L'utilisateur doit considérer le résultat comme une aide préliminaire et consulter un professionnel agricole ou phytosanitaire compétent avant toute décision de traitement. AgriConnect ne saurait être tenue responsable d'une interprétation erronée ou d'une action entreprise sur la base du résultat.",
  },
  {
    title: "7. Signalement et modération",
    body: "Tout membre peut signaler un contenu ou un comportement suspect via les fonctionnalités prévues à cet effet. L'équipe de modération examine les signalements et peut masquer, modifier ou supprimer un contenu, limiter temporairement un compte ou procéder à sa suppression définitive.",
  },
  {
    title: "8. Sanctions",
    body: "En fonction de la gravité des manquements, AgriConnect peut appliquer un avertissement, une limitation de fonctionnalités, une suspension temporaire ou une suppression définitive du compte. En cas de fraude, d'atteinte à la sécurité ou de contenu illégal, la suppression peut être immédiate et sans préavis.",
  },
  {
    title: "9. Modification de la politique",
    body: "Cette politique peut être mise à jour à tout moment. Les changements importants sont portés à la connaissance des membres. L'utilisation continue de la plateforme vaut acceptation de la version en vigueur.",
  },
  {
    title: "10. Contact",
    body: "Pour toute question relative à cette politique, contactez Agrosky : agrosky00@gmail.com, +222 38 31 04 76 ou +222 32 25 67 18.",
  },
];

function PolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-extrabold text-[#0a66c2]">
            AgriConnect 🌱
          </Link>
          <Link to="/" className="text-xs font-bold text-slate-600 hover:text-[#0a66c2]">
            Retour au site
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Politique d'utilisation
        </h1>
        <p className="mt-2 text-xs text-slate-500 font-medium">
          Dernière mise à jour : septembre 2026
        </p>

        <div className="mt-8 space-y-6">
          {sections.map((s) => (
            <section
              key={s.title}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
            >
              <h2 className="text-sm font-bold text-slate-900">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            to="/conditions"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:border-[#0a66c2] hover:text-[#0a66c2] transition-colors"
          >
            Conditions d'utilisation
          </Link>
          <Link
            to="/mentions-legales"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:border-[#0a66c2] hover:text-[#0a66c2] transition-colors"
          >
            Mentions légales
          </Link>
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-[#0a66c2] px-5 py-2 text-xs font-bold text-white hover:bg-[#004182] transition-colors"
          >
            Retour à AgriConnect
          </Link>
        </div>

        <p className="mt-8 text-[11px] text-slate-400">
          Développé par Agrosky
        </p>
      </main>
    </div>
  );
}
