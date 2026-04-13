import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.COINGECKO_BASE_URL ?? "https://api.coingecko.com/api/v3";
const API_KEY = process.env.COINGECKO_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const coinId = searchParams.get("coinId") ?? "bitcoin";
  const days = searchParams.get("days") ?? "180";

  try {
    const res = await fetch(
      `${BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": API_KEY,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "CoinGecko error" }, { status: res.status });
    }

    const data = await res.json();
    // Return only prices array: [[timestamp, price], ...]
    return NextResponse.json(data.prices ?? []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}