export async function loginXtream(server, username, password) {

  const url = `${server}/player_api.php?username=${username}&password=${password}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.user_info) {
    throw new Error("Login inválido");
  }

  return {
    user: data.user_info.username,
    status: data.user_info.status,
    exp: data.user_info.exp_date,
    server,
    username,
    password
  };
}

export async function getLiveChannels(server, username, password) {

  const url = `${server}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;

  const res = await fetch(url);
  return await res.json();
}

export async function getMovies(server, username, password) {

  const url = `${server}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`;

  const res = await fetch(url);
  return await res.json();
}

export async function getSeries(server, username, password) {

  const url = `${server}/player_api.php?username=${username}&password=${password}&action=get_series`;

  const res = await fetch(url);
  return await res.json();
}
