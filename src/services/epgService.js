let MEMORY_EPG_CACHE = [];
let MEMORY_EPG_CACHE_TIME = 0;
let MEMORY_EPG_LOADING = null;

const EPG_CACHE_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12000;
const RETRY_DELAY_MS = 1200;

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function sleep(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function normalizeId(value = "") {
  return decodeXml(String(value || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeName(value = "") {
  return decodeXml(String(value || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(fhd|hd|sd|uhd|4k|fullhd|h265|hevc)\b/g, "")
    .replace(/\b(tv|tvc|canal|channel)\b/g, "")
    .replace(/\b(brasil|br)\b/g, "")
    .replace(/[|[\]()/\\\-_.:,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAliases(name = "", tvgId = "", tvgName = "", displayNames = []) {
  const base = [
    safeText(name),
    safeText(tvgId),
    safeText(tvgName),
    ...displayNames.map((item) => safeText(item)),
    normalizeName(name),
    normalizeName(tvgName),
    ...displayNames.map((item) => normalizeName(item)),
  ];

  return Array.from(
    new Set(
      base
        .map((item) => normalizeId(item))
        .filter(Boolean)
    )
  );
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

function buildCandidateUrls(session) {
  const list = [];
  const xmltvUrl = buildXmltvUrlFromSession(session);
  const sessionUrl =
    safeText(session?.url) ||
    safeText(session?.playlistUrl) ||
    safeText(session?.data?.url) ||
    safeText(session?.data?.playlistUrl);

  if (xmltvUrl) list.push(xmltvUrl);

  if (sessionUrl) {
    try {
      const parsed = new URL(sessionUrl);
      const username =
        parsed.searchParams.get("username") ||
        safeText(session?.username) ||
        safeText(session?.data?.username);
      const password =
        parsed.searchParams.get("password") ||
        safeText(session?.password) ||
        safeText(session?.data?.password);

      if (username && password) {
        list.push(
          `${parsed.origin}/xmltv.php?username=${encodeURIComponent(
            username
          )}&password=${encodeURIComponent(password)}`
        );
      }
    } catch (e) {}
  }

  return Array.from(new Set(list.filter(Boolean)));
}

function looksLikeValidXmltv(text = "") {
  const raw = String(text || "");
  if (!raw) return false;
  if (raw.includes("<tv")) return true;
  if (raw.includes("<!DOCTYPE tv")) return true;
  return false;
}

function looksLikeCloudflareOrHtml(text = "") {
  const raw = String(text || "").toLowerCase();
  if (!raw) return false;
  return (
    raw.includes("<html") ||
    raw.includes("cloudflare") ||
    raw.includes("attention required") ||
    raw.includes("please enable cookies") ||
    raw.includes("blocked")
  );
}

function buildHeaders(url = "") {
  let origin = "";
  let referer = "";

  try {
    const parsed = new URL(url);
    origin = parsed.origin;
    referer = `${parsed.origin}/`;
  } catch (e) {}

  const headers = {
    Accept: "application/xml,text/xml,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  };

  if (origin) headers.Origin = origin;
  if (referer) headers.Referer = referer;

  return headers;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchXmltvOnce(url = "") {
  const response = await fetchWithTimeout(
    url,
    {
      method: "GET",
      headers: buildHeaders(url),
    },
    FETCH_TIMEOUT_MS
  );

  const text = await response.text();
  return {
    ok: !!response?.ok,
    status: response?.status || 0,
    text,
  };
}

async function fetchXmltvWithRetry(session) {
  const urls = buildCandidateUrls(session);

  for (const url of urls) {
    try {
      const first = await fetchXmltvOnce(url);

      if (first.ok && looksLikeValidXmltv(first.text)) {
        return first.text;
      }

      if (looksLikeCloudflareOrHtml(first.text)) {
        await sleep(RETRY_DELAY_MS);

        const second = await fetchXmltvOnce(url);
        if (second.ok && looksLikeValidXmltv(second.text)) {
          return second.text;
        }
      }
    } catch (e) {}
  }

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
      normalizedId: normalizeId(channelId),
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

  const minStart = now - 4 * 60 * 60 * 1000;
  const maxStart = now + 24 * 60 * 60 * 1000;

  return stopTime >= minStart && startTime <= maxStart;
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
    const channelInfo = channelMap[channelId] || {
      id: channelId,
      normalizedId: normalizeId(channelId),
      displayNames: [],
      aliases: buildAliases(channelId, channelId, channelId, []),
    };

    programmes.push({
      channel: channelId,
      normalizedChannel: channelInfo.normalizedId,
      displayNames: channelInfo.displayNames || [],
      aliases: channelInfo.aliases || [],
      start,
      stop,
      title,
      desc,
    });
  }

  return programmes;
}

function itemTime(date) {
  return date instanceof Date ? date.getTime() : 0;
}

async function doLoadEPG(session) {
  const now = Date.now();

  if (
    Array.isArray(MEMORY_EPG_CACHE) &&
    MEMORY_EPG_CACHE.length > 0 &&
    now - MEMORY_EPG_CACHE_TIME < EPG_CACHE_MS
  ) {
    return MEMORY_EPG_CACHE;
  }

  const xml = await fetchXmltvWithRetry(session);

  if (!looksLikeValidXmltv(xml)) {
    return MEMORY_EPG_CACHE || [];
  }

  try {
    const channelMap = extractChannelMap(xml);
    const programmes = extractProgrammes(xml, channelMap);

    MEMORY_EPG_CACHE = Array.isArray(programmes) ? programmes : [];
    MEMORY_EPG_CACHE_TIME = Date.now();

    return MEMORY_EPG_CACHE;
  } catch (e) {
    return MEMORY_EPG_CACHE || [];
  }
}

export async function warmupEPG(session) {
  if (MEMORY_EPG_LOADING) return MEMORY_EPG_LOADING;

  MEMORY_EPG_LOADING = doLoadEPG(session)
    .catch(() => MEMORY_EPG_CACHE || [])
    .finally(() => {
      MEMORY_EPG_LOADING = null;
    });

  return MEMORY_EPG_LOADING;
}

export async function loadEPG(session) {
  return warmupEPG(session);
}

function exactTvgIdMatch(item, tvgId) {
  const target = normalizeId(tvgId);
  if (!target) return false;
  return item.normalizedChannel === target;
}

function aliasMatch(item, aliases = []) {
  const itemAliases = Array.isArray(item.aliases) ? item.aliases : [];
  return aliases.some((alias) => itemAliases.includes(alias));
}

export function findNowAndNextForChannel(
  epgItems = [],
  channelName = "",
  group = "",
  tvgId = "",
  tvgName = ""
) {
  const now = new Date();

  if (!Array.isArray(epgItems) || !epgItems.length) {
    return { nowProgram: null, nextProgram: null };
  }

  let matched = [];

  if (safeText(tvgId)) {
    matched = epgItems.filter((item) => exactTvgIdMatch(item, tvgId));
  }

  if (!matched.length) {
    const aliases = buildAliases(channelName, tvgId, tvgName, []);
    matched = epgItems.filter((item) => aliasMatch(item, aliases));
  }

  matched = matched
    .sort((a, b) => itemTime(a.start) - itemTime(b.start))
    .slice(0, 30);

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
