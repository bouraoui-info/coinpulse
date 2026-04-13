import { fetcher } from "@/lib/coingecko.actions";
import DataTable from "../DataTable";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

export const TrendingCoin = async () => {
  let trendingCoins;

  try {
    trendingCoins = await fetcher<{ coins: TrendingCoin[] }>(
      "/search/trending",
      undefined,
      300,
    );
  } catch (error) {
    console.error("Error fetching trending coins:", error);
  }

  const columns: DataTableColumn<TrendingCoin>[] = [
    {
      header: "Name",
      cellClassName: "name-cell",
      cell: (coin) => {
        const item = coin.item;
        return (
          <Link href={`/coins/${item.id}`}>
            <Image
              src={item.large}
              alt={`${item.name}`}
              width={24}
              height={36}
            />
            <p>{item.name}</p>
          </Link>
        );
      },
    },
    {
      header: "24 h Change",
      cellClassName: "name-cell",
      cell: (coin) => {
        const item = coin.item;
        const change = item.data?.price_change_percentage_24h?.usd ?? 0;
        const isTrendingUp = change > 0;

        return (
          <div
            className={cn(
              "price-change",
              isTrendingUp ? "text-green-500" : "text-red-500",
            )}
          >
            <p>
              {isTrendingUp ? (
                <TrendingUp width={16} height={16} />
              ) : (
                <TrendingDown width={16} height={16} />
              )}
              {change}%
            </p>
          </div>
        );
      },
    },
    {
      header: "Price",
      cellClassName: "price-cell",
      cell: (coin) => coin.item.data?.price ?? "N/A",
    },
  ];

  return (
    <div id="trending-coins">
      <h4>Trending Coins</h4>

      {!trendingCoins ? (
        <p className="text-red-500">Failed to load trending coins.</p>
      ) : (
        <DataTable
          data={trendingCoins.coins?.slice(0, 6) || []}
          columns={columns}
          rowKey={(coin) => coin.item.id}
          tableClassName="trending-coins-table"
          headerCellClassName="py-3!"
          bodyCellClassName="py-2!"
        />
      )}
    </div>
  );
};
