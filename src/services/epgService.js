function decodeXml(text = "") {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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

function splitNameParts(text = "") {
  return String(text || "")
    .split(/[\-|/|]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildAliases(...values) {
  const rawValues = values
    .flat()
    .map((item) => decodeXml(String(item || "")).trim())
    .filter(Boolean);

  const expanded = [];

  rawValues.forEach((value) => {
    expanded.push(value);
    expanded.push(cleanChannelName(value));
    splitNameParts(value).forEach((part) => {
      expanded.push(part);
      expanded.push(cleanChannelName(part));
    });
  });

  return Array.from(
    new Set(
      expanded
        .map((item) => normalizeText(item))
        .filter(Boolean)
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
    const icons = [...body.matchAll(/<icon[^>]+src="([^"]+)"/gi)].map((m) =>
      decodeXml(m[1] || "").trim()
    );

    channelMap[channelId] = {
      id: channelId,
      displayNames,
      aliases: buildAliases(channelId, displayNames),
      icon: icons[0] || "",
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
    const category = extractTag(body, "category");
    const channelInfo = channelMap[channelId] || null;

    const aliases = buildAliases(
      channelId,
      channelInfo?.displayNames || [],
      title,
      category
    );

    programmes.push({
      channel: channelId,
      displayNames: channelInfo?.displayNames || [],
      channelKey: normalizeText(channelId),
      cleanChannelKey: normalizeText(cleanChannelName(channelId)),
      aliases,
      start,
      stop,
      title,
      desc,
      category,
      icon: channelInfo?.icon || "",
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

function scoreProgrammeMatch(programme, aliases = []) {
  const programAliases = Array.isArray(programme?.aliases)
    ? programme.aliases
    : [
        programme?.channelKey || "",
        programme?.cleanChannelKey || "",
      ].filter(Boolean);

  let score = 0;

  for (const channelAlias of aliases) {
    for (const programAlias of programAliases) {
      if (!channelAlias || !programAlias) continue;

      if (channelAlias === programAlias) {
        score = Math.max(score, 140);
        continue;
      }

      if (
        channelAlias.startsWith(programAlias) ||
        programAlias.startsWith(channelAlias)
      ) {
        score = Math.max(score, 110);
        continue;
      }

      if (
        channelAlias.includes(programAlias) ||
        programAlias.includes(channelAlias)
      ) {
        score = Math.max(score, 90);
        continue;
      }

      const channelShort = channelAlias.replace(/tv$/, "");
      const programShort = programAlias.replace(/tv$/, "");

      if (
        channelShort &&
        programShort &&
        (channelShort === programShort ||
          channelShort.includes(programShort) ||
          programShort.includes(channelShort))
      ) {
        score = Math.max(score, 85);
      }
    }
  }

  return score;
}

export function findNowAndNextForChannel(epgItems = [], channelName = "") {
  const now = new Date();
  const aliases = buildAliases(channelName);

  if (!aliases.length || !epgItems?.length) {
    return { nowProgram: null, nextProgram: null };
  }

  const scoredMatches = epgItems
    .map((item) => ({
      ...item,
      _score: scoreProgrammeMatch(item, aliases),
    }))
    .filter((item) => item._score >= 85)
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return itemTime(a.start) - itemTime(b.start);
    });

  if (!scoredMatches.length) {
    return { nowProgram: null, nextProgram: null };
  }

  const bestScore = scoredMatches[0]._score;
  const bestMatches = scoredMatches.filter(
    (item) => item._score >= Math.max(85, bestScore - 20)
  );

  const orderedMatches = [...bestMatches].sort(
    (a, b) => itemTime(a.start) - itemTime(b.start)
  );

  const current =
    orderedMatches.find((item) => {
      if (!item.start || !item.stop) return false;
      return now >= item.start && now < item.stop;
    }) || null;

  let nextProgram = null;

  if (current) {
    nextProgram =
      orderedMatches.find((item) => {
        if (!item.start || !current.stop) return false;
        return item.start >= current.stop;
      }) || null;
  } else {
    nextProgram =
      orderedMatches.find((item) => item.start && item.start > now) || null;
  }

  if (!nextProgram) {
    const upcoming = orderedMatches.filter((item) => item.start && item.start > now);
    if (upcoming.length) {
      nextProgram = upcoming[0];
    }
  }

  return {
    nowProgram: current,
    nextProgram,
  };
}

function itemTime(date) {
  return date instanceof Date ? date.getTime() : 0;
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
