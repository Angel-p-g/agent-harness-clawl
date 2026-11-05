import { readFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { isAbsolute } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  htmlToMarkdown,
  saveMarkdown,
  urlToMarkdownFileName,
} from './support/markdown.ts'
import { fetchHtmlToFile, urlToFileName } from './support/web-request.ts'

const TEST_TIMEOUT_MS = 35_000

// Deliberately minified so the test proves the output is pretty-printed.
const FIXTURE_HTML =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>dsh-mini web request fixture</title></head><body><h1>hello from the fixture</h1></body></html>'

let fixtureServer: Server | undefined

afterEach(async () => {
  if (!fixtureServer) return
  const server = fixtureServer
  fixtureServer = undefined
  await closeServer(server)
})

describe('fetchHtmlToFile', () => {
  it(
    'fetches the input URL and returns the saved HTML path',
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const inputUrl = process.env.TEST_URL?.trim()
      const fixture = inputUrl ? undefined : await startFixtureServer()
      if (fixture) fixtureServer = fixture.server

      const url = inputUrl ?? fixture?.url
      if (!url) throw new Error('no TEST_URL and no local fixture URL')

      const snapshot = await fetchHtmlToFile(
        url,
        fixture ? { fileStem: 'local-fixture' } : {},
      )
      const html = await readFile(snapshot.filePath, 'utf8')

      expect(isAbsolute(snapshot.filePath)).toBe(true)
      expect(snapshot.filePath).toMatch(/\.html$/)
      expect(snapshot.bytes).toBeGreaterThan(0)
      expect(snapshot.sourceBytes).toBeGreaterThan(0)
      expect(html.length).toBeGreaterThan(0)

      // MarkItDown-style conversion, implemented in TypeScript with turndown.
      const markdownSnapshot = await saveMarkdown(
        html,
        url,
        fixture ? { fileStem: 'local-fixture' } : {},
      )
      const markdown = await readFile(markdownSnapshot.filePath, 'utf8')

      expect(isAbsolute(markdownSnapshot.filePath)).toBe(true)
      expect(markdownSnapshot.filePath).toMatch(/\.md$/)
      expect(markdownSnapshot.bytes).toBe(Buffer.byteLength(markdown, 'utf8'))
      expect(markdown.length).toBeGreaterThan(0)

      if (fixture) {
        expect(snapshot.status).toBe(200)
        expect(snapshot.contentType).toMatch(/text\/html/i)
        expect(html).toContain('<title>dsh-mini web request fixture</title>')
        expect(snapshot.sourceBytes).toBe(Buffer.byteLength(FIXTURE_HTML))
        expect(snapshot.bytes).toBe(Buffer.byteLength(html, 'utf8'))
        expect(html.split('\n').length).toBeGreaterThan(5)
        expect(html).toMatch(/\n<head>\n  <meta charset="utf-8">/)
        expect(html).toContain('\n<body>')
        expect(markdown).toContain('# hello from the fixture')
        expect(markdown).not.toContain('dsh-mini web request fixture')
      }

      process.stdout.write(
        `[web-request] ${snapshot.finalUrl} -> ${snapshot.filePath} ` +
          `(${snapshot.sourceBytes} -> ${snapshot.bytes} bytes, ` +
          `${snapshot.contentType ?? 'no content-type'})\n` +
          `[web-request] markdown -> ${markdownSnapshot.filePath} ` +
          `(${markdownSnapshot.bytes} bytes)\n`,
      )
    },
  )
})

describe('urlToFileName', () => {
  it('uses the URL itself as the output file name', () => {
    expect(
      urlToFileName(new URL('https://www.btsj6.com/subject/njowq0n.html')),
    ).toBe('www.btsj6.com_subject_njowq0n.html')

    expect(urlToFileName(new URL('https://example.com/'))).toBe(
      'example.com_index.html',
    )

    expect(
      urlToFileName(new URL('https://example.com/search?q=a&b=c')),
    ).toBe('example.com_search_q_a_b_c.html')
  })

  it('uses the same stem for the Markdown output', () => {
    expect(
      urlToMarkdownFileName(
        new URL('https://www.btsj6.com/subject/njowq0n.html'),
      ),
    ).toBe('www.btsj6.com_subject_njowq0n.md')

    expect(urlToMarkdownFileName(new URL('https://example.com/'))).toBe(
      'example.com_index.md',
    )
  })
})

describe('htmlToMarkdown', () => {
  it('converts headings, links, images and GFM tables', () => {
    const markdown = htmlToMarkdown(`
      <html>
        <head><title>ignored</title><style>body { color: red }</style></head>
        <body>
          <h2>Section</h2>
          <p>
            <a href="https://example.com" title="Example">a link</a>
            <a href="javascript:alert(1)">unsafe</a>
          </p>
          <p><img src="/cover.png" alt="cover" title="Cover"></p>
          <table>
            <thead><tr><th>name</th><th>value</th></tr></thead>
            <tbody><tr><td>one</td><td>1</td></tr></tbody>
          </table>
        </body>
      </html>
    `)

    expect(markdown).toContain('## Section')
    expect(markdown).toContain('[a link](https://example.com "Example")')
    expect(markdown).toContain('unsafe')
    expect(markdown).not.toContain('javascript:')
    expect(markdown).toContain('![cover](/cover.png "Cover")')
    expect(markdown).toContain('| name | value |')
    expect(markdown).toMatch(/\|\s*one\s*\|\s*1\s*\|/)
    expect(markdown).not.toContain('ignored')
    expect(markdown).not.toContain('color: red')
  })
})

async function startFixtureServer(): Promise<{ server: Server; url: string }> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    response.end(FIXTURE_HTML)
  })

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => reject(error)
    server.once('error', onError)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', onError)
      resolve()
    })
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    await closeServer(server)
    throw new Error('fixture server did not expose a TCP address')
  }

  return { server, url: `http://127.0.0.1:${address.port}/fixture` }
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}
