import express, { Request, Response } from "express";

const app = express();

app.get("/btc", async (_req: Request, res: Response) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const r = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
      headers: {
        "User-Agent": "btc-proxy/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!r.ok) {
      return res.status(502).json({
        error: "upstream_error",
        status: r.status,
      });
    }

    const json: any = await r.json();
    const price = Number(json?.data?.amount);

    if (!Number.isFinite(price)) {
      return res.status(502).json({
        error: "invalid_price",
      });
    }

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.json({
      symbol: "BTC",
      currency: "USD",
      price,
      source: "coinbase",
      ts: Date.now(),
    });
  } catch (err) {
    return res.status(500).json({
      error: "proxy_error",
      message: String(err),
    });
  }
});

export default app;
