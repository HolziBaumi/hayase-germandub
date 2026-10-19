export default new class GermanDub {
  base = 'https://nyaa.si/?page=rss&c=1_0&f=0&q='

  // Treffer müssen nach deutscher Synchro aussehen
  dubRegex = /(\bger(man)?[\s._-]*dub|\bgerdub|\bdeutsch|\bger\b|\bgerman\b|\bmulti[\s._-]*(audio|dub)|\bdual[\s._-]*audio)/i
  // reine deutsche Untertitel (Ger Sub) aussortieren
  subOnly = /\bger(man)?[\s._-]*sub/i

  async single({ titles, episode, resolution }) {
    if (!titles?.length) return []
    const results = []
    for (const title of titles.slice(0, 2)) {
      results.push(...await this.search(title, episode, resolution))
    }
    return this.dedupe(results)
  }

  async batch({ titles, resolution }) {
    if (!titles?.length) return []
    const results = []
    for (const title of titles.slice(0, 2)) {
      results.push(...await this.search(title, null, resolution))
    }
    return this.dedupe(results)
  }

  async movie({ titles, resolution }) {
    return this.batch({ titles, resolution })
  }

  async search(title, episode, resolution) {
    const clean = title.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
    let query = clean
    if (episode) query += ` ${String(episode).padStart(2, '0')}`
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
      const title = tag(item, 'title').replace(/<!\[CDATA\[|\]\]>/g, '')
      if (!this.dubRegex.test(title) || (this.subOnly.test(title) && !/dub/i.test(title))) continue

      const hash = tag(item, 'nyaa:infoHash').toLowerCase()
      if (!hash) continue

      out.push({
        title,
        link: hash, // Hayase akzeptiert Hash oder Magnet/Torrent-Link
        hash,
        seeders: Number(tag(item, 'nyaa:seeders')) || 0,
        leechers: Number(tag(item, 'nyaa:leechers')) || 0,
        downloads: Number(tag(item, 'nyaa:downloads')) || 0,
        size: this.toBytes(tag(item, 'nyaa:size')),
        date: new Date(tag(item, 'pubDate')),
        accuracy: 'medium',
        type: /\bger(man)?[\s._-]*dub|\bgerdub/i.test(title) ? 'best' : 'alt'
      })
    }
    return out
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
    return res.ok
  }
}()
