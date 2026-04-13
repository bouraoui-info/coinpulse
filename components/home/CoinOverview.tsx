import { fetcher } from "@/lib/coingecko.actions";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

const CoinOverview = async () => {
  let coin;

  try {
    coin = await fetcher<CoinDetailsData>("/coins/bitcoin");
  } catch (error) {
    console.error("Error fetching coin overview:", error);
  }

  if (!coin) {
    return (
      <div id="coin-overview">
        <p className="text-red-500">Failed to load coin data.</p>
      </div>
    );
  }

  return (
    <div id="coin-overview">
      <div className="header pt-2">
        <Image
          src={coin.image?.large || "/placeholder.png"}
          alt={coin.name || "coin"}
          width={56}
          height={56}
        />
        <div className="info">
          <p>
            {coin.name} / {coin.symbol?.toUpperCase()}
          </p>
          <h1>
            {coin.market_data?.current_price?.usd
              ? formatCurrency(coin.market_data.current_price.usd)
              : "N/A"}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default CoinOverview;
