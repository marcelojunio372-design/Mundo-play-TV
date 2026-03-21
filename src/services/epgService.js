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

function extractAttr(tagText = "", attr = "") {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tagText.match(new RegExp(`${escaped}="([^"]*)"`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function parseXmltvDate(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const match = raw.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/
  );

  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeText(value = "") {
  return decodeXml(String(value || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(fhd|hd|sd|uhd|4k|fullhd)\b/g, "")
    .replace(/\b(tv|tvc|canal|channel)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function cleanChannelName(name = "") {
  return String(name || "")
    .toLowerCase()
    .replace(/\b(fhd|hd|sd|uhd|4k|fullhd)\b/gi, "")
    .replace(/\b(tv|tvc|canal|channel)\b/gi, "")
    .replace(/[|[\]()/\\\-_.:,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function splitWords(text = "") {
  return cleanChannelName(text)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildAliases(name = "", tvgId = "", tvgName = "") {
  const raw = [
    safeText(name),
    safeText(tvgId),
    safeText(tvgName),
    cleanChannelName(name),
    cleanChannelName(tvgName),
  ].filter(Boolean);

  return Array.from(
    new Set(raw.map((item) => normalizeText(item)).filter(Boolean))
  );
}

function extractChannelMap(xml = "") {
  const channelMap = {};
  const regex = /<channel\b([^>]*)>([\s\S]*?)<\/channel>/gi;

  let match;

  while ((match = regex.exec(xml))) {
    const attrs = match[1] || "";
    const body = match[2] || "";
    const channelId = extractAttr(attrs, "id");
    const displayNames = extractTags(body, "display-name");

    const aliases = Array.from(
      new Set(
        [channelId, ...displayNames]
          .flatMap((item) => [safeText(item), cleanChannelName(item)])
          .map((item) => normalizeText(item))
          .filter(Boolean)
      )
    );

    if (channelId) {
      channelMap[channelId] = {
        id: channelId,
        displayNames,
        aliases,
      };
    }
  }

  return channelMap;
}

function extractProgrammes(xml = "", channelMap = {}) {
  const programmes = [];
  const regex = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi;

  let match;

  while ((match = regex.exec(xml))) {
    const attrs = match[1] || "";
    const body = match[2] || "";

    const channelId = safeText(extractAttr(attrs, "channel"));
    if (!channelId) continue;

    const start = parseXmltvDate(extractAttr(attrs, "start"));
    const stop = parseXmltvDate(extractAttr(attrs, "stop"));
    const title = extractTag(body, "title");
    const desc = extractTag(body, "desc");
    const channelInfo = channelMap[channelId] || null;

    programmes.push({
      channel: channelId,
      aliases: channelInfo?.aliases || [normalizeText(channelId)].filter(Boolean),
      start,
      stop,
      title,
      desc,
    });
  }

  return programmes;
}

function buildXmltvUrl(session = {}) {
  const server = safeText(session?.server);
  const username = safeText(session?.username);
  const password = safeText(session?.password);

  if (server && username && password) {
    return `${server.replace(/\/+$/, "")}/xmltv.php?username=${encodeURIComponent(
      username
    )}&password=${encodeURIComponent(password)}`;
  }

  const rawUrl = safeText(session?.url);
  if (!rawUrl) return "";

  try {
    const parsed = new URL(rawUrl);
    const urlUsername = safeText(parsed.searchParams.get("username"));
    const urlPassword = safeText(parsed.searchParams.get("password"));

    if (parsed.origin && urlUsername && urlPassword) {
      return `${parsed.origin}/xmltv.php?username=${encodeURIComponent(
        urlUsername
      )}&password=${encodeURIComponent(urlPassword)}`;
    }
  } catch (e) {}

  return "";
}

export async function loadEPG(session = {}) {
  const now = Date.now();

  if (
    Array.isArray(MEMORY_EPG_CACHE) &&
    MEMORY_EPG_CACHE.length > 0 &&
    now - MEMORY_EPG_CACHE_TIME < EPG_CACHE_MS
  ) {
    return MEMORY_EPG_CACHE;
  }

  try {
    const url = buildXmltvUrl(session);
    if (!url) return [];

    const response = await fetch(url, {
      headers: {
        Accept: "application/xml,text/xml,text/plain,*/*",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    const xml = await response.text();

    if (!response.ok || !xml || !xml.includes("<tv")) {
      return [];
    }

    const channelMap = extractChannelMap(xml);
    const programmes = extractProgrammes(xml, channelMap);

    MEMORY_EPG_CACHE = Array.isArray(programmes) ? programmes : [];
    MEMORY_EPG_CACHE_TIME = now;

    return MEMORY_EPG_CACHE;
  } catch (e) {
    return [];
  }
}

function itemTime(date) {
  return date instanceof Date ? date.getTime() : 0;
}

function getWordOverlapScore(channelName = "", displayAliases = []) {
  const baseWords = splitWords(channelName);
  if (!baseWords.length) return 0;

  let best = 0;

  displayAliases.forEach((alias) => {
    const aliasWords = splitWords(alias);
    let score = 0;

    baseWords.forEach((word) => {
      if (aliasWords.includes(word)) score += 1;
    });

    if (score > best) best = score;
  });

  return best;
}

function matchesAlias(itemAliases = [], targetAliases = []) {
  for (const target of targetAliases) {
    for (const alias of itemAliases) {
      if (!target || !alias) continue;

      if (target === alias) return true;
      if (target.includes(alias)) return true;
      if (alias.includes(target)) return true;
    }
  }

  return false;
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

  let matched = epgItems.filter((item) =>
    matchesAlias(item.aliases || [], aliases)
  );

  if (!matched.length) {
    matched = epgItems.filter((item) => {
      const overlap = getWordOverlapScore(
        safeText(channelName),
        (item.aliases || []).map((alias) => cleanChannelName(alias))
      );
      return overlap >= 2;
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
