import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../utils/constants";

const ITEMS = [
  {
    title: "LANÇAMENTOS DE FILMES",
    subtitle: "Ação, drama, comédia e destaque da semana",
  },
  {
    title: "LANÇAMENTOS DE SÉRIES",
    subtitle: "Novas temporadas e episódios em destaque",
  },
  {
    title: "DESTAQUES DO IPTV",
    subtitle: "Live TV, filmes e séries organizados por categoria",
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ITEMS.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const item = ITEMS[index];

  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>

        <View style={styles.dotsRow}>
          {ITEMS.map((_, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dot, index === i && styles.dotActive]}
              onPress={() => setIndex(i)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },

  banner: {
    minHeight: 220,
    borderRadius: 26,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    justifyContent: "center",
  },

  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 10,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 18,
    maxWidth: 620,
  },

  dotsRow: {
    flexDirection: "row",
    marginTop: 22,
    gap: 10,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  dotActive: {
    backgroundColor: COLORS.primary,
    width: 28,
  },
});
