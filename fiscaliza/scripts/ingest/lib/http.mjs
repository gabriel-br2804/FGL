/**
 * HTTP helper para os scripts de ingestão real.
 *
 * Estes scripts rodam FORA da sessão do Claude (que tem a rede bloqueada
 * para domínios externos) — são pensados para serem executados na máquina
 * do usuário ou num CI/worker com acesso normal à internet, via
 * `npm run ingest`.
 *
 * Nunca lança para o processo inteiro por causa de uma única chamada
 * falhar: cada request individual retorna `{ ok, data, error }` para que o
 * chamador decida como agregar erros parciais sem derrubar a ingestão
 * inteira (uma fonte fora do ar não deve impedir as outras de rodar).
 */

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 1200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson(url, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    headers = {},
    label = url,
  } = options;

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "Fiscaliza-Ingest/0.1 (MVP)", ...headers },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        lastError = `HTTP ${res.status} ${res.statusText} — ${bodyText.slice(0, 300)}`;
        if (res.status === 429 || res.status >= 500) {
          // Em 429, respeita o Retry-After do servidor quando ele manda —
          // é bem mais confiável que adivinhar um backoff fixo.
          const retryAfterHeader = res.headers.get("retry-after");
          const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
          const delay = retryAfterMs && Number.isFinite(retryAfterMs) ? retryAfterMs : retryDelayMs * (attempt + 1);
          await sleep(delay);
          continue;
        }
        return { ok: false, data: null, error: lastError, status: res.status };
      }

      const data = await res.json();
      return { ok: true, data, error: null, status: res.status };
    } catch (err) {
      clearTimeout(timer);
      lastError = err?.name === "AbortError" ? `timeout após ${timeoutMs}ms` : String(err?.message ?? err);
      await sleep(retryDelayMs * (attempt + 1));
    }
  }

  console.warn(`[ingest] falhou: ${label} — ${lastError}`);
  return { ok: false, data: null, error: lastError, status: null };
}

export async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runOne() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, runOne);
  await Promise.all(workers);
  return results;
}

export function logSection(title) {
  console.log(`\n=== ${title} ===`);
}
