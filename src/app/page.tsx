import { MarketplaceHome } from "@/features/marketplace/marketplace-home";
import { getMarketplaceProducts } from "@/lib/marketplace-data";

export default async function HomePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const products = await getMarketplaceProducts({
    q: asString(searchParams.q),
    min: asString(searchParams.min),
    max: asString(searchParams.max),
    year: asString(searchParams.year),
    seller: asString(searchParams.seller),
    sort: asString(searchParams.sort),
  });

  return <MarketplaceHome initialProducts={products} />;
}

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
