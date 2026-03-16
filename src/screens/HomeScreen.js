import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";

export default function HomeScreen({
  session,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSettings,
  onLogout,
}) {
  const [index, setIndex] = useState(0);

  const movieItems = session?.data?.movies || [];
  const seriesItems = session?.data?.series || [];

  const featured = useMemo(() => {
    const merged = [...movieItems.slice(0, 5), ...seriesItems.slice(0, 5)];
    return merged.length
      ? merged
      : [
          {
            id: "demo1",
            title: "Lançamentos",
            name: "Lançamentos",
            group: "Filmes e Séries",
            logo: "",
          },
        ];
  }, [movieItems, seriesItems]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % featured.length);
    }, 2500);

    return () => clearInterval(timer);
  }, [featured.length]);

  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("pt-BR");

  const current = featured[index] || featured[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>MUNDO PLAY TV</Text>
          <Text style={styles.sub}>IPTV Profissional</Text>
        </View>
        <Text style={styles.clock}>{time}   {date}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.menuItem} onPress={onOpenLive}>
            <Text style={styles.menuText}>LIVE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onOpenMovies}>
            <Text style={styles.menuText}>FILMES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onOpenSeries}>
            <Text style={styles.menuText}>SÉRIES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onOpenSettings}>
            <Text style={styles.menuText}>CONF.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Text style={styles.menuText}>SAIR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.main}>
          <View style={styles.carousel}>
            {current?.logo ? (
              <Image source={{ uri: current.logo }} style={styles.cover} />
            ) : (
              <View style={styles.coverFallback} />
            )}

            <View style={styles.info}>
              <Text style={styles.carouselTitle} numberOfLines={2}>
                {current?.title || current?.name || "Lançamentos"}
              </Text>

              <Text style={styles.carouselSub} numberOfLines={1}>
                {current?.group || "Filmes e séries"}
              </Text>
            </View>
          </View>

          <View style={styles.dots}>
            {featured.slice(0, 5).map((item, i) => (
              <View key={item.id || String(i)} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111d" },
  header: {
    height: 50,
    paddingHorizontal: 8,
    backgroundColor: "#0d1b2a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { color: "#fff", fontSize: 11, fontWeight: "900" },
  sub: { color: "#9fb2c7", fontSize: 8, marginTop: 1 },
  clock: { color: "#fff", fontSize: 9, fontWeight: "700" },

  content: { flex: 1, flexDirection: "row" },

  sidebar: {
    width: 84,
    padding: 6,
    backgroundColor: "#081624",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },

  menuItem: {
    height: 38,
    borderRadius: 10,
    backgroundColor: "#0d1b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  menuText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  main: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
  },

  carousel: {
    borderRadius: 14,
    backgroundColor: "#0d1b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  cover: {
    width: 70,
    height: 95,
    borderRadius: 10,
    backgroundColor: "#243a57",
  },

  coverFallback: {
    width: 70,
    height: 95,
    borderRadius: 10,
    backgroundColor: "#243a57",
  },

  info: {
    flex: 1,
    marginLeft: 10,
  },

  carouselTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  carouselSub: {
    color: "#9fb2c7",
    fontSize: 10,
    marginTop: 6,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.20)",
    marginHorizontal: 3,
  },

  dotActive: {
    width: 18,
    backgroundColor: "#38d7ff",
  },
});
