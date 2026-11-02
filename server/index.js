// server/index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const PORT = Number(process.env.PORT) || 3001;
// Prod ortamında CLIENT_ORIGIN ile kısıtlanmalı; lokalde her origin'e izin veriyoruz
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || true;

// Oyun ayarları
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const WRONG_REVEAL_MS = 1200; // Yanlış kartın kapanmadan önce görünme süresi
const ROUND_PAUSE_MS = 1500; // Sürekli modda biri bitirince kartlar kapanmadan önceki bekleme
const RECONNECT_GRACE_MS = 15000; // Bağlantısı kopan oyuncunun odadan atılmadan önce beklenmesi
const NAME_MIN = 2;
const NAME_MAX = 16;
const AVATAR_MAX_LENGTH = 200000;

// Kurucunun lobide seçebileceği değerler
const OPTIONS = {
  mode: ['classic', 'marathon'], // marathon: kazanan çıkar, kalanlar sıralama için devam eder
  // Kartların ekranda nasıl yazılacağı; sunucu her zaman sıra numarası (1..N) tutar
  symbols: ['numbers', 'odd', 'even', 'letters'],
  cardCount: [3, 5, 7, 9, 12, 15, 20],
  turnSeconds: [0, 10, 20, 30, 60] // 0 = süresiz
};

// Varsayılan seviye 5: masa varsayılan yeşille açılır, renk ancak kurucu seviyeyi yükseltince değişir
const DEFAULT_SETTINGS = { mode: 'classic', symbols: 'numbers', cardCount: 5, turnSeconds: 30 };

// Oyun sırasında gönderilebilen hazır tepkiler (emoji ve mesajlar). Sadece bu anahtarlar
// kabul edilir; serbest metin yoktur. İstemcideki karşılıkları: src/utils/constants/reactions.ts
const REACTION_KINDS = new Set([
  'heart', 'clap', 'genius', 'party', 'fire', 'wow',
  'super', 'smart', 'memory', 'awesome', 'close', 'respect'
]);
const REACTION_WINDOW_MS = 5000;
const REACTION_LIMIT = 5; // Oyuncu başına pencere içinde en fazla tepki

const SYMBOL_NAMES = { numbers: 'sayı', odd: 'tek sayı', even: 'çift sayı', letters: 'harf' };

// Kurucu bir ayarı değiştirince diğer oyunculara gösterilecek açıklama
const describeSetting = (key, value) => {
  switch (key) {
    case 'mode':
      return `oyun türünü "${value === 'marathon' ? 'Sürekli Devam' : 'Klasik'}" yaptı`;
    case 'symbols':
      return `kartları ${SYMBOL_NAMES[value] ?? 'sayı'} yaptı`;
    case 'cardCount':
      return `seviyeyi ${value} kart yaptı`;
    case 'turnSeconds':
      return value ? `hamle süresini ${value} sn yaptı` : 'hamle süresini kaldırdı';
    default:
      return null;
  }
};

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 1e6
});

/* ---------------- Skorlar ----------------
   Skorlar oda bazında, sadece sunucunun hafızasında tutulur (oyuncu başına galibiyet ve
   oyun sayısı). Kalıcı bir skor tablosu yok; ileride bir veritabanına taşınabilir. */

// Uyandırma ve sağlık kontrolü: arayüz açılır açılmaz çağırır ki ücretsiz sunucu
// (uykudaysa) oyuncu butona basana kadar uyanmış olsun
app.get('/health', (_req, res) => res.json({ ok: true }));

/* ---------------- Oda yönetimi ---------------- */

// roomId -> room
const rooms = new Map();

const shuffle = (list) => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const createRoom = ({ isPublic = false, solo = false } = {}) => {
  let id;
  do {
    id = uuidv4().slice(0, 8);
  } while (rooms.has(id));

  const room = {
    id,
    isPublic,
    solo,
    hostId: null,
    status: 'lobby', // lobby | playing | finished
    settings: { ...DEFAULT_SETTINGS },
    gameId: 0, // Her yeni oyunda artar
    dealId: 0, // Kartlar her dağıtıldığında/karıştırıldığında artar; istemci dağıtma animasyonu için kullanır
    turnSeq: 0, // Her yeni hamle süresinde artar; istemci sayacı buna göre yeniden başlatır
    players: [],
    cards: [],
    revealed: [],
    nextExpected: 1,
    currentPlayerId: null,
    turnEndsAt: null,
    locked: false,
    // Bitirenler sırasıyla; klasik modda yalnızca kazanan olur
    finishers: [],
    // Oyun bittikten sonra "tekrar oynamak istiyorum" diyen oyuncular
    rematchRequests: new Set(),
    startedAt: null,
    finishedAt: null,
    timers: { turn: null, wrong: null },
    removalTimers: new Map()
  };
  rooms.set(id, room);
  return room;
};

const minPlayers = (room) => (room.solo ? 1 : MIN_PLAYERS);
const maxPlayers = (room) => (room.solo ? 1 : MAX_PLAYERS);

const toPublic = (room) => ({
  roomId: room.id,
  isPublic: room.isPublic,
  solo: room.solo,
  hostId: room.hostId,
  status: room.status,
  settings: room.settings,
  gameId: room.gameId,
  dealId: room.dealId,
  turnSeq: room.turnSeq,
  players: room.players.map(({ id, name, avatar, connected, wins, games, mistakes, moves }) => ({
    id,
    name,
    avatar,
    connected,
    wins,
    games,
    mistakes,
    moves
  })),
  rematchRequests: [...room.rematchRequests],
  // Kapalı kartların değerleri istemciye gönderilmez
  board: room.cards.map((value, i) => (room.revealed[i] ? value : null)),
  nextExpected: room.nextExpected,
  currentPlayerId: room.currentPlayerId,
  // İstemci saatine bağımlı olmamak için kalan süre gönderilir
  turnRemainingMs: room.turnEndsAt ? Math.max(0, room.turnEndsAt - Date.now()) : null,
  locked: room.locked,
  finishers: room.finishers,
  winnerId: room.finishers[0]?.id ?? null,
  durationMs: room.startedAt ? (room.finishedAt || Date.now()) - room.startedAt : null,
  minPlayers: minPlayers(room),
  maxPlayers: maxPlayers(room)
});

const broadcast = (room) => io.to(room.id).emit('room:state', toPublic(room));

const notify = (room, message, type = 'info') => io.to(room.id).emit('room:notice', { message, type });

const findPlayer = (room, playerId) => room.players.find((p) => p.id === playerId);

const hasFinished = (room, playerId) => room.finishers.some((f) => f.id === playerId);

// Sırası gelebilecek oyuncular: bağlı ve henüz bitirmemiş
const isEligible = (room, player) => player.connected && !hasFinished(room, player.id);

const clearGameTimers = (room) => {
  clearTimeout(room.timers.turn);
  clearTimeout(room.timers.wrong);
  room.timers.turn = null;
  room.timers.wrong = null;
};

const resetBoard = (room) => {
  room.revealed = room.cards.map(() => false);
  room.nextExpected = 1;
  room.locked = false;
};

const toLobby = (room) => {
  clearGameTimers(room);
  room.status = 'lobby';
  room.cards = [];
  room.revealed = [];
  room.nextExpected = 1;
  room.currentPlayerId = null;
  room.turnEndsAt = null;
  room.locked = false;
  room.finishers = [];
  room.rematchRequests.clear();
  room.startedAt = null;
  room.finishedAt = null;
};

const startTurnTimer = (room) => {
  clearTimeout(room.timers.turn);
  room.timers.turn = null;
  room.turnSeq += 1;
  const seconds = room.settings.turnSeconds;
  if (!seconds) {
    room.turnEndsAt = null;
    return;
  }
  room.turnEndsAt = Date.now() + seconds * 1000;
  room.timers.turn = setTimeout(() => {
    const player = findPlayer(room, room.currentPlayerId);
    if (player) {
      player.mistakes += 1;
      notify(room, room.solo ? 'Süre doldu, baştan başla!' : `${player.name} için süre doldu`);
    }
    resetBoard(room);
    advanceTurn(room);
    broadcast(room);
  }, seconds * 1000);
};

const startTurn = (room, playerId) => {
  room.currentPlayerId = playerId;
  startTurnTimer(room);
};

// Sırayı, verilen indeksten başlayarak uygun ilk oyuncuya verir
const giveTurnFromIndex = (room, startIndex) => {
  const count = room.players.length;
  for (let k = 0; k < count; k++) {
    const candidate = room.players[(startIndex + k) % count];
    if (isEligible(room, candidate)) {
      startTurn(room, candidate.id);
      return;
    }
  }
  // Kimse bağlı değilse sıra bitirmemiş ilk oyuncuya geçer
  const fallback = room.players.find((p) => !hasFinished(room, p.id)) || room.players[0];
  startTurn(room, fallback.id);
};

const advanceTurn = (room) => {
  const index = room.players.findIndex((p) => p.id === room.currentPlayerId);
  giveTurnFromIndex(room, index + 1);
};

const dealCards = (room) => {
  room.cards = shuffle(Array.from({ length: room.settings.cardCount }, (_, i) => i + 1));
  room.dealId += 1;
};

const startGame = (room) => {
  clearGameTimers(room);
  room.status = 'playing';
  room.gameId += 1;
  dealCards(room);
  room.finishers = [];
  room.startedAt = Date.now();
  room.finishedAt = null;
  room.players.forEach((p) => {
    p.mistakes = 0;
    p.moves = 0;
  });
  room.rematchRequests.clear();
  resetBoard(room);
  // İlk sırayı rastgele bir oyuncu alır
  giveTurnFromIndex(room, Math.floor(Math.random() * room.players.length));
};

const finishGame = (room) => {
  clearGameTimers(room);
  room.status = 'finished';
  room.finishedAt = Date.now();
  room.currentPlayerId = null;
  room.turnEndsAt = null;
  room.locked = false;
  const winner = findPlayer(room, room.finishers[0]?.id);
  if (winner) winner.wins += 1;
  // Bu oyunda odada bulunan herkes için oynanan oyun sayısı
  room.players.forEach((p) => (p.games += 1));
};

// Oyuncu tüm kartları doğru sırayla açtığında
const completeRun = (room, player) => {
  room.finishers.push({ id: player.id, name: player.name });

  const remaining = room.players.filter((p) => !hasFinished(room, p.id));
  const continues = room.settings.mode === 'marathon' && remaining.length > 1;

  if (!continues) {
    // Sürekli modda son kalan oyuncu otomatik olarak sonuncu olur
    if (room.settings.mode === 'marathon' && remaining.length === 1) {
      room.finishers.push({ id: remaining[0].id, name: remaining[0].name });
    }
    finishGame(room);
    return;
  }

  // Sürekli mod: bitiren pasife geçer, kartlar karıştırılır ve kalanlar yeni dizilimle devam eder
  notify(room, `${player.name} ${room.finishers.length}. oldu! Kartlar karıştırılıyor...`, 'start');
  clearTimeout(room.timers.turn);
  room.turnEndsAt = null;
  room.locked = true;
  room.timers.wrong = setTimeout(() => {
    room.timers.wrong = null;
    dealCards(room);
    resetBoard(room);
    advanceTurn(room);
    broadcast(room);
  }, ROUND_PAUSE_MS);
};

const removePlayer = (room, playerId, message) => {
  const index = room.players.findIndex((p) => p.id === playerId);
  if (index === -1) return;

  const [player] = room.players.splice(index, 1);
  room.rematchRequests.delete(playerId);
  clearTimeout(room.removalTimers.get(playerId));
  room.removalTimers.delete(playerId);

  if (room.players.length === 0) {
    clearGameTimers(room);
    rooms.delete(room.id);
    console.log(`Room ${room.id} closed`);
    return;
  }

  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    notify(room, `${room.players[0].name} artık oda kurucusu`);
  }

  if (room.status === 'playing') {
    const active = room.players.filter((p) => !hasFinished(room, p.id));
    if (room.players.length < minPlayers(room)) {
      toLobby(room);
      notify(room, 'Yeterli oyuncu kalmadı, oyun lobiye döndü');
    } else if (active.length <= 1 && room.finishers.length > 0) {
      // Sürekli modda tek bir yarışan kaldıysa oyun biter
      if (active.length === 1) room.finishers.push({ id: active[0].id, name: active[0].name });
      finishGame(room);
    } else if (room.currentPlayerId === playerId) {
      clearTimeout(room.timers.wrong);
      resetBoard(room);
      giveTurnFromIndex(room, index);
    }
  }

  notify(room, message || `${player.name} oyundan ayrıldı`, 'leave');
  broadcast(room);
};

const validateName = (rawName) => {
  const name = typeof rawName === 'string' ? rawName.trim().replace(/\s+/g, ' ') : '';
  if (name.length < NAME_MIN || name.length > NAME_MAX) return null;
  return name;
};

const validateAvatar = (avatar) =>
  typeof avatar === 'string' && avatar.startsWith('data:image/') && avatar.length <= AVATAR_MAX_LENGTH ? avatar : null;

// Yalnızca izin verilen değerleri alır, gerisini yok sayar
const sanitizeSettings = (input = {}) => {
  const next = {};
  for (const key of Object.keys(OPTIONS)) {
    if (OPTIONS[key].includes(input[key])) next[key] = input[key];
  }
  return next;
};

/* ---------------- Socket olayları ---------------- */

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  const currentRoom = () => rooms.get(socket.data.roomId);

  const reply = (ack, payload) => {
    if (typeof ack === 'function') ack(payload);
  };

  const fail = (ack, error) => reply(ack, { ok: false, error });

  const leaveCurrentRoom = () => {
    const room = currentRoom();
    if (room) {
      socket.leave(room.id);
      removePlayer(room, socket.data.playerId);
    }
    socket.data.roomId = null;
    socket.data.playerId = null;
  };

  const addPlayer = (room, name, avatar, ack) => {
    const player = {
      id: uuidv4(),
      name,
      avatar,
      socketId: socket.id,
      connected: true,
      wins: 0,
      games: 0,
      mistakes: 0,
      moves: 0
    };
    room.players.push(player);
    if (!room.hostId) room.hostId = player.id;

    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.data.playerId = player.id;

    reply(ack, { ok: true, roomId: room.id, playerId: player.id, state: toPublic(room) });
    socket.to(room.id).emit('room:notice', { message: `${name} Oyuna Dahil Oldu`, type: 'join' });
    broadcast(room);
    console.log(`${name} joined room ${room.id}`);
  };

  const canJoin = (room, name) => {
    if (room.solo) return 'Bu oda tek kişilik.';
    if (room.status !== 'lobby') return 'Oyun şu an devam ediyor, bitince tekrar deneyebilirsin.';
    if (room.players.length >= MAX_PLAYERS) return `Oda dolu (en fazla ${MAX_PLAYERS} oyuncu).`;
    const taken = room.players.some((p) => p.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'));
    if (taken) return 'Bu kullanıcı adı odada kullanılıyor.';
    return null;
  };

  const requireHost = (ack) => {
    const room = currentRoom();
    if (!room) return fail(ack, 'Odada değilsin.');
    if (room.hostId !== socket.data.playerId) return fail(ack, 'Bunu yalnızca oda kurucusu yapabilir.');
    return room;
  };

  // Davet linki ile paylaşılacak özel oda veya tek kişilik oda oluşturur
  socket.on('room:create', ({ name, avatar, solo } = {}, ack) => {
    const validName = validateName(name);
    if (!validName) return fail(ack, `Kullanıcı adı ${NAME_MIN}-${NAME_MAX} karakter olmalı.`);

    leaveCurrentRoom();
    addPlayer(createRoom({ solo: solo === true }), validName, validateAvatar(avatar), ack);
  });

  // Bekleyen herkese açık bir odaya katılır, yoksa yenisini açar
  socket.on('room:quickPlay', ({ name, avatar } = {}, ack) => {
    const validName = validateName(name);
    if (!validName) return fail(ack, `Kullanıcı adı ${NAME_MIN}-${NAME_MAX} karakter olmalı.`);

    leaveCurrentRoom();
    const room =
      [...rooms.values()].find((r) => r.isPublic && !canJoin(r, validName)) || createRoom({ isPublic: true });
    addPlayer(room, validName, validateAvatar(avatar), ack);
  });

  // Davet linkiyle gelen kişiye katılmadan önce odayı tanıtır
  socket.on('room:peek', ({ roomId } = {}, ack) => {
    const room = rooms.get(roomId);
    if (!room) return fail(ack, 'Oda bulunamadı. Süresi dolmuş veya kapanmış olabilir.');

    const host = findPlayer(room, room.hostId);
    let blocked = null;
    if (room.solo) blocked = 'Bu oda tek kişilik.';
    else if (room.status !== 'lobby') blocked = 'Oyun şu an devam ediyor, bitince tekrar deneyebilirsin.';
    else if (room.players.length >= MAX_PLAYERS) blocked = `Oda dolu (en fazla ${MAX_PLAYERS} oyuncu).`;

    reply(ack, {
      ok: true,
      hostName: host?.name ?? null,
      players: room.players.map(({ id, name, avatar }) => ({ id, name, avatar, isHost: id === room.hostId })),
      maxPlayers: MAX_PLAYERS,
      settings: room.settings,
      blocked
    });
  });

  // Davet linki ile katılma veya sayfa yenilendiğinde odaya geri dönme
  socket.on('room:join', ({ roomId, name, avatar, playerId } = {}, ack) => {
    const room = rooms.get(roomId);
    if (!room) return fail(ack, 'Oda bulunamadı. Süresi dolmuş veya kapanmış olabilir.');

    const existing = playerId && findPlayer(room, playerId);
    if (existing) {
      if (socket.data.roomId && socket.data.roomId !== room.id) leaveCurrentRoom();
      clearTimeout(room.removalTimers.get(existing.id));
      room.removalTimers.delete(existing.id);
      existing.socketId = socket.id;
      const wasDisconnected = !existing.connected;
      existing.connected = true;

      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.data.playerId = existing.id;

      reply(ack, { ok: true, roomId: room.id, playerId: existing.id, state: toPublic(room) });
      if (wasDisconnected) socket.to(room.id).emit('room:notice', { message: `${existing.name} geri döndü`, type: 'join' });
      broadcast(room);
      return;
    }

    const validName = validateName(name);
    if (!validName) return fail(ack, `Kullanıcı adı ${NAME_MIN}-${NAME_MAX} karakter olmalı.`);

    const error = canJoin(room, validName);
    if (error) return fail(ack, error);

    leaveCurrentRoom();
    addPlayer(room, validName, validateAvatar(avatar), ack);
  });

  socket.on('room:leave', (_payload, ack) => {
    leaveCurrentRoom();
    reply(ack, { ok: true });
  });

  // Kurucu lobide oyun türü, kart sayısı, sembol ve süreyi değiştirir
  socket.on('room:settings', (input, ack) => {
    const room = requireHost(ack);
    if (!room) return;
    if (room.status === 'playing') return fail(ack, 'Oyun sırasında ayarlar değiştirilemez.');

    const changes = sanitizeSettings(input);
    if (room.solo) delete changes.mode;
    const changedKeys = Object.keys(changes).filter((key) => room.settings[key] !== changes[key]);
    Object.assign(room.settings, changes);
    reply(ack, { ok: true });

    const host = findPlayer(room, room.hostId);
    for (const key of changedKeys) {
      const text = describeSetting(key, changes[key]);
      if (host && text) socket.to(room.id).emit('room:notice', { message: `${host.name} ${text}`, type: 'info' });
    }
    broadcast(room);
  });

  // Kurucu yetkisini başka bir oyuncuya devreder
  socket.on('room:transferHost', ({ playerId } = {}, ack) => {
    const room = requireHost(ack);
    if (!room) return;
    const target = findPlayer(room, playerId);
    if (!target || target.id === room.hostId) return fail(ack, 'Geçersiz oyuncu.');
    if (!target.connected) return fail(ack, 'Bağlantısı kopmuş oyuncuya devredilemez.');

    room.hostId = target.id;
    reply(ack, { ok: true });
    notify(room, `${target.name} artık oda kurucusu`);
    broadcast(room);
  });

  socket.on('game:start', (_payload, ack) => {
    const room = requireHost(ack);
    if (!room) return;
    if (room.status === 'playing') return fail(ack, 'Oyun zaten başladı.');

    const connectedCount = room.players.filter((p) => p.connected).length;
    if (connectedCount < minPlayers(room)) return fail(ack, `Oyunu başlatmak için en az ${MIN_PLAYERS} oyuncu gerekli.`);

    startGame(room);
    reply(ack, { ok: true });
    if (!room.solo) notify(room, 'Oyun başladı!', 'start');
    broadcast(room);
  });

  // Odadaki oyunculara kısa ömürlü bir tepki (emoji / hazır mesaj) gönderir
  socket.on('room:reaction', ({ kind } = {}, ack) => {
    const room = currentRoom();
    if (!room || room.solo) return fail(ack, 'Tepki gönderilemez.');
    if (!REACTION_KINDS.has(kind)) return fail(ack, 'Geçersiz tepki.');
    const player = findPlayer(room, socket.data.playerId);
    if (!player) return fail(ack, 'Odada değilsin.');

    // Taşkınlığı önle
    const now = Date.now();
    player.reactionTimes = (player.reactionTimes || []).filter((t) => now - t < REACTION_WINDOW_MS);
    if (player.reactionTimes.length >= REACTION_LIMIT) return fail(ack, 'Biraz yavaş!');
    player.reactionTimes.push(now);

    reply(ack, { ok: true });
    io.to(room.id).emit('room:reaction', { id: `${player.id}-${now}`, playerId: player.id, name: player.name, kind });
  });

  // Oyun bitince kurucu olmayan oyuncu tekrar oynamak istediğini bildirir;
  // kurucu kabul ederse (game:start) aynı odada aynı ayarlarla yeni oyun başlar
  socket.on('game:rematch', (_payload, ack) => {
    const room = currentRoom();
    if (!room) return fail(ack, 'Odada değilsin.');
    if (room.status !== 'finished') return fail(ack, 'Oyun henüz bitmedi.');
    if (room.hostId === socket.data.playerId) return fail(ack, 'Kurucu yeni oyunu doğrudan başlatabilir.');

    const player = findPlayer(room, socket.data.playerId);
    const isNew = !room.rematchRequests.has(player.id);
    room.rematchRequests.add(player.id);
    reply(ack, { ok: true });
    const host = findPlayer(room, room.hostId);
    if (isNew && host) {
      io.to(host.socketId).emit('room:notice', { message: `${player.name} tekrar oynamak istiyor`, type: 'info' });
    }
    broadcast(room);
  });

  // Sonuç ekranından herkesi lobiye geri döndürür
  socket.on('game:restart', (_payload, ack) => {
    const room = requireHost(ack);
    if (!room) return;
    if (room.status !== 'finished') return fail(ack, 'Oyun henüz bitmedi.');

    toLobby(room);
    reply(ack, { ok: true });
    broadcast(room);
  });

  socket.on('card:flip', ({ index } = {}, ack) => {
    const room = currentRoom();
    if (!room || room.status !== 'playing') return fail(ack, 'Oyun devam etmiyor.');
    if (room.currentPlayerId !== socket.data.playerId) return fail(ack, 'Sıra sende değil.');
    if (room.locked) return fail(ack, 'Kartlar kapanıyor, bekle.');
    if (!Number.isInteger(index) || index < 0 || index >= room.cards.length) return fail(ack, 'Geçersiz kart.');
    if (room.revealed[index]) return fail(ack, 'Bu kart zaten açık.');

    const player = findPlayer(room, socket.data.playerId);
    player.moves += 1;
    room.revealed[index] = true;
    const value = room.cards[index];
    reply(ack, { ok: true, value });

    if (value === room.nextExpected) {
      room.nextExpected += 1;
      if (room.nextExpected > room.cards.length) {
        completeRun(room, player);
      } else {
        startTurnTimer(room);
      }
      broadcast(room);
      return;
    }

    // Yanlış kart: kısa süre göster, sonra hepsini kapat ve sırayı devret
    player.mistakes += 1;
    clearTimeout(room.timers.turn);
    room.turnEndsAt = null;
    room.locked = true;
    broadcast(room);

    room.timers.wrong = setTimeout(() => {
      room.timers.wrong = null;
      resetBoard(room);
      advanceTurn(room);
      broadcast(room);
    }, WRONG_REVEAL_MS);
  });

  socket.on('disconnect', () => {
    const room = currentRoom();
    const player = room && findPlayer(room, socket.data.playerId);
    console.log('User disconnected:', socket.id);
    if (!player || player.socketId !== socket.id) return;

    player.connected = false;
    notify(room, `${player.name} bağlantısı koptu`, 'leave');
    broadcast(room);

    // Sayfa yenileme gibi kısa kopmalarda oyuncuyu hemen atmıyoruz
    room.removalTimers.set(
      player.id,
      setTimeout(() => {
        room.removalTimers.delete(player.id);
        if (!player.connected) removePlayer(room, player.id);
      }, RECONNECT_GRACE_MS)
    );
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
