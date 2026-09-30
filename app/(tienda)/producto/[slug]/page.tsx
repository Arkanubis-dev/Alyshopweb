import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
  getStoreSettings,
} from "@/lib/supabase/queries";
import { ProductDetailView } from "@/components/tienda/ProductDetailView";
import { formatCOP } from "@/lib/utils";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alyshop.co";

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Producto no encontrado | alyshop",
    };
  }

  const primaryImage = product.images[0]?.url || `${baseUrl}/og-image.jpg`;
  const productUrl = `${baseUrl}/producto/${product.slug}`;

  return {
    title: `${product.name} | alyshop Colombia`,
    description: `${product.name} por ${formatCOP(product.price)}. ${product.description.slice(0, 150)}... Pide fácil por WhatsApp en alyshop Colombia.`,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      type: "website",
      url: productUrl,
      title: `${product.name} | alyshop Colombia`,
      description: `${product.name} por ${formatCOP(product.price)}. Envíos rápidos y seguros a toda Colombia.`,
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | alyshop`,
      description: `${product.name} por ${formatCOP(product.price)}. Envíos a toda Colombia.`,
      images: [primaryImage],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, settings] = await Promise.all([
    getRelatedProducts(product.category_id, product.id, 4),
    getStoreSettings(),
  ]);

  const whatsappNumber =
    settings?.whatsapp?.number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573213052913";

  // Product JSON-LD structured data for Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.images.map((img) => img.url),
    description: product.description,
    sku: product.sku || product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || "alyshop",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/producto/${product.slug}`,
      priceCurrency: "COP",
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "alyshop Colombia",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating_avg.toString(),
      reviewCount: Math.max(1, product.rating_count).toString(),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
        whatsappNumber={whatsappNumber}
      />
    </>
  );
}
