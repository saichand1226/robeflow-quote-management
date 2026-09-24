import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RobeFlow",
    short_name: "RobeFlow",
    description: "Quote, invoicing, dispatch and installation workflow",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#047857",
    orientation: "any",
  };
}
