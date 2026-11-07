# bch.now

The easiest way to get Bitcoin Cash. Live at [bch.now](https://bch.now).

Swap BTC, ETH, USDT, USDC, SOL, LTC, DOGE or XRP for Bitcoin Cash, or back again, paid straight to your own wallet.

## bch.now never holds your coins

Swaps are processed by [SideShift](https://sideshift.ai). When you start a swap:

1. bch.now asks SideShift to create the swap with the address you want to be paid to.
2. SideShift returns a deposit address. You send your coins there, to SideShift, not to bch.now.
3. SideShift exchanges them and pays out directly to your address.

bch.now has no wallet, holds no keys and never touches user funds. You can check this in the code:

- [`src/app/api/swap/shift/route.ts`](src/app/api/swap/shift/route.ts) creates the swap with SideShift.
- [`src/lib/sideshift.ts`](src/lib/sideshift.ts) is the only place that talks to SideShift.

## Check your deposit address

Every swap screen has a **Check it matches on SideShift** button. It opens your order on sideshift.ai, where you can confirm the deposit address shown on bch.now is the one SideShift issued. If they ever differ, don't send.

## Fees

bch.now earns SideShift's affiliate commission, built into the exchange rate (0.5% by default, capped at 2% in code). There are no other fees from bch.now. Network fees and SideShift's own spread still apply.

## Data

Prices come from CoinGecko, chain stats from Blockchair and Haskoin. Swaps may be unavailable in some countries, as decided by SideShift.

## Run it yourself

```bash
npm install
npm run dev
```

Swaps need `SIDESHIFT_AFFILIATE_ID` and `SIDESHIFT_SECRET` in `.env.local`. Without them the site runs with swaps switched off.

Not financial advice.
