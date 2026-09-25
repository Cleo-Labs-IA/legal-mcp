#!/usr/bin/env node
/**
 * `@cleo-labs/legal-mcp` — stdio entrypoint.
 *
 * Connects a local MCP client (Claude Desktop, Cursor, Cline, …) to the
 * Cleo Legal Data API remote MCP server at https://api.legaldata.cleolabs.co/mcp.
 *
 * The remote server exposes 46 tools spanning:
 *   - Search & documents (search_legal, get_document, list_documents, …)
 *   - Coverage & changes (get_coverage, coverage_my_gaps, get_changes, …)
 *   - Translation & utility (translate_text, health, list_endpoints, describe_endpoint)
 *   - Customs (customs_lookup, customs_landed_cost, customs_dual_use_check, …)
 *   - Classification, batches & human review (classify_customs_item,
 *     submit_classification_batch, list_classifications, review_classification, …)
 *   - Compliance & profiles (compliance_check — the full decision — get_country_profile, …)
 *   - Amendments (search_amendments, get_law_as_of, traverse_amendment_graph, …)
 *   - Rate history (get_rate_history, list_rate_changes_by_year)
 *   - Sanctions (search_sanctions_by_authority, get_sanctions_overlap, …)
 *
 * Two ways to authenticate:
 *
 *   1. OAuth 2.1 (default — no API key needed):
 *        npx -y @cleo-labs/legal-mcp@latest
 *      A browser opens for sign-in via magic link; tokens are cached
 *      under ~/.mcp-auth/ and rotated automatically.
 *
 *   2. Static API key (CI / headless):
 *        CLEO_API_KEY=ld_live_xxx npx -y @cleo-labs/legal-mcp@latest
 *      Get a key at https://legaldata-public.cleolabs.co/pricing
 *
 * Override the endpoint (staging / self-host) via CLEO_LEGAL_URL.
 */

import { spawn } from 'node:child_process';

const DEFAULT_URL = 'https://api.legaldata.cleolabs.co/mcp';
const KEY_PREFIX = 'ld_live_';

function log(...args: unknown[]): void {
  // MCP spec reserves stdout for protocol; logs go to stderr.
  process.stderr.write(`[legal-mcp] ${args.join(' ')}\n`);
}

function bail(msg: string, code = 0): never {
  log(msg);
  process.exit(code);
}

const url = (process.env.CLEO_LEGAL_URL || DEFAULT_URL).replace(/\/+$/, '');
const apiKey = process.env.CLEO_API_KEY?.trim();

const remoteArgs: string[] = ['-y', 'mcp-remote@0.1', url];

if (apiKey) {
  if (!apiKey.startsWith(KEY_PREFIX)) {
    bail(
      `Invalid CLEO_API_KEY — expected prefix '${KEY_PREFIX}'. ` +
        'Get a valid key at https://legaldata-public.cleolabs.co/pricing, ' +
        'or unset CLEO_API_KEY to authenticate via OAuth instead.',
    );
  }
  remoteArgs.push('--header', `Authorization: Bearer ${apiKey}`);
  log(`using static API key, connecting to ${url}`);
} else {
  log(`no CLEO_API_KEY set — falling back to OAuth at ${url}`);
  log('a browser window will open for sign-in on first run');
}

// We shell out to the official `mcp-remote` proxy because it already
// handles SSE reconnect, request framing, stdio bridging, and the full
// OAuth 2.1 + PKCE + Dynamic Client Registration flow against the
// /.well-known/oauth-authorization-server discovery document.
const child = spawn('npx', remoteArgs, { stdio: 'inherit' });

child.on('error', (err) => bail(`failed to spawn mcp-remote: ${err.message}`, 1));

child.on('exit', (code, signal) => {
  if (signal) {
    log(`terminated by signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});

const forward = (signal: NodeJS.Signals): void => {
  if (!child.killed) child.kill(signal);
};
process.on('SIGINT', () => forward('SIGINT'));
process.on('SIGTERM', () => forward('SIGTERM'));
