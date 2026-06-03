#!/usr/bin/env node
/**
 * `@cleo-labs/legal-mcp` — stdio entrypoint.
 *
 * Connects a local MCP client (Claude Desktop, Cursor, Cline, …) to the
 * Cleo Legal Data API remote MCP server at https://api.legaldata.cleolabs.co/mcp.
 *
 * The remote server exposes 39 tools spanning:
 *   - Search & documents (search_legal, get_document, list_documents, …)
 *   - Coverage & changes (get_coverage, coverage_my_gaps, get_changes, …)
 *   - Translation & utility (translate_text, health, list_endpoints, describe_endpoint)
 *   - Customs (customs_lookup, customs_landed_cost, customs_dual_use_check, …)
 *   - Compliance & profiles (compliance_check, get_country_profile, …)
 *   - Amendments (search_amendments, get_law_as_of, traverse_amendment_graph, …)
 *   - Rate history (get_rate_history, list_rate_changes_by_year)
 *   - Sanctions (search_sanctions_by_authority, get_sanctions_overlap, …)
 *
 * Usage:
 *   CLEO_API_KEY=ld_live_xxx npx -y @cleo-labs/legal-mcp@latest
 *
 * Get an API key at https://legaldata-public.cleolabs.co/pricing
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

const apiKey = process.env.CLEO_API_KEY?.trim();
if (!apiKey) {
  bail(
    'Missing CLEO_API_KEY environment variable. ' +
      'Get yours at https://legaldata-public.cleolabs.co/pricing',
  );
}
if (!apiKey.startsWith(KEY_PREFIX)) {
  bail(
    `Invalid CLEO_API_KEY — expected prefix '${KEY_PREFIX}'. ` +
      'Get a valid key at https://legaldata-public.cleolabs.co/pricing',
  );
}

const url = (process.env.CLEO_LEGAL_URL || DEFAULT_URL).replace(/\/+$/, '');

log(`connecting to ${url}`);

// We shell out to the official Anthropic `mcp-remote` proxy because it
// already handles SSE reconnect, request framing, and stdio bridging.
// Pinned to a minor range to avoid surprise upgrades.
const child = spawn(
  'npx',
  [
    '-y',
    'mcp-remote@0.1',
    url,
    '--header',
    `Authorization: Bearer ${apiKey}`,
  ],
  { stdio: 'inherit' },
);

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
