export async function getXtreamLive(server, user, pass) {
  const url =
    server +
    "/player_api.php?username=" +
    user +
    "&password=" +
    pass +
    "&action=get_live_streams";

  const res = await fetch(url);
  return await res.json();
}

export async function getXtreamMovies(server, user, pass) {
  const url =
    server +
    "/player_api.php?username=" +
    user +
    "&password=" +
    pass +
    "&action=get_vod_streams";

  const res = await fetch(url);
  return await res.json();
}

export async function getXtreamSeries(server, user, pass) {
  const url =
    server +
    "/player_api.php?username=" +
    user +
    "&password=" +
    pass +
    "&action=get_series";

  const res = await fetch(url);
  return await res.json();
}
