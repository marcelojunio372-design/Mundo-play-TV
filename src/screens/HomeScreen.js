import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
} from "react-native";

const { width, height } = Dimensions.get("window");
const isPhone = width < 900;

export default function HomeScreen({
  session,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSettings,
  onReload,
  onLogout,
  onSelectMovie,
  onSelectSeries,
}) {
  const movies = session?.data?.movies || [];
  const series = session?.data?.series || [];

  const featured = useMemo(() => {
    const movieItems = movies.slice(0, 10).map((item) => ({
      ...item,
      mediaType: "movie",
    }));

    const seriesItems = series.slice(0, 10).map((item) => ({
      ...item,
      mediaType: "series",
    }));

    return [...movieItems, ...seriesItems];
  }, [movies, series]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!featured.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % featured.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [featured]);

  const item = featured[index] || featured[0] || null;

  const openFeatured = () => {
    if (!item) return;

    if (item.mediaType === "series") {
      onSelectSeries?.(item);
    } else {
      onSelectMovie?.(item);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.brand}>MUNDO PLAY TV</Text>
        <Text style={styles.datetime}>
          {new Date().toLocaleTimeString("pt-BR")}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.sidebar}>
          <Btn text="LIVE TV" onPress={onOpenLive} />
          <Btn text="FILMES" onPress={onOpenMovies} />
          <Btn text="SÉRIES" onPress={onOpenSeries} />
          <Btn text="CONFIG." onPress={onOpenSettings} />
          <Btn text="RECARREGAR" onPress={onReload} />
          <Btn text="SAIR" onPress={onLogout} />
        </View>

        <TouchableOpacity style={styles.main} onPress={openFeatured} activeOpacity={0.92}>
          <ImageBackground
            source={{
              uri:
                item?.cover ||
                item?.backdrop ||
                item?.fanart ||
                item?.poster ||
                item?.logo ||
                "https://i.imgur.com/6Z8FQ0C.jpg",
            }}
            style={styles.hero}
            imageStyle={styles.heroImage}
          >
            <View style={styles.overlay} />

            <View style={styles.heroContent}>
              <Image
                source={{
                  uri: item?.logo || item?.poster || item?.cover || "https://i.imgur.com/6Z8FQ0C.jpg",
                }}
                style={styles.poster}
              />

              <View style={styles.info}>
                <Text style={styles.type}>
                  {item?.mediaType === "series" ? "SÉRIE" : "FILME"}
                </Text>

                <Text style={styles.title} numberOfLines={2}>
                  {item?.name || "MUNDO PLAY TV"}
                </Text>

                <Text style={styles.desc} numberOfLines={3}>
                  {item?.description || "Conteúdo disponível"}
                </Text>

                <View style={styles.button}>
                  <Text style={styles.buttonText}>TOQUE PARA ABRIR</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Btn = ({ text, onPress }) => (
  <TouchableOpacity style={styles.sideBtn} onPress={onPress}>
    <Text style={styles.sideText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111e",
  },

  topbar: {
    height: 60,
    backgroundColor: "#0c1c2c",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  brand: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },

  datetime: {
    color: "#9eb3c7",
  },

  content: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: 110,
    backgroundColor: "#061522",
    padding: 10,
  },

  sideBtn: {
    backgroundColor: "#0b1b2b",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  sideText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },

  main: {
    flex: 1,
  },

  hero: {
    flex: 1,
    justifyContent: "center",
  },

  heroImage: {
    resizeMode: "contain",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  heroContent: {
    flexDirection: "row",
    paddingHorizontal: 26,
    paddingVertical: 24,
    alignItems: "center",
  },

  poster: {
    width: 150,
    height: 220,
    borderRadius: 12,
    marginRight: 22,
    backgroundColor: "#132235",
  },

  info: {
    flex: 1,
    backgroundColor: "rgba(18, 22, 34, 0.42)",
    borderRadius: 18,
    padding: 18,
  },

  type: {
    color: "#38d7ff",
    fontWeight: "900",
    marginBottom: 8,
    fontSize: 16,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },

  desc: {
    color: "#ffffff",
    marginTop: 14,
    fontSize: 17,
    lineHeight: 24,
  },

  button: {
    marginTop: 22,
    borderColor: "#38d7ff",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
    backgroundColor: "rgba(56,215,255,0.12)",
  },

  buttonText: {
    color: "#38d7ff",
    fontWeight: "900",
    fontSize: 13,
  },
});
