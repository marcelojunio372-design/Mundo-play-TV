import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import {
  addToHistory,
  getFavorites,
  toggleFavorite,
  updateContinueWatching,
} from "../utils/storage";
import {
  buildMovieStreamUrl,
  buildSeriesEpisodeUrl,
  buildLiveStreamUrl,
  loadShortEpg,
  loadXtreamSeriesInfo,
  mapSeriesEpisodes,
} from "../utils/iptv";

export default function PlayerScreen({ route, navigation }) {
  const params = route?.params || {};
  const item = params?.item || null;
  const loginType = params?.loginType || "xtream";
  const server = params?.server || "";
  const username = params?.username || "";
  const password = params?.password || "";
  const section = params?.section || "live";
  const episode = params?.episode || null;

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [epgList, setEpgList] = useState([]);
  const [seriesSeasons, setSeriesSeasons] = useState([]);

  const streamUrl = useMemo(() => {
    if (!item) return "";

    if (section === "series" && episode) {
      return buildSeriesEpisodeUrl(server, username, password, episode);
    }

    if (loginType === "m3u") {
      return item?.url || "";
    }

    if (section === "live") {
      return buildLiveStreamUrl(server, username, password, item);
    }

    if (section === "vod") {
      return buildMovieStreamUrl(server, username, password, item);
    }

    return item?.url || "";
  }, [item, loginType, server, username, password, section, episode]);

  useEffect(() => {
    async function setup() {
      if (!item) return;

      const favs = await getFavorites();
      const id = `${section}:${item?.id}`;
      setFavorite(favs.some((x) => x?.favId === id));

      await addToHistory(item, section);

      if (section === "live" && loginType === "xtream" && item?.raw?.stream_id) {
        try {
          const epg = await loadShortEpg(server, username, password, item.raw.stream_id);
          setEpgList(epg);
        } catch {
          setEpgList([]);
        }
      }

      if (section === "series" && loginType === "xtream" && item?.raw?.series_id) {
        try {
          const info = await loadXtreamSeriesInfo(
            server,
            username,
            password,
            item.raw.series_id
          );
          const seasons = mapSeriesEpisodes(info);
          setSeriesSeasons(seasons);
        } catch {
          setSeriesSeasons([]);
        }
      }
    }

    setup();
  }, [item, section, loginType, server, username, password]);

  async function handleToggleFavorite() {
    if (!item) return;
    const next = await toggleFavorite(item, section);
    const id = `${section}:${item?.id}`;
    setFavorite(next.some((x) => x?.favId === id));
  }

  async function handlePlaybackStatusUpdate(status) {
    if (!status) return;

    if (status.isLoaded) {
      setLoading(false);
      setErrorText("");

      const positionMillis = status.positionMillis || 0;
      const durationMillis = status.durationMillis || 0;

      if (positionMillis > 0) {
        await updateContinueWatching(item, section, positionMillis, durationMillis);
      }
      return;
    }

    if (status.error) {
      setLoading(false);
      setErrorText("Falha ao reproduzir este conteúdo.");
      Alert.alert("Erro", "Falha ao reproduzir este conteúdo.");
    }
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Item inválido.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (section === "series" && !episode) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {item?.name || "Série"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.detailsBox}>
            <Text style={styles.infoTitle}>{item?.name || "Série"}</Text>
            <Text style={styles.infoText}>{item?.category || "Geral"}</Text>
            <Text style={styles.infoText}>
              {item?.plot || "Sem resumo disponível para esta série."}
            </Text>

            <TouchableOpacity style={styles.actionBtnAlt} onPress={handleToggleFavorite}>
              <Text style={styles.actionBtnAltText}>
                {favorite ? "Desfavoritar" : "Favoritar"}
              </Text>
            </TouchableOpacity>
          </View>

          {seriesSeasons.map((season) => (
            <View key={season.season} style={styles.detailsBox}>
              <Text style={styles.infoTitle}>Temporada {season.season}</Text>

              {season.items.map((ep) => (
                <TouchableOpacity
                  key={ep.id}
                  style={styles.episodeBtn}
                  onPress={() =>
                    navigation.replace("Player", {
                      ...params,
                      episode: ep,
                    })
                  }
                >
                  <Text style={styles.episodeBtnText}>
                    EP {ep.episodeNum} - {ep.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!streamUrl) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>URL do conteúdo não encontrada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={1}>
          {episode ? episode?.name : item?.name || "Player"}
        </Text>
      </View>

      <View style={styles.playerWrap}>
        <Video
          source={{ uri: streamUrl }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={() => {
            setLoading(false);
            setErrorText("Erro ao abrir vídeo.");
          }}
        />

        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#18e7a1" />
            <Text style={styles.overlayText}>Carregando player...</Text>
          </View>
        )}
      </View>

      {!!errorText && (
        <View style={styles.messageBox}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.detailsBox}>
          <Text style={styles.infoTitle}>
            {episode ? episode?.name : item?.name || "Sem nome"}
          </Text>
          <Text style={styles.infoText}>Categoria: {item?.category || "Geral"}</Text>
          <Text style={styles.infoText}>
            {item?.plot ||
              (section === "live"
                ? "Canal ao vivo em reprodução."
                : section === "vod"
                ? "Filme em reprodução."
                : "Episódio em reprodução.")}
          </Text>

          <TouchableOpacity style={styles.actionBtnAlt} onPress={handleToggleFavorite}>
            <Text style={styles.actionBtnAltText}>
              {favorite ? "Desfavoritar" : "Favoritar"}
            </Text>
          </TouchableOpacity>
        </View>

        {section === "live" && epgList.length > 0 && (
          <View style={styles.detailsBox}>
            <Text style={styles.infoTitle}>EPG</Text>
            {epgList.slice(0, 5).map((epg, idx) => (
              <Text key={idx} style={styles.infoText}>
                {epg?.title || epg?.programme_title || "Programa"}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#12031f",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    backgroundColor: "#18e7a1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#111",
    fontWeight: "800",
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 12,
  },
  playerWrap: {
    marginHorizontal: 14,
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlayText: {
    color: "#fff",
    marginTop: 12,
    fontWeight: "700",
  },
  messageBox: {
    marginHorizontal: 14,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
  },
  errorText: {
    color: "#ffb3b3",
    fontWeight: "700",
  },
  detailsBox: {
    margin: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
  },
  infoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  infoText: {
    color: "#d1d1d1",
    marginBottom: 6,
  },
  actionBtnAlt: {
    backgroundColor: "#2a1141",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: "flex-start",
  },
  actionBtnAltText: {
    color: "#fff",
    fontWeight: "800",
  },
  scroll: {
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  episodeBtn: {
    backgroundColor: "#2a1141",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  episodeBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
