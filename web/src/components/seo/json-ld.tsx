import { SITE, siteUrl } from "@/lib/site";

/** JSON-LD for Google + AI agents: WebSite + WebApplication + Organization. */
export function JsonLd() {
  const url = siteUrl();

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: SITE.name,
        url,
        logo: `${url}/logo.svg`,
        description: SITE.shortDescription,
        areaServed: {
          "@type": "City",
          name: "Addis Ababa",
          containedInPlace: {
            "@type": "Country",
            name: "Ethiopia",
          },
        },
        sameAs: ["https://dandii.app"],
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: SITE.name,
        description: SITE.description,
        publisher: { "@id": `${url}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        "@id": `${url}/#app`,
        name: `${SITE.name} — ${SITE.tagline}`,
        url,
        applicationCategory: "TravelApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript",
        description: SITE.description,
        image: `${url}/logo.svg`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "ETB",
        },
        featureList: [
          "Interactive map of Addis Ababa transit routes",
          "Minibus, bus, and Light Rail coverage",
          "Fare lookup and journey planning",
          "Official GTFS-backed data",
        ],
        provider: { "@id": `${url}/#organization` },
        isPartOf: { "@id": `${url}/#website` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD must be a raw script; content is static strings from SITE.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
