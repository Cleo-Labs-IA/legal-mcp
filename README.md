# `@cleo-labs/legal-mcp`

> Bring the **Cleo Legal Data API** — legal documents, customs classification, sanctions screening, amendment graphs, and more — into Claude Desktop, Cursor, Cline, and any MCP-compatible client.

[![npm](https://img.shields.io/npm/v/@cleo-labs/legal-mcp.svg)](https://www.npmjs.com/package/@cleo-labs/legal-mcp)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Cleo Legal Data indexes **legal documents, treaties, customs schedules, tariff history, sanctions lists, and amendment relations** across 100+ jurisdictions. This MCP server gives your AI agents structured access to that corpus — semantic search, HS classification, landed-cost computation, dual-use export checks, and amendment-graph traversal, all from inside the chat.

---

## What you get — 46 tools

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

### Customs classification, batches & human review (7)

Structured classification that asks before it guesses: when product facts are missing it returns `needs_information` with the questions to answer, never a code presented as final.

| Tool | Purpose |
|---|---|
| `classify_customs_item` | Classify one item, or a 2-10 component kit, from structured facts; returns candidates with evidence, or `needs_information` + questions (1 unit + 1 per component, max 11) |
| `get_classification_dossier` | Audit dossier of a persisted classification: sources, evidence, dataset versions, review state |
| `submit_classification_batch` | Up to 2,000 catalog items as one asynchronous, idempotent job |
| `get_classification_batch` | Job progress and per-item outcomes |
| `get_classification_batch_item_dossier` | Audit dossier of one batch item |
| `list_classifications` | Your account's persisted classifications (every key of the account sees the same history) |
| `review_classification` | Record a human decision (`approved`, `rejected`, `changes_requested`) with optimistic locking; an approved code stays locked until changes are requested |

### Compliance & profiles (5)

| Tool | Purpose |
|---|---|
| `compliance_check` | The full decision in one call: classification (facts, kits, `as_of`), then obligations, dual-use, duties and landed cost on the same code and route. Returns `decision.readiness` (`ready_for_review`, `needs_information`, `needs_review`, `blocked`), the blockers behind it, per-step status and limitations. Advisory, never a binding customs ruling (5 quota units) |
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

> **Using Claude.ai (web/desktop)?** You don't need this package. Open Claude.ai → **Connectors** → add `https://api.legaldata.cleolabs.co/mcp` and sign in via magic link. Done. This package is for **Cursor, Cline, Continue, Claude Code CLI**, and any other MCP client that doesn't yet support remote OAuth Connectors.

> **Package not on npm yet.** `@cleo-labs/legal-mcp` is not published to the npm registry, so the `npx @cleo-labs/legal-mcp` commands below fail today. Until it is, connect directly to the remote server — it is the same server this package proxies:
>
> **Claude Code CLI**
> ```bash
> claude mcp add --transport http cleo-legal https://api.legaldata.cleolabs.co/mcp \
>   --header "Authorization: Bearer $CLEO_API_KEY"
> ```
>
> **Claude Desktop, Cursor, Cline, any stdio client** (uses the official `mcp-remote` proxy):
> ```json
> {
>   "mcpServers": {
>     "cleo-legal": {
>       "command": "npx",
>       "args": ["-y", "mcp-remote@0.1", "https://api.legaldata.cleolabs.co/mcp",
>                "--header", "Authorization: Bearer ${CLEO_API_KEY}"],
>       "env": { "CLEO_API_KEY": "ld_live_xxxxxxxxxxxxx" }
>     }
>   }
> }
> ```
> Omit the `--header` pair and the `env` block to sign in with OAuth in the browser instead.

There are two ways to authenticate. Pick whichever fits your workflow:

| Mode | When to use | What you need |
|---|---|---|
| **OAuth 2.1** *(default, recommended)* | Interactive use on a workstation with a browser | Nothing — a browser opens for sign-in on first run; tokens cached under `~/.mcp-auth/` and rotated automatically |
| **Static API key** | CI, headless servers, automation, multi-account | An `ld_live_…` key from <https://legaldata-public.cleolabs.co/pricing> |

### Claude Desktop

Edit your `claude_desktop_config.json` (Settings → Developer → Edit Config):

**OAuth (no key)** — a browser opens on first launch for sign-in:

```json
{
  "mcpServers": {
    "cleo-legal": {
      "command": "npx",
      "args": ["-y", "@cleo-labs/legal-mcp@latest"]
    }
  }
}
```

**Static API key** — drop your `ld_live_…` in env:

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

Restart Claude. The 46 Cleo Legal tools appear in the tools menu.

### Cursor

Add to `~/.cursor/mcp.json` (or workspace `.cursor/mcp.json`) — same JSON as above. OAuth mode just omits the `env` block.

### Cline / Continue / any MCP client

The package speaks **standard MCP over stdio**. Point any compliant client at `npx -y @cleo-labs/legal-mcp@latest`. OAuth is used by default; set `CLEO_API_KEY=ld_live_…` in the environment to force the static-key mode instead.

---

## Example prompts

Once installed, try these in your AI client:

> *"Classify this product into an HS code, then compute the landed cost from China to France for a 12,000 EUR shipment: aluminum tripod for studio lighting, 1.8 kg, 4 segments."*

> *"Screen 'Acme Trading LLC, Dubai' against EU, OFAC and UK sanctions lists. Return any overlap."*

> *"Show the amendment graph for EU Regulation 2019/1020 — give me everything it supersedes, transposes, or conflicts with, depth 2."*

> *"Was Article 5 of the French Code de la consommation in force on 2018-06-12? Return the text as it stood that day."*

> *"Check this for import into France from China and tell me what is still missing before I can file: cordless drill, 18 V, lithium battery included, plastic housing."* (uses `compliance_check`; expect `needs_information` questions first)

> *"Run a dual-use export check for HS 8542.31 (microprocessors) shipped from Germany to Russia. Cite the regulation."*

---

## Configuration

| Env var | Default | Description |
|---|---|---|
| `CLEO_API_KEY` | — *(optional)* | Static API key starting with `ld_live_`. When set, skips OAuth and authenticates via `Authorization: Bearer`. Recommended for CI/headless. |
| `CLEO_LEGAL_URL` | `https://api.legaldata.cleolabs.co/mcp` | Override for staging or self-hosted deployments. |

When `CLEO_API_KEY` is **not** set, the proxy falls back to the OAuth 2.1 + PKCE + Dynamic Client Registration flow against the discovery document at <https://api.legaldata.cleolabs.co/.well-known/oauth-authorization-server>. The browser opens once; refresh tokens live for 90 days and rotate automatically.

---

## Architecture

This package is a thin stdio→SSE proxy. The actual MCP server runs on **`https://api.legaldata.cleolabs.co/mcp`** as part of the Cleo Legal Data API. All authorization, rate limiting, and data fetching happen server-side — your local client only forwards JSON-RPC messages over a streaming HTTP connection.

```
┌──────────────────────┐    stdio    ┌──────────────┐   SSE+OAuth/Bearer   ┌─────────────────────────────┐
│ Cursor / Cline / CLI │ ◀────────▶ │  legal-mcp   │ ◀──────────────────▶ │ api.legaldata.cleolabs.co  │
└──────────────────────┘             └──────────────┘                      └─────────────────────────────┘
                                       (this pkg)                            (46 tools, read-mostly)
```

Under the hood, this CLI shells out to `mcp-remote@0.1`, which handles SSE reconnect, request framing, stdio bridging, and the full OAuth 2.1 + PKCE + Dynamic Client Registration flow against the API's `/.well-known/oauth-authorization-server` document.

---

## Security

- In OAuth mode, no secrets ever touch the package — `mcp-remote` performs PKCE and stores rotated tokens under `~/.mcp-auth/` with file permissions `0600`.
- In static-key mode, the key is sent as an HTTP `Authorization: Bearer` header over TLS only; it is never logged.
- Almost every tool is **read-only**. Three write to your own account only: `review_classification` (a human review decision), `submit_classification_batch` (a job) and `classify_customs_item` when you pass `persist: true`. None of them writes to any other system; connectors that write back to Shopify or an ERP live in the SDK CLI and only write human-approved codes by default.
- **Note on quota**: `compliance_check` consumes **5 quota units** per call (versus 1 for most other tools). Monitor usage at <https://legaldata-public.cleolabs.co>.
- Revoke a leaked key (or an OAuth connector) any time from your account dashboard.

---

## Cleo ecosystem

- **[Cleo Legal Data](https://legaldata-public.cleolabs.co)** — Open legal-data atlas + commercial API (this MCP's source data).
- **[`@cleo-labs/insight-mcp`](https://www.npmjs.com/package/@cleo-labs/insight-mcp)** — Product-compliance signals & regulations for the Cleo Insight platform (9 tools).
- **[`@cleo-labs/skills-mcp`](https://www.npmjs.com/package/@cleo-labs/skills-mcp)** — 45 product-compliance skills for AI coding agents.

---

## License

MIT © [Cleo Labs](https://cleolabs.co)
