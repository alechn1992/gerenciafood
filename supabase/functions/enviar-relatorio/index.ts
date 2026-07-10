import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Remetente: configure um domínio verificado no Resend e troque este valor.
// Sem domínio verificado, use 'onboarding@resend.dev' (funciona em sandbox).
const FROM = 'GerenciaFood <onboarding@resend.dev>'

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

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return respJSON({ error: 'RESEND_API_KEY não configurada' }, 500)

  const body = await req.json()
  const {
    destinatario,
    clienteNome,
    avaliador,
    registroCRN,
    dataAvaliacao,
    indice,
    conformes,
    naoConformes,
    itens,
  } = body as {
    destinatario: string
    clienteNome: string
    avaliador: string
    registroCRN: string
    dataAvaliacao: string
    indice: number
    conformes: number
    naoConformes: number
    itens: Array<{ texto: string; referencia: string; situacao: string; observacao: string }>
  }

  if (!destinatario) return respJSON({ error: 'E-mail destinatário obrigatório' }, 400)

  const html = gerarHTML({ clienteNome, avaliador, registroCRN, dataAvaliacao, indice, conformes, naoConformes, itens })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [destinatario],
      subject: `Relatório de Segurança dos Alimentos — ${clienteNome}`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) return respJSON({ error: (data as { message?: string }).message ?? 'Erro ao enviar' }, 400)
  return respJSON({ ok: true })
})

function respJSON(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function badge(s: string) {
  if (s === 'conforme')
    return '<span style="background:#dcf5e7;color:#166534;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;">✓ Conforme</span>'
  if (s === 'nao_conforme')
    return '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;">✗ Não conforme</span>'
  if (s === 'na')
    return '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;">◌ N/A</span>'
  return '<span style="color:#9ca3af;">—</span>'
}

function gerarHTML(p: {
  clienteNome: string
  avaliador: string
  registroCRN: string
  dataAvaliacao: string
  indice: number
  conformes: number
  naoConformes: number
  itens: Array<{ texto: string; referencia: string; situacao: string; observacao: string }>
}): string {
  const rows = p.itens
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;vertical-align:top;">
        <div>${item.texto}</div>
        <div style="color:#6b7280;font-size:11px;margin-top:2px;">${item.referencia}</div>
        ${item.observacao ? `<div style="font-size:11px;font-style:italic;margin-top:4px;">Obs.: ${item.observacao}</div>` : ''}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;white-space:nowrap;">${badge(item.situacao)}</td>
    </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Relatório de Segurança dos Alimentos</title></head>
<body style="margin:0;padding:24px;font-family:system-ui,-apple-system,sans-serif;background:#f6f9f7;color:#1c2b24;">
  <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#145636;color:#fff;padding:24px 28px;">
      <h1 style="margin:0 0 4px;font-size:20px;">Relatório de Segurança dos Alimentos</h1>
      <p style="margin:0;font-size:14px;opacity:.8;">Checklist de Boas Práticas — RDC ANVISA nº 216/2004</p>
    </div>
    <div style="padding:24px 28px;">
      <table style="width:100%;margin-bottom:20px;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;font-size:14px;"><strong>Estabelecimento:</strong> ${p.clienteNome}</td>
          <td style="padding:4px 0;font-size:14px;text-align:right;"><strong>Data:</strong> ${p.dataAvaliacao}</td>
        </tr>
        ${p.avaliador ? `<tr><td colspan="2" style="padding:4px 0;font-size:14px;"><strong>Avaliador:</strong> ${p.avaliador}${p.registroCRN ? ` — ${p.registroCRN}` : ''}</td></tr>` : ''}
      </table>

      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="flex:1;background:#e8f5ee;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#145636;">${p.indice}%</div>
          <div style="font-size:12px;color:#6b7280;">Índice de conformidade</div>
        </div>
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#145636;">${p.conformes}</div>
          <div style="font-size:12px;color:#6b7280;">Conformes</div>
        </div>
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:${p.naoConformes > 0 ? '#b4531a' : '#145636'};">${p.naoConformes}</div>
          <div style="font-size:12px;color:#6b7280;">Não conformes</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;border-bottom:2px solid #e5e7eb;">Item verificado</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;border-bottom:2px solid #e5e7eb;width:130px;">Situação</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="margin-top:24px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
        Gerado pelo GerenciaFood · Este relatório não substitui a fiscalização da vigilância sanitária.
      </p>
    </div>
  </div>
</body>
</html>`
}
