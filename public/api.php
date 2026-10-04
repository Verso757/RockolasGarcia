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

// 2. Queue Item Operations (/queue/:id/top, /queue/:id/up, /queue/:id/down, DELETE /queue/:id)
if (preg_match('#/queue/([^/]+)/top#', $requestUri, $m) || (isset($_GET['action']) && $_GET['action'] === 'queue-top')) {
    $songId = $m[1] ?? ($_GET['id'] ?? '');
    $foundIdx = -1;
    foreach ($state['queue'] as $i => $s) {
        if ($s['id'] === $songId) {
            $foundIdx = $i;
            break;
        }
    }
    if ($foundIdx !== -1) {
        $song = $state['queue'][$foundIdx];
        array_splice($state['queue'], $foundIdx, 1);
        $song['isFirstPriority'] = true;
        array_unshift($state['queue'], $song);
        saveState($dataFile, $state);
        echo json_encode(['ok' => true, 'queue' => $state['queue']]);
        exit;
    }
    http_response_code(404);
    echo json_encode(['error' => 'Canción no encontrada en la cola']);
    exit;
}

if (preg_match('#/queue/([^/]+)/up#', $requestUri, $m) || (isset($_GET['action']) && $_GET['action'] === 'queue-up')) {
    $songId = $m[1] ?? ($_GET['id'] ?? '');
    $foundIdx = -1;
    foreach ($state['queue'] as $i => $s) {
        if ($s['id'] === $songId) {
            $foundIdx = $i;
            break;
        }
    }
    if ($foundIdx > 0) {
        $temp = $state['queue'][$foundIdx];
        $state['queue'][$foundIdx] = $state['queue'][$foundIdx - 1];
        $state['queue'][$foundIdx - 1] = $temp;
        saveState($dataFile, $state);
    }
    echo json_encode(['ok' => true, 'queue' => $state['queue']]);
    exit;
}

if (preg_match('#/queue/([^/]+)/down#', $requestUri, $m) || (isset($_GET['action']) && $_GET['action'] === 'queue-down')) {
    $songId = $m[1] ?? ($_GET['id'] ?? '');
    $foundIdx = -1;
    foreach ($state['queue'] as $i => $s) {
        if ($s['id'] === $songId) {
            $foundIdx = $i;
            break;
        }
    }
    if ($foundIdx !== -1 && $foundIdx < count($state['queue']) - 1) {
        $temp = $state['queue'][$foundIdx];
        $state['queue'][$foundIdx] = $state['queue'][$foundIdx + 1];
        $state['queue'][$foundIdx + 1] = $temp;
        saveState($dataFile, $state);
    }
    echo json_encode(['ok' => true, 'queue' => $state['queue']]);
    exit;
}

if ($method === 'DELETE' && preg_match('#/queue/([^/]+)#', $requestUri, $m)) {
    $songId = $m[1];
    $state['queue'] = array_values(array_filter($state['queue'], function($s) use ($songId) {
        return $s['id'] !== $songId;
    }));
    saveState($dataFile, $state);
    echo json_encode(['ok' => true, 'queue' => $state['queue']]);
    exit;
}

// Reorder queue with arbitrary fromIndex and toIndex
if (strpos($requestUri, '/queue/reorder') !== false && $method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $from = isset($body['fromIndex']) ? (int)$body['fromIndex'] : -1;
    $to = isset($body['toIndex']) ? (int)$body['toIndex'] : -1;
    if ($from >= 0 && $from < count($state['queue']) && $to >= 0 && $to < count($state['queue'])) {
        $out = array_splice($state['queue'], $from, 1);
        array_splice($state['queue'], $to, 0, $out);
        saveState($dataFile, $state);
    }
    echo json_encode(['ok' => true, 'queue' => $state['queue']]);
    exit;
}

// 3. POST /api/queue (Add song to queue)
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

// 4. POST /api/player/next
if (strpos($requestUri, '/player/next') !== false) {
    if (!empty($state['currentSong'])) {
        $played = $state['currentSong'];
        $played['playedAt'] = round(microtime(true) * 1000);
        $played['playCount'] = 1;
        if (!isset($state['history']) || !is_array($state['history'])) {
            $state['history'] = [];
        }
        array_unshift($state['history'], $played);
        if (count($state['history']) > 25) {
            array_pop($state['history']);
        }
    }

    if (!empty($state['queue'])) {
        $next = array_shift($state['queue']);
        $state['currentSong'] = $next;
        $state['isPlaying'] = true;
        $state['currentSongStartedAt'] = round(microtime(true) * 1000);
    } else {
        $state['currentSong'] = null;
        $state['isPlaying'] = false;
        $state['currentSongStartedAt'] = null;
    }
    saveState($dataFile, $state);
    echo json_encode(['ok' => true, 'currentSong' => $state['currentSong'], 'queue' => $state['queue']]);
    exit;
}

// 5. POST /api/player/play-now
if (strpos($requestUri, '/player/play-now') !== false && $method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $song = $body['song'] ?? null;
    if ($song && !empty($song['videoId'])) {
        if (!empty($state['currentSong'])) {
            $played = $state['currentSong'];
            $played['playedAt'] = round(microtime(true) * 1000);
            $played['playCount'] = 1;
            array_unshift($state['history'], $played);
        }
        $state['queue'] = array_values(array_filter($state['queue'], function($s) use ($song) {
            return $s['id'] !== $song['id'];
        }));
        $state['currentSong'] = $song;
        $state['isPlaying'] = true;
        $state['currentSongStartedAt'] = round(microtime(true) * 1000);
        saveState($dataFile, $state);
        echo json_encode(['ok' => true, 'currentSong' => $state['currentSong'], 'queue' => $state['queue']]);
        exit;
    }
}

// 6. GET /api/song-trivia (Accurate music facts without unrelated text)
if (strpos($requestUri, '/song-trivia') !== false) {
    $title = trim($_GET['title'] ?? '');
    $artist = trim($_GET['artist'] ?? '');
    
    $year = '';
    $album = '';
    $genre = '';
    $curiosity = '';
    
    if ($title) {
        $searchTerm = urlencode($title . ' ' . $artist);
        $itunesUrl = "https://itunes.apple.com/search?term={$searchTerm}&entity=song&limit=1";
        $ctx = stream_context_create(['http' => ['timeout' => 2]]);
        $raw = @file_get_contents($itunesUrl, false, $ctx);
        if ($raw) {
            $json = json_decode($raw, true);
            if (!empty($json['results'][0])) {
                $track = $json['results'][0];
                $album = $track['collectionName'] ?? '';
                $genre = $track['primaryGenreName'] ?? '';
                if (!empty($track['releaseDate'])) {
                    $year = substr($track['releaseDate'], 0, 4);
                }
            }
        }
    }
    
    if (empty($curiosity)) {
        if ($artist) {
            $curiosity = "Tema destacado en el repertorio de {$artist}.";
        } else {
            $curiosity = "Canción que forma parte de la lista de reproducción.";
        }
    }
    
    echo json_encode([
        'trivia' => [
            'videoId' => $_GET['videoId'] ?? '',
            'year' => $year ?: 'Clásico',
            'album' => $album ?: 'Sencillo',
            'genre' => $genre ?: 'Música',
            'curiosity' => $curiosity,
            'eraStyle' => 'modern'
        ]
    ]);
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
