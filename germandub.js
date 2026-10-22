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

  // DEBUG: true = Hayase zeigt eine Fehlermeldung mit Details, wenn Nyaa zwar deutsche
  // Treffer liefert, aber alle herausgefiltert werden. Findet Nyaa gar nichts, bleibt die
  // Liste einfach leer. Wenn alles läuft, auf false setzen.
  debug = true

  check(mode, query, raw, out) {
    if (this.debug && raw.length > 0 && !out.length) {
      throw new Error(
        `[GerDub-Debug] ${mode}: Feed-Treffer=${raw.length}, nach Filter=0, ` +
        `Episode=${query.episode}, Titel=${JSON.stringify(query.titles)}, ` +
        `Felder=${Object.keys(query || {}).join(',')}`
      )
    }
    return out
  }

  async single(query) {
    const { titles, episode, resolution } = query
    const raw = await this.searchAll(titles, episode, resolution)
    const out = []
    for (const r of raw) {
      if (!this.matchesShow(r.title, titles)) continue
      if (episode == null || this.hasEpisode(r.title, episode)) out.push(r)
      else if (this.isBatch(r.title)) out.push({ ...r, type: 'batch', accuracy: 'low' })
    }
    return this.check('single', query, raw, this.dedupe(out))
  }

  async batch(query) {
    const { titles, resolution } = query
    const raw = await this.searchAll(titles, null, resolution)
    const out = this.dedupe(
      raw.filter(r => this.matchesShow(r.title, titles) && this.isBatch(r.title))
         .map(r => ({ ...r, type: 'batch', accuracy: 'low' }))
    )
    return this.check('batch', query, raw, out)
  }

  async movie(query) {
    const { titles, resolution } = query
    const raw = await this.searchAll(titles, null, resolution)
    const out = this.dedupe(raw.filter(r => this.matchesShow(r.title, titles)))
    return this.check('movie', query, raw, out)
  }

  async searchAll(titles, episode, resolution) {
    if (!titles?.length) return []
    const results = []
    let lastError = null

    // Gibt false zurück, wenn Nyaa bremst (429) -> dann keine weiteren Anfragen
    const run = async q => {
      try {
        results.push(...await this.fetchFeed(q))
      } catch (e) {
        lastError = e
        if (e.rateLimited) return false
      }
      return true
    }
    const good = () => results.some(r =>
      this.matchesShow(r.title, titles) &&
      (episode == null || this.hasEpisode(r.title, episode) || this.isBatch(r.title)))

    // Anfragen nacheinander und sparsam, damit Nyaa nicht blockiert
    for (const title of titles.slice(0, 2)) {
      const clean = this.clean(title)
      if (!clean) continue
      if (!await run(`${clean} (german|ger|deutsch)`)) break
      if (episode != null && !good()) {
        if (!await run(`${clean} ${String(episode).padStart(2, '0')} (german|ger|deutsch)`)) break
      }
      if (good()) break
    }
    if (!results.length && lastError) throw lastError
    return results
  }

  clean(title) {
    const base = String(title || '').split(':')[0]
    return base.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
  }

  cache = new Map()
  delays = [1500, 3500, 7000]

  async fetchFeed(query) {
    const hit = this.cache.get(query)
    if (hit && Date.now() - hit.time < 5 * 60 * 1000) return hit.items

    for (let attempt = 0; ; attempt++) {
      let res
      try {
        res = await fetch(this.base + encodeURIComponent(query), {
          headers: { Accept: 'application/xml, text/xml, */*' }
        })
      } catch (e) {
        throw new Error('nyaa.si ist gerade nicht erreichbar.')
      }

      if (res.status === 429) {
        if (attempt >= this.delays.length) {
          const err = new Error('nyaa.si bremst gerade zu viele Anfragen (HTTP 429). Kurz warten (ca. 1 Minute) und die Folge erneut öffnen.')
          err.rateLimited = true
          throw err
        }
        await new Promise(r => setTimeout(r, this.delays[attempt] + Math.floor(Math.random() * 400)))
        continue
      }
      if (!res.ok) throw new Error('nyaa.si antwortet mit HTTP ' + res.status)

      const text = await res.text()
      const items = text.includes('<item>') ? this.parse(text) : []
      this.cache.set(query, { time: Date.now(), items })
      return items
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
        title: this.label(title),
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

  // Hayase zeigt über dem Titel den Release-Gruppennamen an (z. B. "IK", "Judas").
  // Hat der Titel keine erkennbare Gruppe, setzen wir [GerDub] davor, sonst stünde dort "No Group".
  label(title) {
    const hasLeadingGroup = /^\s*[\[(【][^\])】]+[\])】]/.test(title)
    const hasTrailingGroup = /-[A-Za-z0-9]{2,}(?:\.[a-z0-9]{2,4})?\s*$/.test(title)
    return hasLeadingGroup || hasTrailingGroup ? title : `[GerDub] ${title}`
  }

  // Gehört der Torrent überhaupt zur gesuchten Serie?
  matchesShow(title, titles) {
    if (!titles?.length) return true
    const lower = title.toLowerCase()
    let usable = 0
    for (const t of titles) {
      const tokens = t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
        .filter(w => w.length >= 3 && !this.stop.has(w))
      if (!tokens.length) continue
      usable++
      const hits = tokens.filter(w => lower.includes(w)).length
      if (hits >= Math.ceil(tokens.length * 0.6)) return true
    }
    return usable === 0
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
