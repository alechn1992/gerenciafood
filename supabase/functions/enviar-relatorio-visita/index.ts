import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FROM = 'GerenciaFood <noreply@escolapontedosaber.com.br>'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ItemVisita {
  descricao: string
  status: 'conforme' | 'nao_conforme'
}

interface SecaoVisita {
  nome: string
  itens: ItemVisita[]
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
    consultor,
    emailConsultor,
    data,
    hora,
    tipo,
    observacoes,
    secoes,
    proximaVisita,
  } = body as {
    destinatario: string
    clienteNome: string
    consultor: string
    emailConsultor?: string
    data: string
    hora?: string
    tipo: string
    observacoes?: string
    secoes: SecaoVisita[]
    proximaVisita?: string
  }

  if (!destinatario) return respJSON({ error: 'E-mail destinatário obrigatório' }, 400)

  const html = gerarHTML({ clienteNome, consultor, emailConsultor, data, hora, tipo, observacoes, secoes, proximaVisita })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [destinatario],
      subject: `Relatório de Visita — ${clienteNome} (${data})`,
      html,
    }),
  })

  const resData = await res.json()
  if (!res.ok) return respJSON({ error: (resData as { message?: string }).message ?? 'Erro ao enviar' }, 400)
  return respJSON({ ok: true })
})

function respJSON(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function icone(status: 'conforme' | 'nao_conforme') {
  return status === 'conforme'
    ? '<span style="color:#16a34a;font-weight:700;">✔</span>'
    : '<span style="color:#dc2626;font-weight:700;">✘</span>'
}

function gerarHTML(p: {
  clienteNome: string
  consultor: string
  emailConsultor?: string
  data: string
  hora?: string
  tipo: string
  observacoes?: string
  secoes: SecaoVisita[]
  proximaVisita?: string
}): string {
  const secoesHTML = p.secoes.map((s) => `
    <div style="margin-bottom:20px;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="background:#f59e0b;color:#fff;font-weight:700;font-size:14px;padding:8px 14px;">${s.nome}</div>
      <ul style="list-style:none;margin:0;padding:10px 14px;">
        ${s.itens.map((item) => `
          <li style="display:flex;gap:10px;align-items:flex-start;padding:5px 0;font-size:14px;border-bottom:1px solid #f0f0f0;">
            ${icone(item.status)}
            <span>${item.descricao}</span>
          </li>`).join('')}
        ${s.itens.length === 0 ? '<li style="color:#9ca3af;font-style:italic;">Nenhum item registrado.</li>' : ''}
      </ul>
    </div>`).join('')

  const totalConformes = p.secoes.reduce((acc, s) => acc + s.itens.filter((i) => i.status === 'conforme').length, 0)
  const totalNaoConformes = p.secoes.reduce((acc, s) => acc + s.itens.filter((i) => i.status === 'nao_conforme').length, 0)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Relatório de Visita</title></head>
<body style="margin:0;padding:24px;font-family:system-ui,-apple-system,sans-serif;background:#f6f6f6;color:#1a1a1a;">
  <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#f59e0b;color:#fff;padding:24px 28px;">
      <h1 style="margin:0 0 4px;font-size:20px;">Relatório de Visita</h1>
      <p style="margin:0;font-size:14px;opacity:.85;">Visita do dia ${p.data}</p>
    </div>
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
        <tr>
          <td style="padding:5px 10px;border:1px solid #ccc;background:#f5f5f5;font-weight:600;width:130px;">Cliente:</td>
          <td style="padding:5px 10px;border:1px solid #ccc;" colspan="3"><strong>${p.clienteNome}</strong></td>
        </tr>
        ${p.consultor ? `<tr>
          <td style="padding:5px 10px;border:1px solid #ccc;background:#f5f5f5;font-weight:600;">Consultor(a):</td>
          <td style="padding:5px 10px;border:1px solid #ccc;">${p.consultor}</td>
          ${p.emailConsultor ? `<td style="padding:5px 10px;border:1px solid #ccc;background:#f5f5f5;font-weight:600;">E-mail:</td><td style="padding:5px 10px;border:1px solid #ccc;">${p.emailConsultor}</td>` : '<td colspan="2" style="border:1px solid #ccc;"></td>'}
        </tr>` : ''}
        <tr>
          <td style="padding:5px 10px;border:1px solid #ccc;background:#f5f5f5;font-weight:600;">Data:</td>
          <td style="padding:5px 10px;border:1px solid #ccc;">${p.data}${p.hora ? ` às ${p.hora}` : ''}</td>
          <td style="padding:5px 10px;border:1px solid #ccc;background:#f5f5f5;font-weight:600;">Tipo:</td>
          <td style="padding:5px 10px;border:1px solid #ccc;">${p.tipo}</td>
        </tr>
      </table>

      ${p.observacoes ? `<div style="background:#f9f9f9;border:1px solid #e0e0e0;border-left:4px solid #f59e0b;padding:10px 14px;margin-bottom:20px;font-size:14px;border-radius:4px;">
        <strong>Observações Gerais / Objetivo:</strong> ${p.observacoes}
      </div>` : ''}

      ${(totalConformes + totalNaoConformes) > 0 ? `<div style="display:flex;gap:16px;margin-bottom:20px;">
        <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#16a34a;">${totalConformes}</div>
          <div style="font-size:12px;color:#6b7280;">Conformes</div>
        </div>
        <div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#dc2626;">${totalNaoConformes}</div>
          <div style="font-size:12px;color:#6b7280;">Não conformes</div>
        </div>
      </div>` : ''}

      ${secoesHTML}

      ${p.proximaVisita ? `<div style="margin:20px 0;padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:14px;">
        <strong>Próxima visita agendada:</strong> ${p.proximaVisita}
      </div>` : ''}

      ${p.consultor ? `<div style="margin-top:48px;padding-top:16px;border-top:1px solid #e0e0e0;text-align:center;">
        <div style="display:inline-block;text-align:center;">
          <div style="border-bottom:1px solid #333;width:220px;margin:0 auto 8px;"></div>
          <p style="margin:2px 0;font-size:14px;">${p.consultor}</p>
          ${p.emailConsultor ? `<p style="margin:2px 0;font-size:12px;color:#6b7280;">${p.emailConsultor}</p>` : ''}
        </div>
      </div>` : ''}

      <p style="margin-top:24px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
        Gerado pelo GerenciaFood em ${new Date().toLocaleDateString('pt-BR')}
      </p>
    </div>
  </div>
</body>
</html>`
}
