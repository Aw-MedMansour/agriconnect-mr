import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — AgriConnect" },
      {
        name: "description",
        content:
          "Conditions d'utilisation d'AgriConnect : règles d'inscription, publication d'annonces, messagerie, analyse IA des plantes et protection des données.",
      },
      { property: "og:title", content: "Conditions d'utilisation — AgriConnect" },
      {
        property: "og:description",
        content:
          "Règles d'utilisation de la plateforme AgriConnect : comptes, annonces, messagerie, analyse IA et données personnelles.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://agriconnect.fulania.com/conditions" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://agriconnect.fulania.com/conditions" }],
  }),
  component: ConditionsPage,
});

const sections = [
  {
    title: "1. Objet",
    body: "AgriConnect est une plateforme professionnelle qui met en relation agriculteurs, acheteurs, transporteurs, prestataires de services et autres acteurs du secteur agricole. L'utilisation du site implique l'acceptation pleine et entière des présentes conditions.",
  },
  {
    title: "2. Création de compte",
    body: "L'inscription nécessite une adresse e-mail valide et des informations exactes. Chaque membre est responsable de la confidentialité de son mot de passe et de toutes les activités effectuées depuis son compte. Un compte par personne ou par entreprise.",
  },
  {
    title: "3. Annonces et publications",
    body: "Les annonces (produits, services, terrains, offres d'emploi) doivent être licites, exactes et à jour. Sont interdits : produits illégaux, contrefaçons, produits phytosanitaires non autorisés, contenus trompeurs, discriminatoires ou offensants. AgriConnect peut retirer toute publication non conforme.",
  },
  {
    title: "4. Transactions entre membres",
    body: "AgriConnect facilite la mise en relation mais n'est pas partie aux contrats conclus entre membres. La qualité, la livraison, le paiement et la conformité des biens et services relèvent de la responsabilité exclusive des parties concernées.",
  },
  {
    title: "5. Messagerie",
    body: "La messagerie sert aux échanges professionnels. Le spam, le démarchage abusif, l'usurpation d'identité et le harcèlement entraînent la suspension du compte.",
  },
  {
    title: "6. Analyse des plantes par intelligence artificielle",
    body: "L'analyse IA fournit une aide indicative à partir d'une photo. Elle ne remplace pas le diagnostic d'un agronome ou d'un service phytosanitaire. Aucune décision de traitement ne devrait être prise sur la seule base de ce résultat ; AgriConnect ne garantit ni l'exactitude ni l'exhaustivité de l'analyse.",
  },
  {
    title: "7. Données personnelles",
    body: "Les données collectées (identité, coordonnées, contenus publiés, images téléversées) servent au fonctionnement du service. Les coordonnées privées ne sont pas rendues publiques dans les annonces. Chaque membre peut demander la consultation, la rectification ou la suppression de ses données.",
  },
  {
    title: "8. Propriété intellectuelle",
    body: "Les membres conservent leurs droits sur les contenus publiés et accordent à AgriConnect une licence gratuite et non exclusive pour les afficher sur la plateforme. La marque, le logo et les éléments du site restent la propriété d'AgriConnect.",
  },
  {
    title: "9. Responsabilité",
    body: "Le service est fourni « en l'état ». AgriConnect met tout en œuvre pour assurer sa disponibilité mais ne peut être tenue responsable des interruptions, pertes de données ou préjudices résultant d'échanges entre membres.",
  },
  {
    title: "10. Suspension et résiliation",
    body: "Tout manquement aux présentes conditions peut entraîner la suspension ou la suppression du compte, sans préavis en cas de fraude ou d'atteinte à la sécurité. Chaque membre peut demander la fermeture de son compte à tout moment.",
  },
  {
    title: "11. Modification des conditions",
    body: "Les présentes conditions peuvent évoluer. Les membres sont informés des changements importants ; la poursuite de l'utilisation du service vaut acceptation de la version en vigueur.",
  },
  {
    title: "12. Contact",
    body: "Pour toute question relative aux présentes conditions, contactez l'équipe AgriConnect via la messagerie de la plateforme.",
  },
];

function ConditionsPage() {
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
          Conditions d'utilisation
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

        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-[#0a66c2] px-5 py-2 text-xs font-bold text-white hover:bg-[#004182] transition-colors"
          >
            Retour à AgriConnect
          </Link>
        </div>
      </main>
    </div>
  );
}
