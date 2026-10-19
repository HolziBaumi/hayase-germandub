/**
 * German Dub (Nyaa) – Hayase-Extension für deutsche Synchro
 * Autor: Holzi_Baumi
 * https://github.com/HolziBaumi/hayase-germandub
 */
export default new class GermanDub {
  base = 'https://nyaa.si/?page=rss&c=1_0&f=0&q='

  // Treffer müssen nach deutscher Synchro aussehen
  dubRegex = /(\bger(man)?[\s._\/-]*dub|\bgerdub|\bdeutsch|\bger\b|\bgerman\b|\bmulti[\s._-]*(audio|dub)|\bdual[\s._-]*audio)/i
  // reine deutsche Untertitel (Ger Sub) aussortieren
  subOnly = /\bger(man)?[\s._-]*sub/i
  stop = new Set(['the', 'and', 'for', 'with', 'from', 'season', 'part', 'movie', 'film'])

  async single({ titles, episode, resolution }) {
    const raw = await this.searchAll(titles, episode, resolution)
    const out = []
    for (const r of raw) {
      if (!this.matchesShow(r.title, titles)) continue
      if (episode == null || this.hasEpisode(r.title, episode)) out.push(r)
      else if (this.isBatch(r.title)) out.push({ ...r, type: 'batch', accuracy: 'low' })
    }
    return this.dedupe(out)
  }

  async batch({ titles, resolution }) {
    const raw = await this.searchAll(titles, null, resolution)
    return this.dedupe(
      raw.filter(r => this.matchesShow(r.title, titles) && this.isBatch(r.title))
         .map(r => ({ ...r, type: 'batch', accuracy: 'low' }))
    )
  }

  async movie({ titles, resolution }) {
    const raw = await this.searchAll(titles, null, resolution)
    return this.dedupe(raw.filter(r => this.matchesShow(r.title, titles)))
  }

  async searchAll(titles, episode, resolution) {
    if (!titles?.length) return []
    const results = []
    for (const title of titles.slice(0, 2)) {
      results.push(...await this.search(title, episode, resolution))
    }
    return results
  }

  async search(title, episode, resolution) {
    const clean = title.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
    let query = clean
    if (episode != null) query += ` ${String(episode).padStart(2, '0')}`
    query += ' (german|ger|deutsch)'
    if (resolution) query += ` ${resolution}`

    try {
      const res = await fetch(this.base + encodeURIComponent(query))
      if (!res.ok) return []
      return this.parse(await res.text())
    } catch (e) {
      return []
    }
  }

  parse(xml) {
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []
    const tag = (s, name) => s.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]?.trim() || ''
    const out = []

    for (const item of items) {
      const title = this.decode(tag(item, 'title').replace(/<!\[CDATA\[|\]\]>/g, ''))
      if (!this.dubRegex.test(title) || (this.subOnly.test(title) && !/dub/i.test(title))) continue

      const hash = tag(item, 'nyaa:infoHash').toLowerCase()
      if (!hash) continue

      out.push({
        title,
        link: this.magnet(hash, title),
        hash,
        seeders: Number(tag(item, 'nyaa:seeders')) || 0,
        leechers: Number(tag(item, 'nyaa:leechers')) || 0,
        downloads: Number(tag(item, 'nyaa:downloads')) || 0,
        size: this.toBytes(tag(item, 'nyaa:size')),
        date: new Date(tag(item, 'pubDate')),
        accuracy: 'medium',
        type: /\bger(man)?[\s._\/-]*dub|\bgerdub|\bdeutsch/i.test(title) ? 'best' : 'alt'
      })
    }
    return out
  }

  // Gehört der Torrent überhaupt zur gesuchten Serie?
  matchesShow(title, titles) {
    if (!titles?.length) return true
    const lower = title.toLowerCase()
    for (const t of titles) {
      const tokens = t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
        .filter(w => w.length >= 3 && !this.stop.has(w))
      if (!tokens.length) continue
      const hits = tokens.filter(w => lower.includes(w)).length
      if (hits >= Math.ceil(tokens.length * 0.6)) return true
    }
    return false
  }

  hasEpisode(title, ep) {
    const n = String(ep).replace(/^0+/, '') || '0'
    return [
      new RegExp(`\\b(?:e|ep|episode\\s*|s\\d{1,2}e)0*${n}\\b(?!\\d)`, 'i'),
      new RegExp(`[\\s._][-~]\\s+0*${n}(?:v\\d)?(?=[\\s\\[\\(]|$)`, 'i'),
      new RegExp(`[\\[\\(]0*${n}(?:v\\d)?[\\]\\)]`, 'i')
    ].some(re => re.test(title))
  }

  isBatch(title) {
    if (/\bs\d{1,2}e\d{1,3}\b(?!\s*[-~])/i.test(title)) return false
    return /\bbatch\b|\bcomplete\b|\bseason\s*\d+\b|\bs\d{1,2}\b(?!\s*e\d)|\b\d{1,3}\s*[-~]\s*\d{1,3}\b/i.test(title)
  }

  decode(s) {
    return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  }

  magnet(hash, name) {
    const trackers = [
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://open.stealth.si:80/announce',
      'udp://tracker.torrent.eu.org:451/announce',
      'udp://exodus.desync.com:6969/announce',
      'http://nyaa.tracker.wf:7777/announce'
    ].map(t => 'tr=' + encodeURIComponent(t)).join('&')
    return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name)}&${trackers}`
  }

  toBytes(str) {
    const m = str.match(/([\d.]+)\s*(KiB|MiB|GiB|TiB)/i)
    if (!m) return 0
    const pow = { kib: 1, mib: 2, gib: 3, tib: 4 }[m[2].toLowerCase()]
    return Math.round(parseFloat(m[1]) * 1024 ** pow)
  }

  dedupe(list) {
    const seen = new Set()
    return list.filter(r => !seen.has(r.hash) && seen.add(r.hash))
  }

  async test() {
    const res = await fetch(this.base + 'one%20piece%20german')
    if (!res.ok) throw new Error('nyaa.si antwortet mit HTTP ' + res.status)
    return true
  }
}()
