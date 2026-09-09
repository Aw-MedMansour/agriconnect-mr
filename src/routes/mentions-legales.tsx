import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — AgriConnect" },
      {
        name: "description",
        content:
          "Mentions légales d'AgriConnect : éditeur du site, hébergement, propriété intellectuelle, données personnelles, cookies et droit applicable.",
      },
      { property: "og:title", content: "Mentions légales — AgriConnect" },
      {
        property: "og:description",
        content:
          "Éditeur, hébergement, propriété intellectuelle, données personnelles et droit applicable de la plateforme AgriConnect.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://agriconnect-mr.com/mentions-legales" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://agriconnect-mr.com/mentions-legales" },
    ],
  }),
  component: LegalPage,
});

const sections = [
  {
    title: "1. Éditeur du site",
    body: "Le site AgriConnect est édité et développé par 3A55. Toute demande relative au site peut être adressée via la messagerie de la plateforme ou le site de l'éditeur : 3A55.Fulania.com.",
  },
  {
    title: "2. Directeur de la publication",
    body: "La direction de la publication est assurée par le représentant légal de 3A55.",
  },
  {
    title: "3. Hébergement",
    body: "Le site est hébergé sur une infrastructure cloud sécurisée, accessible via le domaine agriconnect.fulania.com. Les données applicatives sont stockées sur une base gérée avec chiffrement en transit et contrôle d'accès par utilisateur.",
  },
  {
    title: "4. Propriété intellectuelle",
    body: "La structure du site, son interface, son logo, sa charte graphique et ses contenus originaux sont protégés. Toute reproduction, représentation ou adaptation, totale ou partielle, sans autorisation écrite est interdite. Les contenus publiés par les membres restent leur propriété.",
  },
  {
    title: "5. Données personnelles",
    body: "AgriConnect collecte uniquement les données nécessaires au fonctionnement du service : identité professionnelle, adresse e-mail, contenus publiés et images téléversées. Les coordonnées privées ne sont pas rendues publiques. Chaque membre dispose d'un droit d'accès, de rectification et de suppression de ses données, exerçable via la messagerie de la plateforme.",
  },
  {
    title: "6. Cookies et stockage local",
    body: "Le site utilise le stockage local du navigateur pour maintenir la session de connexion et améliorer l'expérience d'utilisation. Aucun cookie publicitaire ou de traçage tiers n'est déposé.",
  },
  {
    title: "7. Sécurité",
    body: "L'accès aux données est protégé par une authentification par compte et des règles de sécurité au niveau de la base : chaque membre n'accède qu'à ses propres données et aux contenus publics. Les fichiers téléversés sont stockés dans un espace privé accessible uniquement à leur propriétaire.",
  },
  {
    title: "8. Responsabilité",
    body: "AgriConnect met en relation des professionnels mais n'est pas partie aux transactions conclues entre membres. L'éditeur ne peut être tenu responsable des contenus publiés par les utilisateurs ni des interruptions temporaires du service.",
  },
  {
    title: "9. Liens externes",
    body: "Le site peut contenir des liens vers des sites tiers. L'éditeur n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.",
  },
  {
    title: "10. Droit applicable",
    body: "Les présentes mentions légales sont régies par le droit applicable au lieu d'établissement de l'éditeur. Tout litige fera l'objet d'une recherche de solution amiable avant toute action judiciaire.",
  },
];

function LegalPage() {
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
          Mentions légales
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
            to="/"
            className="inline-flex items-center rounded-full bg-[#0a66c2] px-5 py-2 text-xs font-bold text-white hover:bg-[#004182] transition-colors"
          >
            Retour à AgriConnect
          </Link>
        </div>

        <p className="mt-8 text-[11px] text-slate-400">
          Développé par{" "}
          <a
            href="https://3A55.Fulania.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#0a66c2] hover:underline"
          >
            3A55
          </a>
        </p>
      </main>
    </div>
  );
}
