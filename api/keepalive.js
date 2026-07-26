// Vercel Serverless Function — mantém o projeto Supabase ativo.
// Chamada pelo cron diário configurado em vercel.json.
export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return res.status(500).json({ error: 'Supabase não configurado.' });
  }

  try {
    const r = await fetch(`${url}/rest/v1/insumos?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    return res.status(200).json({
      ok: r.ok,
      status: r.status,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
