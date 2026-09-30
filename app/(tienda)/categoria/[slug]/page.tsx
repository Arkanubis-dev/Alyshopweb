import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getProductsByCategory } from "@/lib/supabase/queries";
import { CategoryView } from "@/components/tienda/CategoryView";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alyshop.co";

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getProductsByCategory(slug);

  const title =
    slug === "todos"
      ? "Todos los Productos | Catálogo Completo alyshop"
      : category?.name
      ? `${category.name} | alyshop Colombia`
      : "Categoría de Productos | alyshop";

  const description =
    slug === "todos"
      ? "Explora todo nuestro catálogo de productos para el hogar, cocina, ropa, tecnología, juguetes y belleza en Colombia."
      : `Descubre los mejores productos de ${
          category?.name || "variedad"
        } en alyshop. Envíos rápidos y seguros a toda Colombia. Pide por WhatsApp.`;

  const canonicalUrl = `${baseUrl}/categoria/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [categories, { category, products }] = await Promise.all([
    getCategories(),
    getProductsByCategory(slug),
  ]);

  if (!category && slug !== "todos") {
    notFound();
  }

  const categoryName = slug === "todos" ? "Todos los productos" : category?.name || "Categoría";

  // BreadcrumbList JSON-LD schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `${baseUrl}/categoria/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryView
        category={category}
        initialProducts={products}
        categories={categories}
        slug={slug}
      />
    </>
  );
}
