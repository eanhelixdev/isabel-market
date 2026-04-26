import type { ProductCard, ProductDetail, SellerPublicProfile } from "@/types/marketplace";

const now = new Date().toISOString();

export const demoProducts: ProductCard[] = [
  {
    id: "demo-gramophone",
    seller_id: "demo-seller-isabel",
    title: "Gramofono Victor de mesa",
    description:
      "Pieza de coleccion con bocina interna, madera restaurada y mecanismo conservado.",
    year: 1918,
    price: 520000,
    currency: "ARS",
    status: "approved",
    category: "Musica",
    condition: "Muy bueno",
    location: "San Telmo, CABA",
    approved_at: now,
    created_at: now,
    image_url:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
    likes_count: 124,
    seller_name: "Casa Isabel",
    seller_avatar_url: null,
    seller_reputation_score: 94,
  },
  {
    id: "demo-mirror",
    seller_id: "demo-seller-valen",
    title: "Espejo frances biselado",
    description:
      "Marco tallado a mano con pátina original. Ideal para entrada o vestidor.",
    year: 1880,
    price: 380000,
    currency: "ARS",
    status: "approved",
    category: "Decoracion",
    condition: "Bueno",
    location: "Recoleta, CABA",
    approved_at: now,
    created_at: now,
    image_url:
      "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80",
    likes_count: 89,
    seller_name: "Valentina R.",
    seller_avatar_url: null,
    seller_reputation_score: 78,
  },
  {
    id: "demo-watch",
    seller_id: "demo-seller-isabel",
    title: "Reloj de bolsillo suizo",
    description:
      "Caja niquelada, esfera esmaltada y movimiento revisado por relojero.",
    year: 1932,
    price: 245000,
    currency: "ARS",
    status: "approved",
    category: "Joyeria",
    condition: "Excelente",
    location: "La Plata",
    approved_at: now,
    created_at: now,
    image_url:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=80",
    likes_count: 211,
    seller_name: "Casa Isabel",
    seller_avatar_url: null,
    seller_reputation_score: 94,
  },
];

export function getDemoProduct(id: string): ProductDetail | null {
  const product = demoProducts.find((item) => item.id === id) ?? demoProducts[0];
  if (!product) return null;
  return {
    ...product,
    material: "Madera, metal y vidrio",
    dimensions: "42 x 31 x 28 cm",
    origin_story:
      "Seleccionado en una sucesion familiar y revisado antes de su publicacion.",
    rejection_reason: null,
    images: [
      {
        id: `${product.id}-image-1`,
        image_url: product.image_url ?? "",
        sort_order: 0,
      },
      {
        id: `${product.id}-image-2`,
        image_url:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        sort_order: 1,
      },
    ],
  };
}

export const demoSeller: SellerPublicProfile = {
  id: "demo-seller-isabel",
  user_id: "demo-user",
  display_name: "Casa Isabel",
  avatar_url: null,
  gender: null,
  age: null,
  role: "user",
  onboarding_completed: true,
  reputation_score: 94,
  created_at: now,
  updated_at: now,
  approved_products_count: 18,
  sold_products_count: 12,
  likes_received_count: 824,
};
