let MEMORY_EPG_CACHE = [];
let MEMORY_EPG_CACHE_TIME = 0;

const EPG_CACHE_MS = 10 * 60 * 1000;

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function decodeXml(text = "") {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseXmltvDate(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const match = raw.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/
  );

  if (!match) return null;

  const [, y, m, d, h, min, s] = match;

  return new Date(`${y}-${m}-${d}T${h}:${min}:${s}`);
}

function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function extractTag(block = "", tag = "") {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(regex);
  return match ? decodeXml(match[1].trim()) : "";
}

export async function loadEPG(session) {
  const now = Date.now();

  if (
    MEMORY_EPG_CACHE.length &&
    now - MEMORY_EPG_CACHE_TIME < EPG_CACHE_MS
  ) {
    return MEMORY_EPG_CACHE;
  }

  try {
    let url = "";

    // 🔥 PRIORIDADE 1: URL XMLTV vindo da sessão (M3U ou login)
    if (session?.epgUrl) {
      url = session.epgUrl;
    }

    // 🔥 FALLBACK (se não tiver)
    if (!url) {
      return [];
    }

    const response = await fetch(url);
    const xml = await response.text();

    if (!xml.includes("<programme")) {
      MEMORY_EPG_CACHE = [];
      MEMORY_EPG_CACHE_TIME = now;
      return [];
    }

    const programmes = [];

    const regex =
      /<programme\s+start="([^"]+)"\s+stop="([^"]+)"\s+channel="([^"]+)"[^>]*>([\s\S]*?)<\/programme>/gi;

    let match;

    while ((match = regex.exec(xml))) {
      programmes.push({
        channel: normalize(match[3]),
        start: parseXmltvDate(match[1]),
        stop: parseXmltvDate(match[2]),
        title: extractTag(match[4], "title"),
        desc: extractTag(match[4], "desc"),
      });
    }

    MEMORY_EPG_CACHE = programmes;
    MEMORY_EPG_CACHE_TIME = now;

    return programmes;
  } catch (e) {
    return [];
  }
}

export function findNowAndNextForChannel(
  epgItems = [],
  channelName = "",
  group = "",
  tvgId = "",
  tvgName = ""
) {
  const now = new Date();

  const target = normalize(tvgId || tvgName || channelName);

  const matched = epgItems.filter(
    (item) => item.channel === target
  );

  const nowProgram =
    matched.find(
      (p) => now >= p.start && now < p.stop
    ) || null;

  const nextProgram =
    matched.find(
      (p) => p.start > now
    ) || null;

  return { nowProgram, nextProgram };
}

export function formatProgramTime(program) {
  if (!program?.start || !program?.stop) return "";

  const start = program.start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const stop = program.stop.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${start} - ${stop}`;
}
