<?php
/**
 * Hostinger PHP Backend for Rockola Rafael García
 * Provides native serverless JSON database and synchronization
 * when hosted on Hostinger shared web hosting (PHP 7.4 - 8.x).
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/rockola_data.json';

function getInitialState() {
    return [
        'name' => 'Rockola de mi Papá Rafael',
        'currentSong' => null,
        'isPlaying' => false,
        'queue' => [],
        'history' => [],
        'autoPlayDj' => true,
        'theme' => 'wurlitzer',
        'currentSongStartedAt' => null,
        'updatedAt' => time() * 1000
    ];
}

function parseDurationToSeconds($duration) {
    if (is_numeric($duration) && $duration > 0) return (int)$duration;
    if (empty($duration) || !is_string($duration)) return 210;
    
    $parts = explode(':', $duration);
    if (count($parts) === 2) {
        return ((int)$parts[0] * 60) + (int)$parts[1];
    }
    if (count($parts) === 3) {
        return ((int)$parts[0] * 3600) + ((int)$parts[1] * 60) + (int)$parts[2];
    }
    return 210;
}

function advanceTimeline(&$state, $dataFile) {
    if (empty($state['isPlaying']) || empty($state['currentSong'])) {
        return;
    }
    if (empty($state['currentSongStartedAt'])) {
        $state['currentSongStartedAt'] = round(microtime(true) * 1000);
        saveState($dataFile, $state);
        return;
    }

    $now = round(microtime(true) * 1000);
    $startedAt = $state['currentSongStartedAt'];
    $durationSec = !empty($state['currentSong']['durationSeconds']) 
        ? $state['currentSong']['durationSeconds'] 
        : parseDurationToSeconds($state['currentSong']['duration'] ?? '');
    
    $elapsedSec = ($now - $startedAt) / 1000;
    
    $changed = false;
    while ($elapsedSec >= $durationSec && !empty($state['currentSong'])) {
        $played = $state['currentSong'];
        $played['playedAt'] = $now;
        $played['playCount'] = 1;
        if (!isset($state['history']) || !is_array($state['history'])) {
            $state['history'] = [];
        }
        array_unshift($state['history'], $played);
        if (count($state['history']) > 25) {
            array_pop($state['history']);
        }

        if (!empty($state['queue'])) {
            $next = array_shift($state['queue']);
            $state['currentSong'] = $next;
            $startedAt += ($durationSec * 1000);
            $state['currentSongStartedAt'] = $startedAt;
            $state['isPlaying'] = true;
            $durationSec = !empty($next['durationSeconds']) 
                ? $next['durationSeconds'] 
                : parseDurationToSeconds($next['duration'] ?? '');
            $elapsedSec = ($now - $startedAt) / 1000;
            $changed = true;
        } else {
            $state['currentSong'] = null;
            $state['isPlaying'] = false;
            $state['currentSongStartedAt'] = null;
            $changed = true;
            break;
        }
    }

    if ($changed) {
        saveState($dataFile, $state);
    }
}

function loadState($file) {
    if (!file_exists($file)) {
        $state = getInitialState();
        saveState($file, $state);
        return $state;
    }
    $raw = @file_get_contents($file);
    if (!$raw) {
        return getInitialState();
    }
    $json = @json_decode($raw, true);
    $state = is_array($json) ? $json : getInitialState();
    advanceTimeline($state, $file);
    return $state;
}

function saveState($file, $state) {
    $state['updatedAt'] = time() * 1000;
    @file_put_contents($file, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Parse endpoint
$state = loadState($dataFile);

// 1. GET /api/state
if (strpos($requestUri, '/state') !== false || isset($_GET['action']) && $_GET['action'] === 'state') {
    echo json_encode($state);
    exit;
}

// 2. POST /api/queue (Add song)
if ((strpos($requestUri, '/queue') !== false || isset($_GET['action']) && $_GET['action'] === 'queue') && $method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body || empty($body['videoId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta videoId o canción inválida']);
        exit;
    }

    $isPriority = !empty($body['isPriority']) || !empty($body['isFirstPriority']);
    $newSong = [
        'id' => 'song_' . round(microtime(true) * 1000) . '_' . bin2hex(random_bytes(3)),
        'videoId' => trim($body['videoId']),
        'title' => trim($body['title'] ?? 'Canción'),
        'artist' => trim($body['artist'] ?? ''),
        'thumbnail' => trim($body['thumbnail'] ?? ('https://img.youtube.com/vi/' . trim($body['videoId']) . '/hqdefault.jpg')),
        'duration' => $body['duration'] ?? '',
        'requestedBy' => trim($body['requestedBy'] ?? ''),
        'votes' => $isPriority ? 10 : 1,
        'voters' => !empty($body['deviceId']) ? [$body['deviceId']] : [],
        'addedAt' => round(microtime(true) * 1000),
        'isFirstPriority' => $isPriority
    ];

    if (empty($state['currentSong'])) {
        $state['currentSong'] = $newSong;
        $state['isPlaying'] = true;
        $state['currentSongStartedAt'] = round(microtime(true) * 1000);
    } elseif ($isPriority) {
        array_unshift($state['queue'], $newSong);
    } else {
        $state['queue'][] = $newSong;
    }

    saveState($dataFile, $state);
    http_response_code(201);
    echo json_encode([
        'ok' => true,
        'song' => $newSong,
        'queue' => $state['queue'],
        'currentSong' => $state['currentSong']
    ]);
    exit;
}

// 3. POST /api/player/next
if (strpos($requestUri, '/player/next') !== false) {
    if (!empty($state['queue'])) {
        $next = array_shift($state['queue']);
        $state['currentSong'] = $next;
        $state['isPlaying'] = true;
    } else {
        $state['currentSong'] = null;
        $state['isPlaying'] = false;
    }
    saveState($dataFile, $state);
    echo json_encode(['ok' => true, 'currentSong' => $state['currentSong'], 'queue' => $state['queue']]);
    exit;
}

// 4. POST /api/player/play
if (strpos($requestUri, '/player/play') !== false) {
    $state['isPlaying'] = true;
    saveState($dataFile, $state);
    echo json_encode(['ok' => true, 'isPlaying' => true]);
    exit;
}

// 5. POST /api/player/pause
if (strpos($requestUri, '/player/pause') !== false) {
    $state['isPlaying'] = false;
    saveState($dataFile, $state);
    echo json_encode(['ok' => true, 'isPlaying' => false]);
    exit;
}

// 6. POST /api/player/sync
if (strpos($requestUri, '/player/sync') !== false) {
    $body = json_decode(file_get_contents('php://input'), true);
    if ($body && isset($body['isPlaying'])) {
        $state['isPlaying'] = (bool)$body['isPlaying'];
    }
    if ($body && !empty($body['currentSong'])) {
        $state['currentSong'] = $body['currentSong'];
    }
    saveState($dataFile, $state);
    echo json_encode(['ok' => true, 'state' => $state]);
    exit;
}

// 7. Default response
echo json_encode($state);
exit;
