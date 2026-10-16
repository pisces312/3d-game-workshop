/* =====================================================================
 *  小羊过河 · 联机纯逻辑（不依赖 DOM / 网络，可在浏览器和 Node 中使用）
 *  浏览器：挂到 window.MP；Node / vitest：module.exports
 * ===================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  if (root) root.MP = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  var PROTOCOL_VERSION = 1;
  var PEER_PREFIX = 'sheepriver-';
  // 去掉容易看错的 I / L / O / 0 / 1
  var ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var ROOM_LENGTH = 4;
  var ROOM_RE = /^[A-HJKMNP-Z2-9]{4}$/;
  var DIRS = ['fwd', 'back', 'left', 'right'];
  var MSG_TYPES = ['hello', 'start', 'state', 'win', 'bye'];

  /* ---------- 种子随机数：mulberry32，返回 [0,1) ---------- */
  function mulberry32(seed) {
    if (typeof seed !== 'number' || !isFinite(seed)) throw new TypeError('seed must be a finite number');
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // 每关用不同但可复现的种子
  function levelSeed(seed, levelIdx) {
    return ((seed >>> 0) + Math.imul((levelIdx | 0) + 1, 9973)) >>> 0;
  }
  function randomSeed(rnd) {
    var r = rnd || Math.random;
    return Math.floor(r() * 4294967296) >>> 0;
  }

  /* ---------- 房间码 ---------- */
  function generateRoomCode(rnd) {
    var r = rnd || Math.random, s = '';
    for (var i = 0; i < ROOM_LENGTH; i++) s += ROOM_ALPHABET[Math.floor(r() * ROOM_ALPHABET.length)];
    return s;
  }
  // 去空格、转大写；不合法返回 null
  function normalizeRoomCode(code) {
    if (typeof code !== 'string') return null;
    var c = code.replace(/\s+/g, '').toUpperCase();
    return ROOM_RE.test(c) ? c : null;
  }
  function isValidRoomCode(code) { return normalizeRoomCode(code) !== null; }
  function peerIdFor(code) {
    var c = normalizeRoomCode(code);
    if (!c) throw new Error('invalid room code');
    return PEER_PREFIX + c.toLowerCase();
  }

  /* ---------- 消息编码 / 解码 / 校验 ---------- */
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function isInt(v) { return isNum(v) && Math.floor(v) === v; }

  function validateMessage(m) {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return false;
    if (m.v !== PROTOCOL_VERSION) return false;
    if (MSG_TYPES.indexOf(m.type) < 0) return false;
    switch (m.type) {
      case 'hello':
      case 'bye':
        return true;
      case 'start':
        return isInt(m.seed) && m.seed >= 0 && m.seed <= 0xFFFFFFFF && isInt(m.level) && m.level >= 0 && m.level < 100;
      case 'state':
        return isNum(m.x) && isNum(m.y) && isNum(m.z) && Math.abs(m.x) < 1000 && Math.abs(m.y) < 1000 && Math.abs(m.z) < 1000 &&
          DIRS.indexOf(m.dir) >= 0 && typeof m.vis === 'boolean' && isInt(m.row) && m.row >= 0 && m.row < 1000;
      case 'win':
        return isNum(m.time) && m.time >= 0;
    }
    return false;
  }
  // 把消息对象变成字符串；不合法直接抛错（本端 bug，应尽早暴露）
  function encodeMessage(type, payload) {
    var m = { v: PROTOCOL_VERSION, type: type };
    if (payload) for (var k in payload) if (Object.prototype.hasOwnProperty.call(payload, k) && k !== 'v' && k !== 'type') m[k] = payload[k];
    if (!validateMessage(m)) throw new Error('invalid outgoing message: ' + type);
    return JSON.stringify(m);
  }
  // 对端数据不可信：解析失败或不合法返回 null，不抛错
  function decodeMessage(raw) {
    var m = raw;
    if (typeof raw === 'string') {
      if (raw.length > 4096) return null;
      try { m = JSON.parse(raw); } catch (e) { return null; }
    }
    return validateMessage(m) ? m : null;
  }

  /* ---------- 插值 ---------- */
  function clamp01(t) { return isNum(t) ? Math.max(0, Math.min(1, t)) : 0; }
  function lerp(a, b, t) { var k = clamp01(t); return a + (b - a) * k; }
  // 位置插值，t 被限制在 [0,1]，不会外推越界
  function interpolatePose(from, to, t) {
    var k = clamp01(t);
    return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, z: from.z + (to.z - from.z) * k };
  }

  return {
    PROTOCOL_VERSION: PROTOCOL_VERSION,
    PEER_PREFIX: PEER_PREFIX,
    mulberry32: mulberry32,
    levelSeed: levelSeed,
    randomSeed: randomSeed,
    generateRoomCode: generateRoomCode,
    normalizeRoomCode: normalizeRoomCode,
    isValidRoomCode: isValidRoomCode,
    peerIdFor: peerIdFor,
    validateMessage: validateMessage,
    encodeMessage: encodeMessage,
    decodeMessage: decodeMessage,
    clamp01: clamp01,
    lerp: lerp,
    interpolatePose: interpolatePose
  };
});
