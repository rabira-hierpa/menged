import type { MetadataRoute } from "next";
import { SITE, siteUrl } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.shortDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#F8F9FA",
    theme_color: "#15803D",
    lang: "en",
    dir: "ltr",
    categories: ["travel", "navigation", "utilities"],
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Open map",
        short_name: "Map",
        description: "Open the Addis Ababa transit map",
        url: "/",
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
    id: siteUrl(),
  };
}
