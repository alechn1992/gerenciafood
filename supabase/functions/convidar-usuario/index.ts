import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Sem redirectTo explícito o Supabase usa o Site URL do projeto — que por
  // padrão é http://localhost:3000 e gera um link quebrado para o convidado.
  // O destino ainda precisa constar na allow-list de Redirect URLs do projeto.
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://gerenciafood.vercel.app'
  const redirectTo = `${siteUrl}/definir-senha`

  const telasPadrao = ['clientes', 'cardapio', 'pratos', 'insumos', 'relatorio']
  const telasFinais = telas ?? telasPadrao

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })

  if (error) {
    if (!/already.*registered/i.test(error.message)) {
      return respJSON({ error: error.message }, 400)
    }

    // Conta já existe. Acontece quando o convite anterior foi consumido mas o
    // convidado não chegou a definir a senha (ex.: link apontando para um
    // destino inválido). Reenviar convite é recusado pelo Supabase, então
    // mandamos um link de recuperação — que leva à mesma tela.
    const existente = await acharPorEmail(admin, email)
    if (!existente) {
      return respJSON({ error: 'E-mail já cadastrado, mas a conta não foi localizada.' }, 400)
    }

    await admin.from('perfis').upsert({
      id: existente.id,
      email: existente.email ?? email,
      telas: telasFinais,
      admin: false,
    })

    const { error: erroLink } = await admin.auth.resetPasswordForEmail(email, { redirectTo })
    if (erroLink) return respJSON({ error: erroLink.message }, 400)

    return respJSON({ ok: true, reenviado: true })
  }

  // Cria o perfil com as permissões escolhidas
  await admin.from('perfis').upsert({
    id: data.user.id,
    email: data.user.email ?? email,
    telas: telasFinais,
    admin: false,
  })

  return respJSON({ ok: true })
})

/**
 * Localiza um usuário pelo e-mail. A API admin não expõe busca direta, então
 * paginamos — com teto, para não varrer indefinidamente caso a base cresça.
 */
async function acharPorEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<{ id: string; email?: string } | null> {
  const alvo = email.trim().toLowerCase()
  const porPagina = 200

  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: porPagina })
    if (error || !data?.users?.length) return null

    const achado = data.users.find((u) => u.email?.toLowerCase() === alvo)
    if (achado) return { id: achado.id, email: achado.email }

    if (data.users.length < porPagina) return null
  }
  return null
}

function respJSON(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
