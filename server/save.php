<?php
// server/save.php — simple example endpoint to save JSON (optional)
// SECURITY NOTE: This is a demo. In production, add authentication, validation, and safe storage.
header('Content-Type: application/json');
$data = file_get_contents('php://input');
if (!$data) { http_response_code(400); echo json_encode(['error'=>'No data']); exit; }
$id = bin2hex(random_bytes(6));
file_put_contents(__DIR__ . "/cv_${id}.json", $data);
echo json_encode(['ok'=>true, 'id'=>$id]);
