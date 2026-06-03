# `@cleo-labs/legal-mcp`

> Bring the **Cleo Legal Data API** — legal documents, customs classification, sanctions screening, amendment graphs, and more — into Claude Desktop, Cursor, Cline, and any MCP-compatible client.

[![npm](https://img.shields.io/npm/v/@cleo-labs/legal-mcp.svg)](https://www.npmjs.com/package/@cleo-labs/legal-mcp)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Cleo Legal Data indexes **legal documents, treaties, customs schedules, tariff history, sanctions lists, and amendment relations** across 100+ jurisdictions. This MCP server gives your AI agents structured access to that corpus — semantic search, HS classification, landed-cost computation, dual-use export checks, and amendment-graph traversal, all from inside the chat.

---

## What you get — 39 tools

### Search & documents (10)

| Tool | Purpose |
|---|---|
| `search_legal` | Semantic + lexical hybrid search across legal documents |
| `search_legal_bulk` | Batched search (1-25 queries in one call) |
| `get_document` | Fetch a single document by ID |
| `get_documents_bulk` | Batched document fetch (1-50 IDs) |
| `get_document_text` | Full text of a document |
| `get_document_article` | Extract a specific article from a document |
| `list_documents` | Paginated listing of indexed documents |
| `list_countries` | Supported jurisdictions |
| `list_authorities` | Regulatory authorities tracked in the corpus |
| `list_facets` | Available filter facets (type, status, language, …) |

### Coverage & changes (4)

| Tool | Purpose |
|---|---|
| `get_coverage` | Coverage snapshot per country / source |
| `coverage_my_gaps` | Top coverage gaps for the calling API key (from query telemetry) |
| `coverage_gaps` | General coverage gaps across the platform |
| `get_changes` | Document changes since a timestamp (max 90 days) |

### Translation & utility (4)

| Tool | Purpose |
|---|---|
| `translate_text` | Translate legal text (Bedrock Haiku backend) |
| `health` | Service health check |
| `list_endpoints` | List all REST endpoints behind the MCP |
| `describe_endpoint` | Schema for a specific REST endpoint |

### Customs (7)

| Tool | Purpose |
|---|---|
| `customs_lookup` | HS code classification from a free-text product description |
| `customs_obligations` | Customs obligations for an HS code in a given country |
| `customs_alternatives` | Alternative HS code suggestions |
| `customs_dual_use_check` | Dual-use export-control screening |
| `customs_duties` | Tariff / VAT / excise lookup |
| `customs_landed_cost` | Landed-cost calculator |
| `customs_reverse_classify` | HS code → defensible product description |

### Compliance & profiles (5)

| Tool | Purpose |
|---|---|
| `compliance_check` | Composite compliance check (consumes 5 quota units) |
| `eaeu_parallel_import` | EAEU parallel-import rules |
| `lookup_standard` | GOST / EAEU standards lookup |
| `get_country_profile` | Per-country regulatory profile |
| `get_authority_profile` | Per-authority profile |

### Amendments & versioning (4)

| Tool | Purpose |
|---|---|
| `search_amendments` | Search amendment relations between documents |
| `get_law_as_of` | Law version in force at a given date |
| `list_amendments_by_year` | Amendment relations discovered in a calendar year |
| `traverse_amendment_graph` | Walk parent / transposes / supersedes / conflicts edges |

### Rate history (2)

| Tool | Purpose |
|---|---|
| `get_rate_history` | Tariff-rate change history for an HS code in a country |
| `list_rate_changes_by_year` | Tariff-rate changes recorded in a calendar year |

### Sanctions (3)

| Tool | Purpose |
|---|---|
| `search_sanctions_by_authority` | Sanctions entries by issuing authority |
| `get_sanctions_overlap` | Sanctions-list overlap for a named entity |
| `list_sanctions_by_country` | Sanctions entries by country |

---

## Quick start

You need a Cleo Legal Data API key. Get one at <https://legaldata-public.cleolabs.co/pricing> (self-serve Stripe Checkout).

### Claude Desktop

Edit your `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "cleo-legal": {
      "command": "npx",
      "args": ["-y", "@cleo-labs/legal-mcp@latest"],
      "env": {
        "CLEO_API_KEY": "ld_live_xxxxxxxxxxxxx"
      }
    }
  }
}
```

Restart Claude. The 39 Cleo Legal tools appear in the tools menu.

### Cursor

Add to `~/.cursor/mcp.json` (or workspace `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "cleo-legal": {
      "command": "npx",
      "args": ["-y", "@cleo-labs/legal-mcp@latest"],
      "env": {
        "CLEO_API_KEY": "ld_live_xxxxxxxxxxxxx"
      }
    }
  }
}
```

### Cline / Continue / any MCP client

The package speaks **standard MCP over stdio** — point any compliant client at the binary `legal-mcp` (or `npx -y @cleo-labs/legal-mcp@latest`) with `CLEO_API_KEY` in the environment:

```json
{
  "mcpServers": {
    "cleo-legal": {
      "command": "npx",
      "args": ["-y", "@cleo-labs/legal-mcp@latest"],
      "env": {
        "CLEO_API_KEY": "ld_live_xxxxxxxxxxxxx"
      }
    }
  }
}
```

---

## Example prompts

Once installed, try these in your AI client:

> *"Classify this product into an HS code, then compute the landed cost from China to France for a 12,000 EUR shipment: aluminum tripod for studio lighting, 1.8 kg, 4 segments."*

> *"Screen 'Acme Trading LLC, Dubai' against EU, OFAC and UK sanctions lists. Return any overlap."*

> *"Show the amendment graph for EU Regulation 2019/1020 — give me everything it supersedes, transposes, or conflicts with, depth 2."*

> *"Was Article 5 of the French Code de la consommation in force on 2018-06-12? Return the text as it stood that day."*

> *"Run a dual-use export check for HS 8542.31 (microprocessors) shipped from Germany to Russia. Cite the regulation."*

---

## Configuration

| Env var | Default | Description |
|---|---|---|
| `CLEO_API_KEY` | — *(required)* | API key starting with `ld_live_`. |
| `CLEO_LEGAL_URL` | `https://api.legaldata.cleolabs.co/mcp` | Override for staging or self-hosted deployments. |

---

## Architecture

This package is a thin stdio→SSE proxy. The actual MCP server runs on **`https://api.legaldata.cleolabs.co/mcp`** as part of the Cleo Legal Data API. All authorization, rate limiting, and data fetching happen server-side — your local client only forwards JSON-RPC messages over a streaming HTTP connection.

```
┌──────────────────────┐    stdio    ┌──────────────┐    SSE+Bearer   ┌─────────────────────────────┐
│ Claude / Cursor / …  │ ◀────────▶ │  legal-mcp   │ ◀─────────────▶ │ api.legaldata.cleolabs.co  │
└──────────────────────┘             └──────────────┘                 └─────────────────────────────┘
                                       (this pkg)                       (39 tools, GET-mostly)
```

Under the hood, this CLI shells out to the official `mcp-remote@0.1` proxy from Anthropic, which already handles SSE reconnect, request framing, and stdio bridging.

---

## Security

- The API key never leaves your machine in plaintext — it's sent as an HTTP `Authorization: Bearer` header over TLS to the Cleo Legal Data endpoint.
- All tools are **read-only** from a data-mutation perspective — none of them write to your account.
- **Note on quota**: `compliance_check` consumes **5 quota units** per call (versus 1 for most other tools). Other tools consume 1 unit each. Monitor usage via your dashboard at <https://legaldata-public.cleolabs.co>.
- Scope is restricted to your subscription tier — the bearer token is your auth boundary.
- Revoke a leaked key any time from your account dashboard.

---

## Cleo ecosystem

- **[Cleo Legal Data](https://legaldata-public.cleolabs.co)** — Open legal-data atlas + commercial API (this MCP's source data).
- **[`@cleo-labs/insight-mcp`](https://www.npmjs.com/package/@cleo-labs/insight-mcp)** — Product-compliance signals & regulations for the Cleo Insight platform (9 tools).
- **[`@cleo-labs/skills-mcp`](https://www.npmjs.com/package/@cleo-labs/skills-mcp)** — 45 product-compliance skills for AI coding agents.

---

## License

MIT © [Cleo Labs](https://cleolabs.co)
