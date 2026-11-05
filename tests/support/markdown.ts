import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import TurndownService from 'turndown'
import { gfm } from '@joplin/turndown-plugin-gfm'
import { outputFileName } from './web-request.ts'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Directory where Markdown conversions are written. */
export const DEFAULT_MARKDOWN_OUTPUT_DIR = resolve(HERE, '../../output')

export interface MarkdownOptions {
  /** Directory for the saved `.md` file. Defaults to `<project>/output`. */
  outputDir?: string
  /** Base name for the saved file, without `.md`. Defaults to a name derived from the URL. */
  fileStem?: string
}

export interface MarkdownSnapshot {
  /** Absolute path of the saved Markdown file. */
  filePath: string
  /** Size of the UTF-8 file. */
  bytes: number
}

/**
 * Convert HTML to Markdown using the same rule set as MarkItDown's
 * TypeScript port: ATX headings, the GFM plugin (tables, strikethrough,
 * task lists), MarkItDown-style anchors and images.
 *
 * This is pure TypeScript: `turndown` parses and walks the DOM, and
 * `@joplin/turndown-plugin-gfm` adds the GitHub-flavoured extensions.
 * No Python or external converter process is involved.
 */
export function htmlToMarkdown(html: string): string {
  const service = new TurndownService({ headingStyle: 'atx' })

  service.use(gfm)
  // MarkItDown converts the body only; HTML parsing moves these elements
  // into the document body, so remove them explicitly.
  service.remove(['script', 'style', 'noscript', 'template', 'title'])
  service.addRule('markitdown-anchor', {
    filter: ['a'],
    replacement(content, node) {
      if (content === '') return ''

      const prefix = content.startsWith(' ') ? ' ' : ''
      const suffix = content.endsWith(' ') ? ' ' : ''
      // A link wrapping a block element can contain several paragraphs;
      // MarkItDown keeps the first line.
      const text = content.trim().replace(/\n\n[\s\S]*/, '').trim()
      if (text === '') return ''

      const element = node as HTMLElement
      const href = element.getAttribute('href')
      if (!href || !isSupportedHref(href)) return `${prefix}${text}${suffix}`

      const title = element.getAttribute('title')?.trim() ?? ''
      const titlePart = title ? ` "${title}"` : ''
      return `${prefix}[${text}](${href}${titlePart})${suffix}`
    },
  })
  service.addRule('markitdown-image', {
    filter: ['img'],
    replacement(_content, node) {
      const element = node as HTMLElement
      if (element.nodeName !== 'IMG') return ''

      const alt = element.getAttribute('alt') ?? ''
      let src = element.getAttribute('src') ?? ''
      const title = element.getAttribute('title')?.trim() ?? ''
      const titlePart = title ? ` "${title}"` : ''

      // Inline images would otherwise flood the output with base64 data.
      if (src.startsWith('data:')) src = `${src.split(',')[0]}...`

      return `![${alt}](${src}${titlePart})`
    },
  })

  const markdown = service.turndown(html).trim()
  return markdown ? `${markdown}\n` : ''
}

/**
 * Convert HTML to Markdown and write it under `output/`, named after the URL.
 */
export async function saveMarkdown(
  html: string,
  url: string,
  options: MarkdownOptions = {},
): Promise<MarkdownSnapshot> {
  const parsed = new URL(url)
  const outputDir = options.outputDir ?? DEFAULT_MARKDOWN_OUTPUT_DIR
  const filePath = resolve(
    outputDir,
    outputFileName(parsed, 'md', options.fileStem),
  )
  const markdown = htmlToMarkdown(html)
  const output = Buffer.from(markdown, 'utf8')

  await mkdir(outputDir, { recursive: true })
  await writeFile(filePath, output)

  return { filePath, bytes: output.byteLength }
}

/** `https://www.btsj6.com/subject/njowq0n.html` -> `..._njowq0n.md`. */
export function urlToMarkdownFileName(url: URL): string {
  return outputFileName(url, 'md')
}

function isSupportedHref(href: string): boolean {
  try {
    const { protocol } = new URL(href, 'https://relative.invalid/')
    return ['http:', 'https:', 'file:', 'mailto:'].includes(protocol)
  } catch {
    return false
  }
}
