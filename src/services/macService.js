export async function loginMAC(portal, mac) {

  const url = `${portal}/portal.php?action=handshake&type=stb&token=&JsHttpRequest=1-xml`;

  const res = await fetch(url, {
    headers: {
      Cookie: `mac=${mac}; stb_lang=en; timezone=America/Sao_Paulo`
    }
  });

  const data = await res.json();

  if (!data.js || !data.js.token) {
    throw new Error("MAC inválido");
  }

  return {
    token: data.js.token
  };
}
