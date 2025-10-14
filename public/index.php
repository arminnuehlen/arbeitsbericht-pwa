<?php
// Hinweis: Diese Datei darf PHP ausgeben, aber der größte Teil ist statisch,
// damit die App-Shell offline funktioniert. PHP kannst du später für dynamische
// Prefill-Daten (Kundenliste etc.) nutzen.
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Arbeitsbericht (PWA)</title>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#0d9488" />
  <link rel="icon" href="/icons/icon-192.png">
  <style>
    body { font-family: system-ui, Arial, sans-serif; margin: 0; padding: 0; background:#f8fafc; color:#0f172a; }
    header { background:#0d9488; color:white; padding: 1rem; position: sticky; top:0; }
    main { padding: 1rem; max-width: 900px; margin: 0 auto; }
    form { background:white; padding:1rem; border-radius:12px; box-shadow: 0 6px 20px rgba(0,0,0,.06); }
    fieldset { border: none; margin:0; padding:0; }
    .row { display:grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    label { display:block; font-size:.9rem; margin:.5rem 0 .25rem; }
    input, textarea, select { width:100%; padding:.6rem .7rem; border:1px solid #cbd5e1; border-radius:10px; background:#fff; }
    textarea { min-height: 120px; }
    .actions { display:flex; gap:.5rem; flex-wrap:wrap; margin-top:1rem; }
    button { border:0; padding:.7rem 1rem; border-radius:10px; cursor:pointer; }
    .primary { background:#0d9488; color:white; }
    .ghost { background:transparent; border:1px solid #94a3b8; color:#0f172a; }
    .status { margin-top: .75rem; font-size:.9rem; color:#334155; }
    .badge { display:inline-block; padding:.2rem .5rem; border-radius:8px; background:#f1f5f9; margin-left:.5rem; }
    .ok { color:#166534; }
    .warn { color:#92400e; }
    .err { color:#991b1b; }
  </style>
</head>
<body>
  <header>
    <strong>Arbeitsbericht (PWA)</strong>
    <span class="badge" id="installStatus">Installierbar prüfen…</span>
  </header>
  <main>
    <form id="reportForm" autocomplete="off">
      <fieldset class="row">
        <div>
          <label for="kunde">Kunde</label>
          <input id="kunde" name="kunde" placeholder="Kundenname" required />
        </div>
        <div>
          <label for="datum">Datum</label>
          <input id="datum" name="datum" type="date" required />
        </div>
      </fieldset>

      <label for="taetigkeiten">Tätigkeiten</label>
      <textarea id="taetigkeiten" name="taetigkeiten" placeholder="Kurzbeschreibung…" required></textarea>

      <fieldset class="row">
        <div>
          <label for="start">Start (Uhrzeit)</label>
          <input id="start" name="start" type="time" required />
        </div>
        <div>
          <label for="ende">Ende (Uhrzeit)</label>
          <input id="ende" name="ende" type="time" required />
        </div>
      </fieldset>

      <label for="material">Material / Nummern</label>
      <textarea id="material" name="material" placeholder="z. B. Ersatzteile, Mengen"></textarea>

      <!-- Platzhalter für Signatur-Canvas (später einbauen) -->

      <div class="actions">
        <button type="submit" class="primary">Speichern (offline)</button>
        <button type="button" id="syncNow" class="ghost">Jetzt synchronisieren</button>
      </div>
      <div id="status" class="status">Bereit.</div>
    </form>
  </main>

  <script>
    // Service Worker registrieren
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
      });
    }

    // PWA-Install-UI minimal
    let deferredPrompt;
    const installBadge = document.getElementById('installStatus');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBadge.textContent = 'Zur Installation bereit';
    });
    window.addEventListener('appinstalled', () => {
      installBadge.textContent = 'Installiert';
    });
  </script>
  <script src="/js/idb.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>
