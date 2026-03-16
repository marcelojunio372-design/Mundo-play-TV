import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { COLORS, LAYOUT } from "../utils/constants";
import { MOVIE_CATEGORIES, MOVIES } from "../data/mockData";

export default function MoviesScreen({ onBack, onOpenSettings, onLogout }) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const now = useMemo(() => new Date(), []);
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("pt-BR");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerBrand}>🎬 Filmes</Text>
        <Text style={styles.headerClock}>{time}   {date}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.leftPanel}>
          <Text style={styles.searchTitle}>Pesquisa em categorias</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {MOVIE_CATEGORIES.map((item, index) => {
              const active = selectedCategory === index;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.categoryRow, active && styles.categoryRowActive]}
                  onPress={() => setSelectedCategory(index)}
                >
                  <Text
                    style={[
                      styles.categoryName,
                      active && styles.categoryNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <Text
                    style={[
                      styles.categoryCount,
                      active && styles.categoryNameActive,
                    ]}
                  >
                    {item.count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.gridPanel}>
          <Text style={styles.gridTitle}>TODOS OS FILMES</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.posterGrid}>
              {MOVIES.map((item) => (
                <TouchableOpacity key={item.id} style={styles.posterCard}>
                  <View style={styles.poster}>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.posterTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.bottomBtn} onPress={onBack}>
          <Text style={styles.bottomBtnText}>VOLTAR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={onOpenSettings}>
          <Text style={styles.bottomBtnText}>CONFIGURAÇÃO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={onLogout}>
          <Text style={styles.bottomBtnText}>SAIR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101737" },

  header: {
    height: LAYOUT.isTV ? 70 : 56,
    paddingHorizontal: LAYOUT.isTV ? 18 : 10,
    backgroundColor: "#2b2f66",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBrand: {
    color: "#d9f6ff",
    fontSize: LAYOUT.isTV ? 18 : 12,
    fontWeight: "700",
  },

  headerClock: {
    color: "#e7fbff",
    fontSize: LAYOUT.isTV ? 16 : 11,
    fontWeight: "700",
  },

  body: {
    flex: 1,
    flexDirection: "row",
    padding: LAYOUT.isTV ? 12 : 8,
  },

  leftPanel: {
    width: LAYOUT.isTV ? 360 : 130,
    paddingRight: 10,
  },

  searchTitle: {
    color: "#dff8ff",
    fontSize: LAYOUT.isTV ? 16 : 10,
    marginBottom: 10,
  },

  categoryRow: {
    minHeight: LAYOUT.isTV ? 54 : 40,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryRowActive: {
    backgroundColor: "#6de9ea",
    borderRadius: 4,
  },

  categoryName: {
    color: "#ecf7ff",
    fontSize: LAYOUT.isTV ? 15 : 10,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },

  categoryNameActive: {
    color: "#0d2340",
  },

  categoryCount: {
    color: "#ecf7ff",
    fontSize: LAYOUT.isTV ? 15 : 10,
    fontWeight: "700",
  },

  gridPanel: {
    flex: 1,
    paddingLeft: 10,
  },

  gridTitle: {
    color: "#eaf9ff",
    fontSize: LAYOUT.isTV ? 18 : 12,
    fontWeight: "900",
    marginBottom: 12,
  },

  posterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: LAYOUT.isTV ? 14 : 10,
  },

  posterCard: {
    width: LAYOUT.posterWidth,
    marginBottom: 12,
  },

  poster: {
    width: "100%",
    height: LAYOUT.posterHeight,
    borderRadius: 10,
    backgroundColor: "#3d4b8c",
    marginBottom: 8,
    overflow: "hidden",
  },

  ratingBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#59d1f0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  ratingText: {
    color: "#07354b",
    fontSize: LAYOUT.isTV ? 11 : 8,
    fontWeight: "900",
  },

  posterTitle: {
    color: "#ffffff",
    fontSize: LAYOUT.isTV ? 13 : 10,
    fontWeight: "700",
  },

  bottomActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },

  bottomBtn: {
    flex: 1,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  bottomBtnText: {
    color: COLORS.primary,
    fontSize: LAYOUT.isTV ? 13 : 10,
    fontWeight: "900",
  },
});


