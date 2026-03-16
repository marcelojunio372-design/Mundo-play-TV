
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, LAYOUT } from "../utils/constants";
import { HOME_FEATURED } from "../data/mockData";

export default function HomeScreen({
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSettings,
  onLogout,
}) {
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HOME_FEATURED.length);
    }, 2500);

    const clock = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(clock);
    };
  }, []);

  const featured = HOME_FEATURED[index];
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("pt-BR");

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
            <Text style={styles.menuText}>LIVE TV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onOpenMovies}>
            <Text style={styles.menuText}>FILMES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onOpenSeries}>
            <Text style={styles.menuText}>SÉRIES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onOpenSettings}>
            <Text style={styles.menuText}>CONFIG.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Text style={styles.menuText}>SAIR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.main}>
          <View style={styles.carousel}>
            <Text style={styles.carouselTitle}>{featured?.title || "Lançamentos"}</Text>
            <Text style={styles.carouselSub}>
              {featured?.subtitle || "Filmes e séries em destaque"}
            </Text>

            <View style={styles.dots}>
              {HOME_FEATURED.map((item, i) => (
                <View
                  key={item.id}
                  style={[styles.dot, i === index && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    height: 56,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.panel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  sub: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
  },
  clock: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 96,
    backgroundColor: "#081624",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    padding: 8,
  },
  menuItem: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panel,
    justifyContent: "center",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  menuText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  main: {
    flex: 1,
    padding: 8,
  },
  carousel: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panel,
    padding: 14,
    justifyContent: "center",
  },
  carouselTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },
  carouselSub: {
    color: COLORS.muted,
    fontSize: 12,
  },
  dots: {
    flexDirection: "row",
    marginTop: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.20)",
    marginRight: 6,
  },
  dotActive: {
    width: 22,
    backgroundColor: COLORS.primary,
  },
});
