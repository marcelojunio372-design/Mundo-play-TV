export async function loginMacPortal(server, mac) {
  const url = server + "/portal.php?type=stb&action=handshake&JsHttpRequest=1-xml";

  const res = await fetch(url, {
    headers: {
      Cookie: "mac=" + mac,
    },
  });

  return await res.json();
}
