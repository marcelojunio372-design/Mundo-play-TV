export async function warmupEPG(session) {
  return [];
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
