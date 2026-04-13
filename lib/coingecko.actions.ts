"use server";
import qs from "query-string";
const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;
if (!BASE_URL || !API_KEY) {
  throw new Error("Missing CoinGecko API configuration");
}
export async function fetcher<T>(
  endpoint: string,
  params?: QueryParams,
  revalidate = 60,
): Promise<T> {
  const url = qs.stringifyUrl(
    { url: `${BASE_URL}${endpoint}`, query: params },
    { skipEmptyString: true, skipNull: true },
  );
  const response = await fetch(url, {
    headers: {
      "x-cg-pro-api-key": API_KEY,
      "Content-Type": "application/json",
    } as Record<string, string>,
    next: { revalidate },
  });
  if (!response.ok) {
    const errorBody: CoinGeckoErrorBody = await response
      .json()
      .catch(() => ({}));
    throw new Error(
      `API Error ${response.status}: ${errorBody.error || response.statusText}`,
    );
  }
  return response.json();
}

// // ── Types ──────────────────────────────────────────────────────────────────

// export type TrendingCoin = {
//   id: string;
//   name: string;
//   symbol: string;
//   price: number;
//   change24h: number;
//   image: string;
// };

// export type TopCategory = {
//   id: number;
//   name: string;
//   marketCap: number;
//   marketCapChange24h: number;
//   volume24h: number;
//   topCoinsImages: string[];
// };

// export type OHLCCandle = [
//   timestamp: number,
//   open: number,
//   high: number,
//   low: number,
//   close: number,
// ];

// export type CoinDetail = {
//   id: string;
//   name: string;
//   symbol: string;
//   price: number;
//   image: string;
// };

// // ── Base ───────────────────────────────────────────────────────────────────

// // COINGECKO_API_KEY is server-only (no NEXT_PUBLIC_ prefix)
// // Never expose this key on the client side
// const BASE =
//   process.env.COINGECKO_BASE_URL ?? "https://pro-api.coingecko.com/api/v3";
// const API_KEY = process.env.COINGECKO_API_KEY ?? "";

// async function cg<T>(path: string): Promise<T> {
//   const res = await fetch(`${BASE}${path}`, {
//     next: { revalidate: 60 },
//     headers: {
//       accept: "application/json",
//       "x-cg-pro-api-key": API_KEY,
//     },
//   });

//   if (!res.ok) {
//     throw new Error(`CoinGecko ${res.status}: ${path}`);
//   }

//   return res.json();
// }

// // ── Fetchers ───────────────────────────────────────────────────────────────

// export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
//   const data = await cg<{
//     coins: {
//       item: {
//         id: string;
//         name: string;
//         symbol: string;
//         thumb: string;
//         data: {
//           price: number;
//           price_change_percentage_24h: { usd: number };
//         };
//       };
//     }[];
//   }>("/search/trending");

//   return data.coins.slice(0, 7).map(({ item }) => ({
//     id: item.id,
//     name: item.name,
//     symbol: item.symbol.toUpperCase(),
//     price: item.data?.price ?? 0,
//     change24h: item.data?.price_change_percentage_24h?.usd ?? 0,
//     image: item.thumb,
//   }));
// }

// export async function fetchTopCategories(): Promise<TopCategory[]> {
//   const data = await cg<
//     {
//       id: number;
//       name: string;
//       market_cap: number;
//       market_cap_change_24h: number;
//       volume_24h: number;
//       top_3_coins: string[];
//     }[]
//   >("/coins/categories?order=market_cap_desc");

//   return data.slice(0, 5).map((cat) => ({
//     id: cat.id,
//     name: cat.name,
//     marketCap: cat.market_cap,
//     marketCapChange24h: cat.market_cap_change_24h ?? 0,
//     volume24h: cat.volume_24h,
//     topCoinsImages: cat.top_3_coins ?? [],
//   }));
// }

// export async function fetchOHLC(
//   coinId: string,
//   days: number,
// ): Promise<OHLCCandle[]> {
//   return cg<OHLCCandle[]>(`/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`);
// }

// export async function fetchCoinDetail(coinId: string): Promise<CoinDetail> {
//   const data = await cg<{
//     id: string;
//     name: string;
//     symbol: string;
//     image: { thumb: string; small: string };
//     market_data: { current_price: { usd: number } };
//   }>(
//     `/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
//   );

//   return {
//     id: data.id,
//     name: data.name,
//     symbol: data.symbol.toUpperCase(),
//     price: data.market_data.current_price.usd,
//     image: data.image.small,
//   };
// }

// // ── Helpers ────────────────────────────────────────────────────────────────

// export function fmt(n: number): string {
//   if (n >= 1_000_000_000_000)
//     return "$" + (n / 1_000_000_000_000).toFixed(2) + "T";
//   if (n >= 1_000_000_000) return "$" + (n / 1_000_000_000).toFixed(2) + "B";
//   if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
//   return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
// }

// export function fmtPrice(n: number): string {
//   if (n >= 1000)
//     return (
//       "$" +
//       n.toLocaleString("en-US", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       })
//     );
//   if (n >= 1) return "$" + n.toFixed(2);
//   return "$" + n.toFixed(6);
// }
