// Sehr schlanke IndexedDB-Helfer (Client-Seite)
import('https://unpkg.com/idb@7/build/esm/index.js').then(({ openDB }) => {
  window.AB_DB_READY = (async () => {
    const db = await openDB('arbeitsbericht', 1, {
      upgrade(db) {
        db.createObjectStore('reports', { keyPath: 'id' });
      }
    });
    return db;
  })();
});
