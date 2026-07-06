# GerenciaFood

Sistema para **geração automática de cardápios** para serviços de alimentação,
personalizado às particularidades de cada cliente, com **relatórios de segurança
dos alimentos** baseados na legislação vigente.

## Principais recursos

- **Clientes com particularidades**: defina os dias de operação (inclusive
  finais de semana) e as refeições servidas por dia — cada refeição com sua
  própria composição (nº de proteínas, acompanhamentos, saladas, etc.).
- **Banco de pratos**: cadastro de pratos por categoria, com marcação de
  restrições alimentares atendidas (sem glúten, sem lactose, vegetariano…).
- **Geração automática de cardápios semanais**: respeita dias de operação,
  refeições configuradas e restrições do cliente, maximizando a variedade
  (evita repetição em dias consecutivos e só repete um prato após esgotar as
  opções da categoria). Geração determinística por *seed*.
- **Relatórios por cliente**: checklist de Boas Práticas com **índice de
  conformidade**, POPs obrigatórios e referências normativas, pronto para
  imprimir / exportar em PDF.

## Legislação contemplada nos relatórios

- **RDC ANVISA nº 216/2004** — Regulamento Técnico de Boas Práticas para
  Serviços de Alimentação (norma federal base).
- **Estado do Paraná**: Resoluções da SESA-PR (ex.: nº 465/2013 — transporte de
  alimentos) e Código de Saúde do Paraná (Lei nº 13.331/2001).

> O conteúdo normativo é material de apoio operacional/educativo e não substitui
> a consulta à íntegra das normas nem a fiscalização da vigilância sanitária.

## Tecnologias

- **React + Vite + TypeScript** (frontend)
- **Supabase (Postgres)** para persistência (opcional)
- Motor de geração de cardápios em TypeScript puro, com testes (Vitest)

## Como rodar

```bash
npm install
npm run dev      # aplicação em http://localhost:5173
```

Sem configuração adicional, o app funciona em **modo local** (dados salvos no
navegador), já com pratos e tipos de refeição de exemplo.

### Persistência com Supabase (opcional)

1. Crie um projeto no Supabase e rode as migrações de `supabase/migrations/`.
2. Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Com as variáveis definidas, o app passa a persistir os dados no Postgres.
Habilite RLS e políticas de acesso antes de expor em produção (ver comentário
em `supabase/migrations/0001_init.sql`).

## Scripts

| Comando            | Descrição                        |
| ------------------ | -------------------------------- |
| `npm run dev`      | Ambiente de desenvolvimento      |
| `npm run build`    | Build de produção                |
| `npm run preview`  | Servir o build de produção       |
| `npm test`         | Testes do motor de geração       |
| `npm run lint`     | Checagem de tipos (tsc)          |

## Estrutura

```
src/
  domain/      # tipos, motor de geração, base normativa (legislação)
  data/        # repositório (local + Supabase) e seed
  pages/       # telas: clientes, pratos, cardápio, relatório
  state/       # contexto de dados (React)
  lib/         # utilitários (datas, cliente Supabase)
supabase/
  migrations/  # schema e seed SQL
```
