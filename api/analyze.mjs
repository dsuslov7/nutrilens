export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No Bearer token" });
  }
  const token = authHeader.split(" ")[1];

  let user;
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY },
    });
    const b = await r.json();
    if (!r.ok) return res.status(401).json({ error: `Auth failed: ${b.message || r.status}` });
    user = b;
  } catch (e) {
    return res.status(500).json({ error: `Supabase error: ${e.message}` });
  }

  const { messages, system } = req.body;
  if (!messages || !system) return res.status(400).json({ error: "Missing body" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system, messages }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: `Anthropic error: ${data.error?.message || r.status}` });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: `Anthropic error: ${e.message}` });
  }
}
