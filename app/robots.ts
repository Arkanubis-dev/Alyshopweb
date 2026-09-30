import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alyshop.co";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/categoria/", "/producto/", "/buscar", "/preguntas-frecuentes"],
        disallow: ["/admin/", "/api/", "/pedido/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
