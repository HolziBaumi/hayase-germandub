# German Dub (Nyaa) – Hayase Extension

**Sprache / Language:** [Deutsch](#deutsch) · [English](#english)

**Autor / Author:** HolzI_Baumi

---

## Deutsch

Eine Extension für [Hayase](https://github.com/hayase-app), die auf Nyaa nach **deutscher Synchro** (German Dub) für Anime sucht und die Treffer direkt in der Torrent-Auswahl von Hayase anzeigt.

> **Status:** in Entwicklung. Die Extension wird noch getestet, einzelne Funktionen können sich ändern.

### Installation

1. Öffne Hayase und gehe auf **Settings → Extensions → Repositories**.
2. Füge diesen Link in das Textfeld ein:

   ```
   https://raw.githubusercontent.com/HolziBaumi/hayase-germandub/main/index.json
   ```

3. Klicke auf **Import Extensions**.
4. Wechsle in den Tab **Extensions** und schalte **German Dub (Nyaa)** ein.

Hayase prüft beim Start automatisch, ob es eine neuere Version gibt. Nach einem Update reicht es also, Hayase neu zu starten.

### Was die Extension macht

- Sucht über den RSS-Feed von [nyaa.si](https://nyaa.si) nach dem Serientitel zusammen mit den Stichwörtern `german`, `ger` und `deutsch`.
- Behält nur Torrents, die nach deutscher Tonspur aussehen, zum Beispiel `German Dub`, `GerDub`, `Deutsch`, `Multi-Audio` oder `Dual Audio`.
- Wirft reine deutsche Untertitel-Releases (`Ger Sub`) heraus.
- Zeigt bei einer einzelnen Folge nur diese Folge an. Komplette Staffelpakete bleiben als Batch erhalten.
- Prüft, ob der Torrent wirklich zur gesuchten Serie gehört.
- Setzt `[GerDub]` vor Titel ohne erkennbare Release-Gruppe, damit Hayase dort nicht „No Group“ anzeigt.
- Fragt Nyaa sparsam ab (nacheinander, mit kurzem Zwischenspeicher und Wiederholung bei HTTP 429), damit Nyaa nicht blockiert.

### Gut zu wissen

- **Multi-Audio-Releases:** Viele Treffer enthalten mehrere Sprachen in einer Datei. Im Player von Hayase musst du die deutsche Tonspur auswählen.
- **Nicht jeder Anime hat einen deutschen Release.** Es werden nur Torrents gefunden, die auf Nyaa wirklich existieren. Findet die Extension nichts, gibt es für diese Serie oft schlicht keinen deutschen Dub auf Nyaa.
- **Suchfeld in Hayase leer lassen.** Was du dort eintippst, nimmt Hayase als Serientitel und schickt es an alle Extensions.
- **Erkennung:** Treffer dieser Extension haben die deutsche Flagge als Icon.

### Problemlösung

| Problem | Lösung |
| --- | --- |
| „Outdated“ bei der Extension | Hayase neu starten. Hilft das nicht, Extension entfernen und den Repository-Link neu importieren. |
| `nyaa.si antwortet mit HTTP 429` | Nyaa bremst zu viele Anfragen. Etwa eine Minute warten und die Folge erneut öffnen. Andere Nyaa-Extensions testweise ausschalten. |
| Keine Treffer | Prüfen, ob für die Serie ein deutscher Release auf Nyaa existiert, und den Test mit einem Anime wiederholen, für den es einen gibt (z. B. Solo Leveling). |
| Fehlermeldung mit `[GerDub-Debug]` | Der Debug-Modus ist an (siehe unten). Den Text der Meldung bitte mit einem Issue melden. |

### Dateien

| Datei | Inhalt |
| --- | --- |
| `index.json` | Manifest für Hayase (Name, Version, Autor, Links) |
| `germandub.js` | Der eigentliche Code der Extension |

### Für Entwickler

In `germandub.js` gibt es den Schalter `debug = true`. Solange er an ist, zeigt Hayase bei einem leeren Ergebnis eine Fehlermeldung mit Details (Anzahl der Feed-Treffer, Folge, übergebene Titel). Für den normalen Betrieb auf `debug = false` setzen.

Nach jeder Änderung am Code die Versionsnummer in `index.json` erhöhen, sonst übernimmt Hayase die neue Datei nicht.

### Hinweis

Die Extension speichert und verbreitet keine Dateien. Sie durchsucht nur den öffentlichen Nyaa-Index. Für die Nutzung der gefundenen Inhalte bist du selbst verantwortlich, beachte die Gesetze deines Landes.

### Mitmachen

Fehler und Vorschläge gerne als [Issue](https://github.com/HolziBaumi/hayase-germandub/issues) melden.

[↑ Nach oben](#german-dub-nyaa--hayase-extension)

---

## English

An extension for [Hayase](https://github.com/hayase-app) that searches Nyaa for **German-dubbed** anime and shows the results directly in Hayase's torrent picker.

> **Status:** work in progress. The extension is still being tested and some features may change.

### Installation

1. Open Hayase and go to **Settings → Extensions → Repositories**.
2. Paste this link into the text field:

   ```
   https://raw.githubusercontent.com/HolziBaumi/hayase-germandub/main/index.json
   ```

3. Click **Import Extensions**.
4. Switch to the **Extensions** tab and enable **German Dub (Nyaa)**.

Hayase checks for newer versions on startup, so after an update it is enough to restart Hayase.

### What it does

- Searches the RSS feed of [nyaa.si](https://nyaa.si) for the series title together with the keywords `german`, `ger` and `deutsch`.
- Keeps only torrents that look like they contain a German audio track, for example `German Dub`, `GerDub`, `Deutsch`, `Multi-Audio` or `Dual Audio`.
- Drops releases with German subtitles only (`Ger Sub`).
- For a single episode, shows only that episode. Full season packs are kept as batches.
- Checks that the torrent really belongs to the series you are looking for.
- Prepends `[GerDub]` to titles without a recognizable release group, so Hayase does not show "No Group".
- Queries Nyaa sparingly (one request after another, with a short cache and retries on HTTP 429) to avoid being blocked.

### Good to know

- **Multi-audio releases:** Many results contain several languages in one file. You need to select the German audio track in Hayase's player.
- **Not every anime has a German release.** Only torrents that actually exist on Nyaa can be found. If the extension finds nothing, there is often simply no German dub on Nyaa for that series.
- **Leave the search field in Hayase empty.** Whatever you type there is used as the series title and sent to all extensions.
- **Recognition:** Results from this extension use the German flag as their icon.

### Troubleshooting

| Problem | Solution |
| --- | --- |
| "Outdated" label on the extension | Restart Hayase. If that does not help, remove the extension and re-import the repository link. |
| `nyaa.si antwortet mit HTTP 429` | Nyaa is rate-limiting requests. Wait about a minute and open the episode again. Try disabling other Nyaa extensions. |
| No results | Check whether a German release for the series exists on Nyaa, and repeat the test with an anime that has one (e.g. Solo Leveling). |
| Error message containing `[GerDub-Debug]` | Debug mode is on (see below). Please report the message text in an issue. |

### Files

| File | Content |
| --- | --- |
| `index.json` | Manifest for Hayase (name, version, author, links) |
| `germandub.js` | The extension's actual code |

### For developers

`germandub.js` contains a switch `debug = true`. While it is on, Hayase shows an error message with details when the result is empty (number of feed hits, episode, titles passed in). Set it to `debug = false` for normal use.

After every code change, increase the version number in `index.json`, otherwise Hayase will not pick up the new file.

### Disclaimer

This extension does not store or distribute any files. It only searches the public Nyaa index. You are responsible for how you use the content you find, please follow the laws of your country.

### Contributing

Bug reports and suggestions are welcome as [issues](https://github.com/HolziBaumi/hayase-germandub/issues).

[↑ Back to top](#german-dub-nyaa--hayase-extension)
