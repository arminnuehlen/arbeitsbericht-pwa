const $ = (s) => document.querySelector(s);
const statusEl = $('#status');
const form = $('#reportForm');
const syncBtn = $('#syncNow');

function setStatus(text, cls=''){
  statusEl.className = 'status ' + cls;
  statusEl.textContent = text;
}

function genId(){ return 'R-' + Date.now() + '-' + Math.random().toString(36).slice(2); }

async function saveLocal(report){
  const db = await window.AB_DB_READY;
  await db.put('reports', report);
}

async function getAllReports(){
  const db = await window.AB_DB_READY;
  return await db.getAll('reports');
}

async function removeReport(id){
  const db = await window.AB_DB_READY;
  await db.delete('reports', id);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const report = {
    id: genId(),
    kunde: $('#kunde').value.trim(),
    datum: $('#datum').value,
    taetigkeiten: $('#taetigkeiten').value.trim(),
    start: $('#start').value, ende: $('#ende').value,
    material: $('#material').value.trim(),
    createdAt: Date.now()
  };
  await saveLocal(report);
  setStatus('Offline gespeichert. Wartet auf Synchronisation.', 'ok');
  form.reset();
});

syncBtn.addEventListener('click', async () => {
  await syncAll();
});

window.addEventListener('online', () => syncAll());

async function syncAll(){
  setStatus('Synchronisiere…');
  const reports = await getAllReports();
  if (!reports.length){ setStatus('Keine lokalen Datensätze.'); return; }
  let ok = 0, fail = 0;
  for (const r of reports){
    try {
      const res = await fetch('/api/report_sync.php', {
        method: 'POST', headers:{ 'Content-Type': 'application/json' },
        body: JSON.stringify(r)
      });
      if (!res.ok) throw new Error('HTTP '+res.status);
      await removeReport(r.id);
      ok++;
    } catch(e){ fail++; }
  }
  // Service Worker bitten, Outbox zu spülen (falls nötig)
  if (navigator.serviceWorker?.controller){
    navigator.serviceWorker.controller.postMessage('flush');
  }
  if (fail){ setStatus(`${ok} synchronisiert, ${fail} offen (offline oder Fehler).`, 'warn'); }
  else { setStatus(`${ok} Datensatz/Datensätze synchronisiert.`, 'ok'); }
}
