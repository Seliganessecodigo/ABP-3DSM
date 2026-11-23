import assert from 'node:assert/strict'
import { readFile, readdir, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { localeUi, localeDescriptions, searchLocales } from '../.vitepress/ui.ts'

const docs = fileURLToPath(new URL('../', import.meta.url))
const localeSource = await readFile(path.join(docs, '../frontend/src/i18n/types.ts'), 'utf8')
const locales = [...localeSource.split('as const')[0].matchAll(/'([a-z]{2}-[A-Z]{2})'/g)].map(match => match[1])
assert.equal(new Set(locales).size, 12, 'Expected twelve canonical frontend locales')
assert.equal(Object.keys(searchLocales).length, locales.length, 'Search needs every locale')
function assertLabels(value) {
  if (typeof value === 'object' && value !== null) Object.values(value).forEach(assertLabels)
  else assert.ok(typeof value === 'string' && value.trim(), 'Site interface labels must be translated')
}
for (const locale of locales) {
  assertLabels(localeDescriptions[locale])
  assertLabels(localeUi(locale))
  assertLabels(searchLocales[locale === 'pt-BR' ? 'root' : locale])
}

// Historical artifacts remain in Git; only the multilingual reader documentation is published.
const excluded = new Set(['.vitepress', 'node_modules', 'public', 'evidence', 'adr', 'design', 'specs', 'README.md', 'frontend-i18n.md'])
async function publishedPages(base, relative = '') {
  const entries = await readdir(path.join(base, relative), { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    if (excluded.has(entry.name) || locales.includes(entry.name)) continue
    const filename = path.posix.join(relative, entry.name)
    if (entry.isDirectory()) result.push(...await publishedPages(base, filename))
    else if (entry.name.endsWith('.md')) result.push(filename)
  }
  return result.sort()
}
const pages = await publishedPages(docs)
const config = await readFile(path.join(docs, '.vitepress/config.mts'), 'utf8')
for (const directory of ['evidence', 'adr', 'design', 'specs']) {
  assert.ok(config.includes(`'${directory}/**'`), `${directory}: historical artifacts must stay outside the published locale set`)
}
for (const locale of locales.filter(locale => locale !== 'pt-BR')) {
  assert.deepEqual(await publishedPages(path.join(docs, locale)), pages, `${locale}: published page set differs from pt-BR`)
}

function fingerprint(markdown) {
  const examples = []
  const prose = markdown.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, language, body) => {
    examples.push({ language, body: body.trim().replaceAll('\r\n', '\n') })
    return 'EXAMPLE'
  })
  const sections = prose.split(/(?=^## )/m).map(block => {
    const heading = block.match(/^## .*\{#([\w-]+)\}/m)?.[1] ?? 'intro'
    const paragraphs = block.trim().split(/\n\s*\n/).filter(part =>
      part && !/^(?:#|\||EXAMPLE)/.test(part.trim()))
    return {
      heading,
      paragraphs: paragraphs.length,
      tables: block.split(/\n\s*\n/).filter(part => part.trim().startsWith('|')).map(part =>
        part.trim().split('\n').map(line => line.split(/(?<!\\)\|/).length)),
      lists: [...block.matchAll(/^\s*(?:- |\d+\. )/gm)].length,
      links: [...block.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1]),
      contractValues: [...block.matchAll(/`([^`]+)`/g)].map(match => match[1]).sort(),
    }
  })
  return { sections, examples }
}

const failures = []
for (const page of pages) {
  const canonical = await readFile(path.join(docs, page), 'utf8')
  const expected = fingerprint(canonical)
  const ids = expected.sections.map(section => section.heading)
  assert.equal(new Set(ids).size, ids.length, `${page}: duplicate section IDs`)
  for (const locale of locales) {
    const filename = path.join(docs, locale === 'pt-BR' ? '' : locale, page)
    try {
      const translated = await readFile(filename, 'utf8')
      if (page === 'guide/monitoring.md') {
        const common = JSON.parse(await readFile(path.join(docs, `../frontend/src/i18n/locales/${locale}.json`), 'utf8'))
        for (const state of ['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED']) {
          assert.ok(translated.includes(`| ${common[`state.${state}`]} |`), `${state}: state label differs from the application`)
        }
      }
      assert.deepEqual(fingerprint(translated), expected,
        'Sections, paragraphs, tables, links, contract values or examples differ from pt-BR')
      const productPage = page === 'index.md' || page === 'roadmap.md' ||
        /^(?:guide|product|backlog)\//.test(page)
      if (productPage) {
        assert.doesNotMatch(translated,
          /origin\/develop|c343698|PREFERENCE_CONFLICT|expectedRevision|collectedAt|@PublicRoute|GET \/analysis/,
          'Implementation or editing-session details leaked into a product page')
      }
    } catch (error) {
      failures.push(`${locale}/${page}: ${error.message}`)
    }
  }
}

const switcher = await readFile(path.join(docs, '.vitepress/theme/LanguageSwitcher.vue'), 'utf8')
const flags = [...switcher.matchAll(/flag: '([a-z]{2})'/g)].map(match => match[1])
assert.equal(flags.length, locales.length, 'Every language needs a flag')
await Promise.all(flags.map(flag => access(path.join(docs, `public/flags/${flag}.svg`))))

if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Documentation parity: ${locales.length} locales × ${pages.length} pages; sections, paragraphs, tables, links, contract values, examples and flags checked.`)
}
