import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import beautify from 'js-beautify'

const HERE = dirname(fileURLToPath(import.meta.url))

const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024
const DEFAULT_USER_AGENT = 'dsh-mini-web-request-test/0.1'
const MAX_FILE_STEM_LENGTH = 180

/** Directory where fetched HTML snapshots are written. */
export const DEFAULT_OUTPUT_DIR = resolve(HERE, '../.artifacts/web')

export interface FetchHtmlOptions {
  /** Directory for the saved `.html` file. Defaults to `tests/.artifacts/web`. */
  outputDir?: string
  /** Abort the request after this many milliseconds. Defaults to 30s. */
  timeoutMs?: number
  /** Maximum response body size. Defaults to 2 MiB. */
  maxBytes?: number
  /** Base name for the saved file, without `.html`. Defaults to a name derived from the URL. */
  fileStem?: string
  /** Extra request headers. */
  headers?: Record<string, string>
}

export interface HtmlSnapshot {
  /** Absolute path of the saved HTML file. */
  filePath: string
  /** URL after redirects. */
  finalUrl: string
  status: number
  contentType: string | null
  /** Size of the formatted UTF-8 file. */
  bytes: number
  /** Size of the raw response body. */
  sourceBytes: number
}

/**
 * Fetch a URL, format the HTML with js-beautify, and write UTF-8 output.
 *
 * The response body is streamed so `maxBytes` is enforced before the whole
 * response is buffered. The returned `filePath` is absolute and is the value
 * tests should assert on or print.
 */
export async function fetchHtmlToFile(
  url: string,
  options: FetchHtmlOptions = {},
): Promise<HtmlSnapshot> {
  const parsed = new URL(url)
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR

  let response: Response
  try {
    response = await fetch(parsed, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'user-agent': DEFAULT_USER_AGENT,
        ...options.headers,
      },
    })
  } catch (cause) {
    throw new Error(`GET ${parsed.href} failed`, { cause })
  }

  if (!response.ok) {
    throw new Error(
      `GET ${parsed.href} returned HTTP ${response.status} ${response.statusText}`,
    )
  }

  const body = await readBody(response, maxBytes, parsed.href)
  const contentType = response.headers.get('content-type')
  const formatted = formatDocument(decodeBody(body, contentType), parsed.href)
  const output = Buffer.from(formatted, 'utf8')

  const filePath = resolve(
    outputDir,
    outputFileName(parsed, 'html', options.fileStem),
  )

  await mkdir(outputDir, { recursive: true })
  await writeFile(filePath, output)

  return {
    filePath,
    finalUrl: response.url || parsed.href,
    status: response.status,
    contentType,
    bytes: output.byteLength,
    sourceBytes: body.byteLength,
  }
}

/**
 * Build a readable file name from a URL:
 * `https://www.btsj6.com/subject/njowq0n.html`
 * -> `www.btsj6.com_subject_njowq0n.html`.
 */
export function urlToFileName(url: URL): string {
  return outputFileName(url, 'html')
}

/**
 * Build an output file name for a URL, optionally overriding the stem.
 *
 * `https://www.btsj6.com/subject/njowq0n.html` + `md`
 * -> `www.btsj6.com_subject_njowq0n.md`.
 */
export function outputFileName(
  url: URL,
  extension: 'html' | 'md',
  fileStem?: string,
): string {
  if (fileStem) {
    return `${truncateStem(sanitizeFileStem(fileStem), url.href)}.${extension}`
  }
  return `${urlToFileStem(url)}.${extension}`
}

function urlToFileStem(url: URL): string {
  let pathname = url.pathname
  if (pathname.endsWith('/')) pathname += 'index.html'
  pathname = pathname.replace(/\.(?:x?html?|htm)$/i, '')

  const raw = `${url.host}${pathname}${url.search}${url.hash}`
  return truncateStem(sanitizeFileStem(raw), url.href)
}

function sanitizeFileStem(value: string): string {
  const stem = value
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^[._-]+/, '')
    .replace(/[._-]+$/, '')
    .replace(/\.(?:x?html?|htm)$/i, '')
  return stem || 'page'
}

function truncateStem(stem: string, href: string): string {
  if (stem.length <= MAX_FILE_STEM_LENGTH) return stem
  const hash = createHash('sha256').update(href).digest('hex').slice(0, 8)
  return `${stem.slice(0, MAX_FILE_STEM_LENGTH - 9)}-${hash}`
}

function formatDocument(source: string, url: string): string {
  try {
    return beautify.html(source, {
      indent_size: 2,
      wrap_line_length: 120,
      preserve_newlines: true,
      max_preserve_newlines: 2,
      end_with_newline: true,
      eol: '\n',
    })
  } catch (cause) {
    throw new Error(`failed to format HTML from ${url}`, { cause })
  }
}

function decodeBody(body: Uint8Array, contentType: string | null): string {
  const charset =
    contentType?.match(/charset\s*=\s*"?([^";\s]+)/i)?.[1] ?? 'utf-8'

  try {
    return new TextDecoder(charset).decode(body)
  } catch {
    return new TextDecoder('utf-8').decode(body)
  }
}

async function readBody(
  response: Response,
  maxBytes: number,
  url: string,
): Promise<Buffer> {
  if (!response.body) return Buffer.alloc(0)

  const chunks: Uint8Array[] = []
  let total = 0
  const reader = response.body.getReader()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel().catch(() => {})
        throw new Error(`GET ${url} exceeded the ${maxBytes}-byte body cap`)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  return Buffer.concat(chunks, total)
}
