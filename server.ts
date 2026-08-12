import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";

import crypto from "crypto";

// In-memory store for webhook events
const webhooks: any[] = [];
const clients: express.Response[] = [];

let cachedPubKey: crypto.KeyObject | null = null;

async function getPubKey(): Promise<crypto.KeyObject> {
  if (cachedPubKey) return cachedPubKey;
  
  const token = process.env.MONOBANK_X_TOKEN;
  if (!token) throw new Error("MONOBANK_X_TOKEN is not configured");
  
  const res = await fetch("https://api.monobank.ua/api/merchant/pubkey", {
    headers: { "X-Token": token }
  });
  if (!res.ok) throw new Error("Failed to fetch public key");
  
  const data = await res.json();
  
  // Create PEM format for ECDSA public key
  const pem = `-----BEGIN PUBLIC KEY-----\n${data.key}\n-----END PUBLIC KEY-----`;
  cachedPubKey = crypto.createPublicKey(pem);
  return cachedPubKey;
}

function verifySignature(pubKey: crypto.KeyObject, signatureBase64: string, rawBody: Buffer): boolean {
  const verify = crypto.createVerify('SHA256');
  verify.update(rawBody);
  return verify.verify(pubKey, Buffer.from(signatureBase64, 'base64'));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  
  // Store raw body for webhook signature validation
  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Cloud SQL Database endpoints
  app.post("/api/db/user/sync", async (req, res) => {
    try {
      const { uid, email, name, balance, cashBalance } = req.body;
      if (!uid || !email) {
        return res.status(400).json({ error: "Missing uid or email" });
      }
      const { getOrCreateUser } = await import("./src/db/users.ts");
      const user = await getOrCreateUser(uid, email, name);
      res.json({ status: "ok", user });
    } catch (e: any) {
      console.error("User sync error:", e);
      res.status(500).json({ error: e.message || "Failed to sync user" });
    }
  });

  // SSE Endpoint for real-time notifications
  app.get("/api/notifications/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial connection success
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

    clients.push(res);

    req.on("close", () => {
      const index = clients.indexOf(res);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
  });

  // Function to broadcast to all SSE clients
  function broadcast(data: any) {
    clients.forEach((client) => {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }

  // Webhook Receiver
  app.post("/api/webhook/monobank", async (req: any, res) => {
    const xSign = req.headers["x-sign"] as string;
    const rawBody = req.rawBody as Buffer;

    if (!xSign || !rawBody) {
      return res.status(400).send("Missing X-Sign header or raw body");
    }

    try {
      let pubKey = await getPubKey();
      let isValid = verifySignature(pubKey, xSign, rawBody);
      
      if (!isValid) {
        // Retry once by clearing cached key
        cachedPubKey = null;
        pubKey = await getPubKey();
        isValid = verifySignature(pubKey, xSign, rawBody);
      }

      if (!isValid) {
        return res.status(400).send("Invalid signature");
      }
    } catch (e) {
      console.error("Webhook verification error:", e);
      return res.status(500).send("Verification error");
    }

    console.log("Verified webhook from Monobank:", req.body);
    const event = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      payload: req.body,
    };
    webhooks.unshift(event);
    
    // Broadcast to UI
    broadcast({ type: 'webhook', event });

    res.status(200).send("OK");
  });

  // Get Webhook History
  app.get("/api/webhooks", (req, res) => {
    res.json(webhooks);
  });

  // Proxy to get Monobank statement
  app.get("/api/statement", async (req, res) => {
    const tokenStr = process.env.MONOBANK_X_TOKEN || '';
    const token = (!tokenStr || tokenStr.includes('MY_MONOBANK') || tokenStr.length < 20) ? 'mock' : tokenStr;
    
    if (token === 'mock') {
      return res.json({
        list: [
          {
            invoiceId: "mock_1",
            status: "success",
            amount: 50000,
            ccy: 980,
            createdDate: new Date(Date.now() - 3600000).toISOString(),
            modifiedDate: new Date(Date.now() - 3500000).toISOString(),
            reference: "Замовлення #1042"
          },
          {
            invoiceId: "mock_2",
            status: "failure",
            amount: 15000,
            ccy: 980,
            createdDate: new Date(Date.now() - 86400000).toISOString(),
            modifiedDate: new Date(Date.now() - 86000000).toISOString(),
            reference: "Оплата підписки"
          },
          {
            invoiceId: "mock_3",
            status: "success",
            amount: 125000,
            ccy: 980,
            createdDate: new Date(Date.now() - 172800000).toISOString(),
            modifiedDate: new Date(Date.now() - 172000000).toISOString(),
            reference: "Поповнення"
          }
        ]
      });
    }

    if (!token) {
      return res.status(400).json({ error: "MONOBANK_X_TOKEN is not configured." });
    }

    try {
      // By default fetch last 30 days if not provided
      const to = req.query.to ? Number(req.query.to) : Math.floor(Date.now() / 1000);
      const from = req.query.from ? Number(req.query.from) : to - 30 * 24 * 60 * 60;
      
      const response = await fetch(`https://api.monobank.ua/api/merchant/statement?from=${from}&to=${to}`, {
        headers: {
          "X-Token": token,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Monobank API Error: ${errorText}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching statement:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy to get invoice status
  app.get("/api/status", async (req, res) => {
    const tokenStr = process.env.MONOBANK_X_TOKEN || '';
    const token = (!tokenStr || tokenStr.includes('MY_MONOBANK') || tokenStr.length < 20) ? 'mock' : tokenStr;
    const id = req.query.id as string;
    
    if (token === 'mock') {
      return res.json({
        invoiceId: id,
        status: "success",
        amount: 10000,
        ccy: 980,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
      });
    }

    if (!token) return res.status(400).json({ error: "MONOBANK_X_TOKEN is not configured." });
    if (!id) return res.status(400).json({ error: "missing id parameter" });

    try {
      const response = await fetch(`https://api.monobank.ua/api/merchant/invoice/status?invoiceId=${id}`, {
        headers: { "X-Token": token },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Monobank API Error: ${errorText}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching status:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy to create an invoice
  app.post("/api/invoice", async (req, res) => {
    const tokenStr = process.env.MONOBANK_X_TOKEN || '';
    const token = (!tokenStr || tokenStr.includes('MY_MONOBANK') || tokenStr.length < 20) ? 'mock' : tokenStr;
    const appUrl = process.env.APP_URL;

    if (token === 'mock') {
      const invoiceId = `mock_inv_${Math.random().toString(36).substring(7)}`;
      
      // Simulate webhook after 3 seconds
      setTimeout(() => {
        const event = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          payload: {
            invoiceId,
            status: "success",
            amount: req.body.amount,
            ccy: req.body.ccy,
            reference: req.body.reference,
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString()
          }
        };
        webhooks.unshift(event);
        broadcast({ type: 'webhook', event });
      }, 3000);

      return res.json({
        invoiceId,
        pageUrl: `https://monobank.ua/`
      });
    }

    if (!token) {
      return res.status(400).json({ error: "MONOBANK_X_TOKEN is not configured." });
    }

    try {
      const webhookUrl = appUrl ? `${appUrl}/api/webhook/monobank` : undefined;
      const invoiceData = {
        ...req.body,
        webHookUrl: webhookUrl || req.body.webHookUrl,
      };

      const response = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
        method: "POST",
        headers: {
          "X-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Monobank API Error: ${errorText}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
