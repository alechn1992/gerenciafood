import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

  // Verifica se o chamador é admin
  const { data: perfil } = await supabase
    .from('perfis')
    .select('admin')
    .eq('id', user.id)
    .single()

  if (!perfil?.admin) {
    return respJSON({ error: 'Acesso negado. Apenas administradores podem convidar usuários.' }, 403)
  }

  const { email, telas } = await req.json() as { email: string; telas: string[] }
  if (!email) return respJSON({ error: 'E-mail obrigatório' }, 400)

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceKey) return respJSON({ error: 'Configuração do servidor incompleta' }, 500)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

  // Envia convite por e-mail
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email)
  if (error) return respJSON({ error: error.message }, 400)

  const telasPadrao = ['clientes', 'cardapio', 'pratos', 'insumos', 'relatorio']

  // Cria o perfil com as permissões escolhidas
  await admin.from('perfis').upsert({
    id: data.user.id,
    email: data.user.email ?? email,
    telas: telas ?? telasPadrao,
    admin: false,
  })

  return respJSON({ ok: true })
})

function respJSON(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
