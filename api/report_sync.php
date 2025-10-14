<?php
// Minimal-Endpoint: Nimmt JSON an und gibt Erfolg zurück.
// Hier später: Validierung, Auth, DB-Insert, PDF-Generierung (SERVERSEITIG!), etc.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) {
  http_response_code(400);
  echo json_encode(['ok'=>false, 'error'=>'invalid_json']);
  exit;
}

// TODO: Auth prüfen (z. B. Token/Session), Felder validieren, DB schreiben

// --- Serverseitige PDF-Erstellung (später) ---
// Idee: nach erfolgreichem Insert PDF erzeugen und unter Vorgangs-ID ablegen
// $pdfPath = generate_pdf($data); // deine bestehende dompdf/GD Logik nutzen

http_response_code(200);
print json_encode(['ok'=>true, 'serverTime'=>date('c')]);
