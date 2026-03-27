// api/analyze.js — Vercel Serverless Function
// Проксі між фронтендом і Anthropic API
// API ключ зберігається тільки тут, ніколи не потрапляє до браузера

export default async function handler(req, res) {
  // CORS — дозволяємо запити з нашого фронтенду
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Перевіряємо авторизацію через Supabase JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Валідуємо токен через Supabase
  const token = authHeader.split(" ")[1];
  const supabaseRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.SUPABASE_ANON_KEY,
    },
  });

  if (!supabaseRes.ok) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = await supabaseRes.json();

  // Проксіюємо запит до Anthropic
  const { messages, system } = req.body;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    // Логуємо використання (опціонально — для статистики)
    console.log(`User ${user.id} analyzed photo`);

    return res.status(200).json(data);
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res.status(500).json({ error: "API error", details: err.message });
  }
}
