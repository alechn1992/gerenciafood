// Busca os alunos no GerenciaEPS (FinanceDesk) para a importação de crianças.
// A chave da API fica só aqui no servidor (secret EPS_API_KEY no Supabase);
// o navegador nunca a vê. Só usuários logados podem chamar.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const URL_PADRAO = 'https://financedesk-tan.vercel.app/api/public/alunos'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return respJSON({ error: 'Não autenticado' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return respJSON({ error: 'Não autenticado' }, 401)

  const chave = Deno.env.get('EPS_API_KEY')
  if (!chave) {
    return respJSON(
      { error: 'A chave da API do GerenciaEPS ainda não foi cadastrada no Supabase (secret EPS_API_KEY).' },
      500,
    )
  }
  const base = Deno.env.get('EPS_API_URL') || URL_PADRAO

  let desde: string | undefined
  try {
    const body = await req.json()
    if (typeof body?.desde === 'string' && /^\d{4}-\d{2}-\d{2}/.test(body.desde)) desde = body.desde
  } catch {
    // sem corpo: busca todos
  }

  const url = new URL(base)
  if (desde) url.searchParams.set('desde', desde)

  try {
    const resp = await fetch(url, { headers: { 'X-API-Key': chave, Accept: 'application/json' } })
    const texto = await resp.text()
    if (!resp.ok) {
      const motivo =
        resp.status === 401 || resp.status === 403
          ? 'o GerenciaEPS recusou a chave da API (confira o secret EPS_API_KEY)'
          : `o GerenciaEPS respondeu com erro ${resp.status}`
      return respJSON({ error: `Não foi possível buscar os alunos: ${motivo}.` }, 502)
    }
    let dados: unknown
    try {
      dados = JSON.parse(texto)
    } catch {
      return respJSON({ error: 'O GerenciaEPS respondeu algo que não é JSON.' }, 502)
    }
    const alunos = Array.isArray(dados)
      ? dados
      : Array.isArray((dados as { alunos?: unknown[] })?.alunos)
        ? (dados as { alunos: unknown[] }).alunos
        : Array.isArray((dados as { data?: unknown[] })?.data)
          ? (dados as { data: unknown[] }).data
          : null
    if (!alunos) return respJSON({ error: 'Resposta do GerenciaEPS sem a lista de alunos.' }, 502)
    return respJSON({ alunos, buscadoEm: new Date().toISOString() })
  } catch (e) {
    return respJSON({ error: `Sem resposta do GerenciaEPS: ${e instanceof Error ? e.message : String(e)}` }, 502)
  }
})

function respJSON(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
