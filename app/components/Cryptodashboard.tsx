import Image from "next/image";
import {
  fetchTrendingCoins,
  fetchTopCategories,
  fetchCoinDetail,
  fmt,
  fmtPrice,
} from "@/lib/coingecko.actions";
import LineChart from "./LineChart";

// ── Types ──────────────────────────────────────────────────────────────────

type PricePoint = [number, number];

// ── Fetch price data (market_chart) ───────────────────────────────────────

async function fetchPrices(coinId: string, days: number): Promise<PricePoint[]> {
  const BASE = process.env.COINGECKO_BASE_URL ?? "https://api.coingecko.com/api/v3";
  const API_KEY = process.env.COINGECKO_API_KEY ?? "";

  const res = await fetch(
    `${BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
    {
      next: { revalidate: 60 },
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": API_KEY,
      },
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.prices ?? [];
}

// ── Change Badge ───────────────────────────────────────────────────────────

function ChangeBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className="flex items-center gap-1 text-sm font-medium" style={{ color: up ? "#76da44" : "#ff685f" }}>
      <span style={{ fontSize: 10 }}>{up ? "▲" : "▼"}</span>
      {up ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default async function CryptoDashboard() {
  const [trending, categories, btcDetail, prices] = await Promise.allSettled([
    fetchTrendingCoins(),
    fetchTopCategories(),
    fetchCoinDetail("bitcoin"),
    fetchPrices("bitcoin", 180),
  ]);

  const trendingCoins = trending.status === "fulfilled" ? trending.value : [];
  const topCategories = categories.status === "fulfilled" ? categories.value : [];
  const bitcoin = btcDetail.status === "fulfilled" ? btcDetail.value : null;
  const priceData = prices.status === "fulfilled" ? prices.value : [];

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6" style={{ background: "#0f1316", color: "#e8eaf0" }}>
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ── Top Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Line Chart */}
          <div className="lg:col-span-2 rounded-xl p-5" style={{ background: "#1a2027" }}>
            <div className="flex items-center gap-3 mb-5">
              {bitcoin?.image ? (
                <Image
                  src={bitcoin.image}
                  alt={bitcoin.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                  style={{ width: "40px", height: "40px" }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{ background: "#3D2A0A", color: "#F7931A" }}>₿</div>
              )}
              <div>
                <p className="text-xs" style={{ color: "#a3aed0" }}>
                  {bitcoin?.name ?? "Bitcoin"} / {bitcoin?.symbol ?? "BTC"}
                </p>
                <h2 className="text-2xl font-bold tracking-tight">
                  {bitcoin ? fmtPrice(bitcoin.price) : "—"}
                </h2>
              </div>
            </div>

            <LineChart
              initialPrices={priceData}
              coinId="bitcoin"
              price={bitcoin?.price ?? 0}
            />
          </div>

          {/* Trending Coins */}
          <div className="rounded-xl p-5" style={{ background: "#1a2027" }}>
            <h3 className="text-lg font-semibold mb-4">Trending Coins</h3>

            <div className="grid grid-cols-3 mb-3 px-1">
              {["Name", "24h Change", "Price"].map((h) => (
                <span
                  key={h}
                  className={`text-xs ${h === "Price" ? "text-right" : h === "24h Change" ? "text-center" : ""}`}
                  style={{ color: "#a3aed0" }}
                >
                  {h}
                </span>
              ))}
            </div>

            {trendingCoins.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#a3aed0" }}>No data</p>
            ) : (
              <div>
                {trendingCoins.map((coin) => (
                  <div
                    key={coin.id}
                    className="grid grid-cols-3 items-center px-1 py-2.5"
                    style={{ borderBottom: "1px solid #1e283380" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Image
                        src={coin.image}
                        alt={coin.name}
                        width={28}
                        height={28}
                        className="rounded-full shrink-0"
                        style={{ width: "28px", height: "28px" }}
                      />
                      <span className="text-sm font-medium truncate">{coin.name}</span>
                    </div>
                    <div className="flex justify-center">
                      <ChangeBadge value={coin.change24h} />
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{fmtPrice(coin.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Top Categories ── */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#1a2027" }}>
          <div className="px-6 pt-6 pb-3">
            <h3 className="text-lg font-semibold">Top Categories</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #1e2833" }}>
                  {["Category", "Top Gainers", "24h Change", "Market Cap", "24h Volume"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium" style={{ color: "#a3aed0" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm" style={{ color: "#a3aed0" }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  topCategories.map((cat) => (
                    <tr key={cat.id} style={{ borderBottom: "1px solid #1e283380" }}>
                      <td className="px-6 py-4 font-semibold text-sm">{cat.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          {cat.topCoinsImages.slice(0, 3).map((src, j) => (
                            <Image key={j} src={src} alt="coin" width={30} height={30}
                              className="rounded-full" style={{ width: "30px", height: "30px" }} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4"><ChangeBadge value={cat.marketCapChange24h} /></td>
                      <td className="px-6 py-4 text-sm font-medium">{fmt(cat.marketCap)}</td>
                      <td className="px-6 py-4 text-sm font-medium">{fmt(cat.volume24h)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}