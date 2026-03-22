let MEMORY_EPG_CACHE = [];
let MEMORY_EPG_CACHE_TIME = 0;

const EPG_CACHE_MS = 10 * 60 * 1000;

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

export async function loadEPG(session) {
  return [];
}

export function findNowAndNextForChannel(
  epgItems = [],
  channelName = "",
  group = "",
  tvgId = "",
  tvgName = ""
) {
  return {
    nowProgram: null,
    nextProgram: null,
  };
}

export function formatProgramTime(program) {
  return "";
}
