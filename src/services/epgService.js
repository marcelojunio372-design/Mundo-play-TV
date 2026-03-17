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

function extractTag(block = "", tag = "") {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(regex);
  return match ? decodeXml(match[1].trim()) : "";
}

function extractProgrammes(xml = "") {
  const programmes = [];
  const regex =
    /<programme\s+start="([^"]+)"\s+stop="([^"]+)"\s+channel="([^"]+)"[^>]*>([\s\S]*?)<\/programme>/gi;

  let match;
  while ((match = regex.exec(xml))) {
    const start = parseXmltvDate(match[1]);
    const stop = parseXmltvDate(match[2]);
    const channel = decodeXml(match[3] || "").trim();
    const body = match[4] || "";

    programmes.push({
      channel,
      channelKey: normalizeText(channel),
      start,
      stop,
      title: extractTag(body, "title"),
      desc: extractTag(body, "desc"),
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

    return extractProgrammes(xml);
  } catch (e) {
    return [];
  }
}

export function findNowAndNextForChannel(epgItems = [], channelName = "") {
  const now = new Date();
  const channelKey = normalizeText(channelName);

  if (!channelKey || !epgItems?.length) {
    return { nowProgram: null, nextProgram: null };
  }

  const matches = epgItems.filter((item) => {
    if (!item?.channelKey) return false;

    return (
      item.channelKey.includes(channelKey) ||
      channelKey.includes(item.channelKey)
    );
  });

  if (!matches.length) {
    return { nowProgram: null, nextProgram: null };
  }

  const current = matches.find((item) => {
    if (!item.start || !item.stop) return false;
    return now >= item.start && now < item.stop;
  });

  let nextProgram = null;

  if (current) {
    nextProgram =
      matches
        .filter((item) => item.start && current.stop && item.start >= current.stop)
        .sort((a, b) => a.start - b.start)[0] || null;
  } else {
    nextProgram =
      matches
        .filter((item) => item.start && item.start > now)
        .sort((a, b) => a.start - b.start)[0] || null;
  }

  return {
    nowProgram: current || null,
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
