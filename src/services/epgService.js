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
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+\-]\d{4})?$/
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

function buildAliases(name = "", group = "", tvgId = "", tvgName = "") {
  const raw = [
    safeText(name),
    safeText(group),
    safeText(tvgId),
    safeText(tvgName),
    cleanChannelName(name),
    cleanChannelName(tvgName),
  ].filter(Boolean);

  return Array.from(
    new Set(
      raw.map((item) => normalizeText(item)).filter(Boolean)
    )
  );
}

function extractChannelMap(xml = "") {
  const channelMap = {};
  const regex = /<channel\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/channel>/gi;

  let match;

  while ((match = regex.exec(xml))) {
    const channelId = decodeXml(match[1] || "").trim();
    const body = match[2] || "";
    const displayNames = extractTags(body, "display-name");

    channelMap[channelId] = {
      id: channelId,
      displayNames,
      aliases: Array.from(
        new Set(
          [channelId, ...displayNames]
            .map((item) => normalizeText(item))
            .filter(Boolean)
        )
      ),
    };
  }

  return channelMap;
}

function extractProgrammes(xml = "", channelMap = {}) {
  const programmes = [];
  const regex =
    /<programme\s+start="([^"]+)"\s+stop="([^"]+)"\s+channel="([^"]+)"[^>]*>([\s\S]*?)<\/programme>/gi;

  let match;

  while ((match = regex.exec(xml))) {
    const start = parseXmltvDate(match[1]);
    const stop = parseXmltvDate(match[2]);
    const channelId = decodeXml(match[3] || "").trim();
    const body = match[4] || "";

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

export async function loadEPG() {
  try {
    const url =
      "http://epics.zip/xmltv.php?username=Marcelo123&password=128518957";

    const response = await fetch(url);
    const xml = await response.text();

    if (!response.ok || !xml) {
      return [];
    }

    const channelMap = extractChannelMap(xml);
    return extractProgrammes(xml, channelMap);
  } catch (e) {
    return [];
  }
}

function itemTime(date) {
  return date instanceof Date ? date.getTime() : 0;
}

function matchesChannel(itemAliases = [], aliases = []) {
  for (const a of aliases) {
    for (const b of itemAliases) {
      if (!a || !b) continue;

      if (a === b) return true;
      if (a.includes(b)) return true;
      if (b.includes(a)) return true;
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

  const aliases = buildAliases(channelName, group, tvgId, tvgName);

  if (!aliases.length || !Array.isArray(epgItems) || !epgItems.length) {
    return { nowProgram: null, nextProgram: null };
  }

  const matched = epgItems
    .filter((item) => matchesChannel(item.aliases || [], aliases))
    .sort((a, b) => itemTime(a.start) - itemTime(b.start));

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



