let MEMORY_EPG_CACHE = [];
let MEMORY_EPG_CACHE_TIME = 0;
let MEMORY_EPG_INDEX = new Map();

const EPG_CACHE_MS = 10 * 60 * 1000;
const EPG_PAST_WINDOW_MS = 6 * 60 * 60 * 1000;
const EPG_FUTURE_WINDOW_MS = 36 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20000;

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
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+\-]\d{4}))?$/
  );

  if (!match) return null;

  const [, year, month, day, hour, minute, second, tz] = match;
  const isoBase = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

  if (!tz) return new Date(isoBase);

  const offset = `${tz.slice(0, 3)}:${tz.slice(3)}`;
  return new Date(`${isoBase}${offset}`);
}

function normalizeText(value = "") {
  return decodeXml(String(value || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(hd|fhd|sd|uhd|4k|fullhd|h265|hevc)\b/g, "")
    .replace(/\b(tv|tvc|canal|channel)\b/g, "")
    .replace(/\b(brasil|br|sudeste|sul|norte|nordeste|centrooeste|centro-oeste)\b/g, "")
    .replace(/\b(local|interior|regional)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function cleanChannelName(name = "") {
  return decodeXml(String(name || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(hd|fhd|sd|uhd|4k|fullhd|h265|hevc)\b/g, "")
    .replace(/\b(tv|tvc|canal|channel)\b/g, "")
    .replace(/\b(brasil|br|sudeste|sul|norte|nordeste|centrooeste|centro-oeste)\b/g, "")
    .replace(/\b(local|interior|regional)\b/g, "")
    .replace(/[|[\]()/\\\-_.:,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitWords(text = "") {
  return cleanChannelName(text)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractTag(block = "", tag = "") {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(regex);
  return match ? decodeXml(match[1].trim()) : "";
}

function extractTags(block = "", tag = "") {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const values = [];
  let match;

  while ((match = regex.exec(block))) {
    const text = decodeXml(match[1].trim());
    if (text) values.push(text);
  }

  return values;
}

function unique(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildAliases(name = "", tvgId = "", tvgName = "", displayNames = []) {
  const raw = unique([
    safeText(name),
    safeText(tvgId),
    safeText(tvgName),
    ...displayNames.map((item) => safeText(item)),
    cleanChannelName(name),
    cleanChannelName(tvgId),
    cleanChannelName(tvgName),
    ...displayNames.map((item) => cleanChannelName(item)),
  ]);

  return unique(raw.map((item) => normalizeText(item)).filter(Boolean));
}

function getAttrValue(attrs = "", attrName = "") {
  if (!attrs || !attrName) return "";

  const doubleQuoted = attrs.match(
    new RegExp(`${attrName}\\s*=\\s*"([^"]*)"`, "i")
  );
  if (doubleQuoted?.[1]) return decodeXml(doubleQuoted[1]).trim();

  const singleQuoted = attrs.match(
    new RegExp(`${attrName}\\s*=\\s*'([^']*)'`, "i")
  );
  if (singleQuoted?.[1]) return decodeXml(singleQuoted[1]).trim();

  return "";
}

function extractChannelMap(xml = "") {
  const channelMap = {};
  const regex = /<channel\b([^>]*)>([\s\S]*?)<\/channel>/gi;

  let match;

  while ((match = regex.exec(xml))) {
    const attrs = match[1] || "";
    const body = match[2] || "";
    const channelId = getAttrValue(attrs, "id");
    const displayNames = extractTags(body, "display-name");

    if (!channelId) continue;

    channelMap[channelId] = {
      id: channelId,
      displayNames,
      aliases: buildAliases(channelId, channelId, channelId, displayNames),
    };
  }

  return channelMap;
}

function shouldKeepProgramme(start, stop) {
  const now = Date.now();
  const startTime = start instanceof Date ? start.getTime() : 0;
  const stopTime = stop instanceof Date ? stop.getTime() : 0;

  if (!startTime || !stopTime) return false;
  if (stopTime < now - EPG_PAST_WINDOW_MS) return false;
  if (startTime > now + EPG_FUTURE_WINDOW_MS) return false;

  return true;
}

function extractProgrammes(xml = "", channelMap = {}) {
  const programmes = [];
  const regex = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi;

  let match;

  while ((match = regex.exec(xml))) {
    const attrs = match[1] || "";
    const body = match[2] || "";

    const start = parseXmltvDate(getAttrValue(attrs, "start"));
    const stop = parseXmltvDate(getAttrValue(attrs, "stop"));
    const channelId = getAttrValue(attrs, "channel");

    if (!channelId) continue;
    if (!shouldKeepProgramme(start, stop)) continue;

    const title = extractTag(body, "title");
    const desc = extractTag(body, "desc");
    const channelInfo = channelMap[channelId] || { displayNames: [], aliases: [] };

    programmes.push({
      channel: channelId,
      displayNames: channelInfo.displayNames || [],
      aliases: unique([
        ...channelInfo.aliases,
        ...buildAliases(channelId, channelId, channelId, channelInfo.displayNames || []),
      ]),
      start,
      stop,
      title,
      desc,
    });
  }

  return programmes;
}

function buildXmltvUrlFromSession(session) {
  const directUrl =
    safeText(session?.epgUrl) ||
    safeText(session?.xmltvUrl) ||
    safeText(session?.data?.epgUrl) ||
    safeText(session?.data?.xmltvUrl);

  if (directUrl) return directUrl;

  const server =
    safeText(session?.server) ||
    safeText(session?.serverUrl) ||
    safeText(session?.data?.server) ||
    safeText(session?.data?.serverUrl);

  const username =
    safeText(session?.username) ||
    safeText(session?.user) ||
    safeText(session?.data?.username) ||
    safeText(session?.data?.user);

  const password =
    safeText(session?.password) ||
    safeText(session?.pass) ||
    safeText(session?.data?.password) ||
    safeText(session?.data?.pass);

  if (server && username && password) {
    return `${server.replace(/\/+$/, "")}/xmltv.php?username=${encodeURIComponent(
      username
    )}&password=${encodeURIComponent(password)}`;
  }

  const sessionUrl =
    safeText(session?.url) ||
    safeText(session?.playlistUrl) ||
    safeText(session?.data?.url) ||
    safeText(session?.data?.playlistUrl);

  if (sessionUrl) {
    try {
      const parsed = new URL(sessionUrl);
      const usernameParam = parsed.searchParams.get("username");
      const passwordParam = parsed.searchParams.get("password");

      if (usernameParam && passwordParam) {
        return `${parsed.origin}/xmltv.php?username=${encodeURIComponent(
          usernameParam
        )}&password=${encodeURIComponent(passwordParam)}`;
      }
    } catch (e) {}
  }

  return "";
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function buildIndex(programmes = []) {
  const index = new Map();

  programmes.forEach((item) => {
    const aliases = Array.isArray(item.aliases) ? item.aliases : [];
    aliases.forEach((alias) => {
      if (!alias) return;
      if (!index.has(alias)) index.set(alias, []);
      index.get(alias).push(item);
    });
  });

  for (const [key, list] of index.entries()) {
    list.sort((a, b) => itemTime(a.start) - itemTime(b.start));
    index.set(key, uniqueProgrammes(list));
  }

  return index;
}

function uniqueProgrammes(items = []) {
  const seen = new Set();
  const out = [];

  items.forEach((item) => {
    const key = [
      safeText(item.channel),
      item.start instanceof Date ? item.start.getTime() : 0,
      item.stop instanceof Date ? item.stop.getTime() : 0,
      safeText(item.title),
    ].join("|");

    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });

  return out;
}

export async function loadEPG(session) {
  const now = Date.now();

  if (
    Array.isArray(MEMORY_EPG_CACHE) &&
    MEMORY_EPG_CACHE.length > 0 &&
    now - MEMORY_EPG_CACHE_TIME < EPG_CACHE_MS
  ) {
    return MEMORY_EPG_CACHE;
  }

  try {
    const url = buildXmltvUrlFromSession(session);
    if (!url) return [];

    const response = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/xml,text/xml,*/*",
          "Cache-Control": "no-cache",
        },
      },
      FETCH_TIMEOUT_MS
    );

    const xml = await response.text();

    if (!response.ok || !xml || !xml.includes("<tv")) {
      return MEMORY_EPG_CACHE || [];
    }

    const channelMap = extractChannelMap(xml);
    const programmes = extractProgrammes(xml, channelMap);

    MEMORY_EPG_CACHE = Array.isArray(programmes) ? programmes : [];
    MEMORY_EPG_CACHE_TIME = now;
    MEMORY_EPG_INDEX = buildIndex(MEMORY_EPG_CACHE);

    return MEMORY_EPG_CACHE;
  } catch (e) {
    return MEMORY_EPG_CACHE || [];
  }
}

function itemTime(date) {
  return date instanceof Date ? date.getTime() : 0;
}

function aliasesMatchStrong(itemAliases = [], targetAliases = []) {
  for (const target of targetAliases) {
    for (const alias of itemAliases) {
      if (!target || !alias) continue;
      if (target === alias) return true;
    }
  }
  return false;
}

function aliasesMatchLoose(itemAliases = [], targetAliases = []) {
  for (const target of targetAliases) {
    for (const alias of itemAliases) {
      if (!target || !alias) continue;
      if (target.includes(alias) || alias.includes(target)) return true;
    }
  }
  return false;
}

function getWordOverlapScore(channelName = "", compareList = []) {
  const baseWords = splitWords(channelName);
  if (!baseWords.length) return 0;

  let best = 0;

  compareList.forEach((alias) => {
    const aliasWords = splitWords(alias);
    let score = 0;

    baseWords.forEach((word) => {
      if (aliasWords.includes(word)) score += 1;
    });

    if (score > best) best = score;
  });

  return best;
}

function collectIndexedCandidates(targetAliases = []) {
  const collected = [];

  targetAliases.forEach((alias) => {
    const list = MEMORY_EPG_INDEX.get(alias);
    if (Array.isArray(list) && list.length) {
      collected.push(...list);
    }
  });

  return uniqueProgrammes(collected);
}

export function findNowAndNextForChannel(
  epgItems = [],
  channelName = "",
  group = "",
  tvgId = "",
  tvgName = ""
) {
  const now = new Date();
  const aliases = buildAliases(channelName, tvgId, tvgName);

  if (!aliases.length || !Array.isArray(epgItems) || !epgItems.length) {
    return { nowProgram: null, nextProgram: null };
  }

  let matched = collectIndexedCandidates(aliases);

  if (!matched.length) {
    matched = epgItems.filter((item) =>
      aliasesMatchStrong(item.aliases || [], aliases)
    );
  }

  if (!matched.length) {
    matched = epgItems.filter((item) =>
      aliasesMatchLoose(item.aliases || [], aliases)
    );
  }

  if (!matched.length) {
    matched = epgItems.filter((item) => {
      const score = getWordOverlapScore(channelName, [
        ...(item.displayNames || []),
        ...(item.aliases || []),
      ]);
      return score >= 1;
    });
  }

  matched = matched.sort((a, b) => itemTime(a.start) - itemTime(b.start));

  if (!matched.length) {
    return { nowProgram: null, nextProgram: null };
  }

  const nowProgram =
    matched.find((item) => {
      if (!item.start || !item.stop) return false;
      return now >= item.start && now < item.stop;
    }) || null;

  const nextProgram =
    matched.find((item) => {
      if (!item.start) return false;
      if (nowProgram?.stop) return item.start >= nowProgram.stop;
      return item.start > now;
    }) || null;

  return {
    nowProgram,
    nextProgram,
  };
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
