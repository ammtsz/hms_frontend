import type { MetadataRoute } from "next";

/**
 * Always disallow indexing — this app is a portfolio/demo surface, not a public clinic site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
