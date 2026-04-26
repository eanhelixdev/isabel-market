import "server-only";

import { demoProducts, demoSeller, getDemoProduct } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductCard, ProductDetail, SellerPublicProfile } from "@/types/marketplace";

type ProductFilters = {
  q?: string;
  min?: string;
  max?: string;
  year?: string;
  seller?: string;
  sort?: string;
};

export async function getMarketplaceProducts(filters: ProductFilters = {}) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return filterDemoProducts(filters);

  let query = supabase
    .from("product_cards")
    .select("*")
    .eq("status", "approved")
    .limit(36);

  if (filters.q) {
    query = query.textSearch("search_document", filters.q, {
      type: "websearch",
      config: "spanish",
    });
  }

  if (filters.min) query = query.gte("price", Number(filters.min));
  if (filters.max) query = query.lte("price", Number(filters.max));
  if (filters.year) query = query.lte("year", Number(filters.year));
  if (filters.seller) query = query.ilike("seller_name", `%${filters.seller}%`);

  if (filters.sort === "popular") {
    query = query.order("likes_count", { ascending: false });
  } else if (filters.sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (filters.sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("approved_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error || !data) {
    logSupabaseError("marketplace products", error);
    return shouldUseDemoFallback() ? filterDemoProducts(filters) : [];
  }
  return signProductCards(data as ProductCard[]);
}

export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return getDemoProduct(id);

  const { data: product, error: productError } = await supabase
    .from("product_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (productError) {
    logSupabaseError("product detail", productError);
    return shouldUseDemoFallback() ? getDemoProduct(id) : null;
  }

  if (!product) return shouldUseDemoFallback() ? getDemoProduct(id) : null;

  const { data: rawProduct, error: rawProductError } = await supabase
    .from("products")
    .select("material, dimensions, origin_story, rejection_reason")
    .eq("id", id)
    .maybeSingle();

  if (rawProductError) logSupabaseError("product metadata", rawProductError);

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("id, image_url, sort_order")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (imagesError) logSupabaseError("product images", imagesError);

  const signedImages = await signImages(images ?? []);

  return {
    ...(product as ProductCard),
    image_url: await signImage((product as ProductCard).image_url),
    material: rawProduct?.material ?? null,
    dimensions: rawProduct?.dimensions ?? null,
    origin_story: rawProduct?.origin_story ?? null,
    rejection_reason: rawProduct?.rejection_reason ?? null,
    images: signedImages,
  };
}

export async function getSellerPublicProfile(
  sellerId: string,
): Promise<SellerPublicProfile | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoSeller;

  const { data, error } = await supabase
    .from("seller_public_profiles")
    .select("*")
    .eq("id", sellerId)
    .maybeSingle();

  if (error) {
    logSupabaseError("seller profile", error);
    return shouldUseDemoFallback() ? demoSeller : null;
  }

  return (data as SellerPublicProfile | null) ?? (shouldUseDemoFallback() ? demoSeller : null);
}

export async function getSellerProducts(sellerId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return demoProducts.filter((product) => product.seller_id === sellerId);

  const { data, error } = await supabase
    .from("product_cards")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(24);

  if (error) {
    logSupabaseError("seller products", error);
    return shouldUseDemoFallback()
      ? demoProducts.filter((product) => product.seller_id === sellerId)
      : [];
  }

  return signProductCards((data as ProductCard[] | null) ?? []);
}

function shouldUseDemoFallback() {
  return !hasSupabaseEnv();
}

function logSupabaseError(scope: string, error: unknown) {
  if (!error) return;
  console.error(`[isabel-market] Supabase ${scope} failed`, error);
}

function filterDemoProducts(filters: ProductFilters) {
  const query = filters.q?.toLowerCase();
  return demoProducts
    .filter((product) => {
      if (query && !`${product.title} ${product.description}`.toLowerCase().includes(query)) {
        return false;
      }
      if (filters.min && product.price < Number(filters.min)) return false;
      if (filters.max && product.price > Number(filters.max)) return false;
      if (filters.year && product.year && product.year > Number(filters.year)) return false;
      if (
        filters.seller &&
        !product.seller_name?.toLowerCase().includes(filters.seller.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "popular") return b.likes_count - a.likes_count;
      if (filters.sort === "price_asc") return a.price - b.price;
      if (filters.sort === "price_desc") return b.price - a.price;
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });
}

async function signProductCards(products: ProductCard[]) {
  return Promise.all(
    products.map(async (product) => ({
      ...product,
      image_url: await signImage(product.image_url),
    })),
  );
}

async function signImages(
  images: Array<{ id: string; image_url: string; sort_order: number }>,
) {
  return Promise.all(
    images.map(async (image) => ({
      ...image,
      image_url: (await signImage(image.image_url)) ?? image.image_url,
    })),
  );
}

async function signImage(pathOrUrl: string | null) {
  if (!pathOrUrl || pathOrUrl.startsWith("http")) return pathOrUrl;
  const admin = createAdminSupabaseClient();
  if (!admin) return pathOrUrl;
  const { data } = await admin.storage
    .from("product-images-private")
    .createSignedUrl(pathOrUrl, 60 * 60);
  return data?.signedUrl ?? pathOrUrl;
}
