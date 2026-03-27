module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server misconfigured: missing env vars" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: no Bearer token" });
  }
  const token = authHeader.split(" ")[1];

  let user;
  try {
    const supabaseRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.SUPABASE_ANON_KEY,
      },
    });
    const body = await supabaseRes.json();
    if (!supabaseRes.ok) {
      return res.status(401).json({ error: `Auth failed: ${body.message || body.error || supabaseRes.status}` });
    }
    user = body;
  } catch (err) {
    return res.status(500).json({ error: `Supabase connection error: ${err.message}` });
  }

  const { messages, system } = req.body;
  if (!messages || !system) {
    return res.status(400).json({ error: "Missing messages or system" });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_
