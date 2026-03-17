import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import VideoPlayer from "../components/VideoPlayer";

function buildSeriesCategories(series) {
  const grouped = {};

  series.forEach((item) => {
    const group = item.group || "OUTROS";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  });

  const categories = [
    { id: "all", name: "TODAS", items: series },
    { id: "fav", name: "FAVORITOS", items: [] },
    { id: "last", name: "RECENTE", items: [] },
  ];

  Object.keys(grouped).forEach((group, index) => {
    categories.push({
      id: `series_group_${index}`,
      name: group.toUpperCase(),
      items: grouped[group],
    });
  });

  return categories;
}

export default function SeriesScreen({ session, onBack, onOpenSettings, onLogout }) {
  const series = session?.data?.series || [];
  const categories = useMemo(() => buildSeriesCategories(series), [series]);

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedSeries, setSelectedSeries] = useState(0);

  const visibleSeries = categories[selectedCategory]?.items || [];
  const current = visibleSeries[selectedSeries];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerBtn}>VOLTAR</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>SÉRIES</Text>

        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.headerBtn}>SAIR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.leftPanel}>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const active = selectedCategory === index;

              return (
                <TouchableOpacity
                  style={[styles.categoryRow, active && styles.categoryActive]}
                  onPress={() => {
                    setSelectedCategory(index);
                    setSelectedSeries(0);
                  }}
                >
                  <Text
                    style={[styles.categoryText, active && styles.categoryTextActive]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.categoryCount, active && styles.categoryTextActive]}
                  >
                    {item.items.length}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.centerPanel}>
          <FlatList
            data={visibleSeries}
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            numColumns={3}
            initialNumToRender={18}
            maxToRenderPerBatch={18}
            windowSize={10}
            contentContainerStyle={styles.grid}
            renderItem={({ item, index }) => {
              const active = selectedSeries === index;
              return (
                <TouchableOpacity
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => setSelectedSeries(index)}
                >
                  {item.logo ? (
                    <Image source={{ uri: item.logo }} style={styles.poster} />
                  ) : (
                    <View style={styles.posterFallback} />
                  )}

                  <Text style={styles.title} numberOfLines={2}>
                    {item.name || item.title || "Sem nome"}
                  </Text>

                  <Text style={styles.group} numberOfLines={1}>
                    {item.group || "Série"}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.rightPanel}>
          <VideoPlayer
            url={current?.url}
            title={current?.name}
            compact
            brand="MUNDO PLAY TV"
          />

          <View style={styles.details}>
            <Text style={styles.detailTitle} numberOfLines={2}>
              {current?.name || "Nenhuma série"}
            </Text>
            <Text style={styles.detailText}>Ano: {current?.year || "-"}</Text>
            <Text style={styles.detailText}>Grupo: {current?.group || "-"}</Text>
            <Text style={styles.detailText} numberOfLines={5}>
              Descrição: {current?.description || "Sem descrição na lista"}
            </Text>
          </View>

          <TouchableOpacity style={styles.footerBtn} onPress={onOpenSettings}>
            <Text style={styles.footerBtnText}>CONFIG.</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111d" },
  header: {
    height: 42,
    backgroundColor: "#0d1b2a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    color: "#38d7ff",
    fontSize: 8,
    fontWeight: "900",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    padding: 4,
  },
  leftPanel: {
    width: 90,
    paddingRight: 4,
  },
  categoryRow: {
    minHeight: 32,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  categoryActive: {
    backgroundColor: "#6de9ea",
    borderRadius: 4,
  },
  categoryText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "800",
    flex: 1,
    marginRight: 4,
  },
  categoryTextActive: {
    color: "#0d2340",
  },
  categoryCount: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "800",
  },
  centerPanel: {
    flex: 1,
    paddingHorizontal: 4,
  },
  grid: {
    paddingBottom: 8,
  },
  card: {
    width: "31%",
    marginHorizontal: "1%",
    marginBottom: 8,
    paddingBottom: 4,
    borderRadius: 8,
  },
  cardActive: {
    backgroundColor: "rgba(56,215,255,0.08)",
  },
  poster: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    backgroundColor: "#243a57",
    marginBottom: 4,
  },
  posterFallback: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    backgroundColor: "#243a57",
    marginBottom: 4,
  },
  title: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
  },
  group: {
    color: "#9fb2c7",
    fontSize: 7,
    marginTop: 2,
  },
  rightPanel: {
    width: 132,
    paddingLeft: 4,
  },
  details: {
    marginTop: 6,
    marginBottom: 6,
  },
  detailTitle: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
    marginBottom: 4,
  },
  detailText: {
    color: "#9fb2c7",
    fontSize: 7,
    marginBottom: 3,
  },
  footerBtn: {
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnText: {
    color: "#38d7ff",
    fontSize: 7,
    fontWeight: "900",
  },
});
