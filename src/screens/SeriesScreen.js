import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

export default function SeriesScreen({ session, onBack, onOpenSettings, onLogout }) {
  const realSeries = session?.type === "m3u" ? session?.data?.series || [] : [];
  const series = realSeries.slice(0, 200);

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

      <View style={styles.topBlocks}>
        <Text style={styles.blockTitle}>VISTO POR ÚLTIMO</Text>
        <Text style={styles.blockTitle}>FAVORITOS</Text>
        <Text style={styles.blockTitle}>TODAS AS SÉRIES ({series.length})</Text>
      </View>

      <FlatList
        data={series}
        keyExtractor={(item, index) => item.id || String(index)}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.poster}>
              <Text style={styles.star}>☆</Text>
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {item.name || item.title || "Sem nome"}
            </Text>

            <Text style={styles.group} numberOfLines={1}>
              {item.group || "Série"}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma série encontrada na lista.</Text>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={onOpenSettings}>
          <Text style={styles.footerBtnText}>CONFIG.</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111d" },

  header: {
    height: 52,
    backgroundColor: "#0d1b2a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBtn: {
    color: "#38d7ff",
    fontSize: 11,
    fontWeight: "900",
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  topBlocks: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },

  blockTitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8,
  },

  grid: {
    paddingHorizontal: 6,
    paddingBottom: 12,
  },

  card: {
    width: "31%",
    marginHorizontal: "1%",
    marginBottom: 12,
  },

  poster: {
    height: 120,
    borderRadius: 10,
    backgroundColor: "#243a57",
    marginBottom: 6,
    overflow: "hidden",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: 6,
  },

  star: {
    color: "#ffd54a",
    fontSize: 16,
    fontWeight: "900",
  },

  title: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  group: {
    color: "#9fb2c7",
    fontSize: 8,
    marginTop: 2,
  },

  empty: {
    color: "#ffffff",
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
  },

  footer: {
    padding: 10,
  },

  footerBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
  },

  footerBtnText: {
    color: "#38d7ff",
    fontSize: 10,
    fontWeight: "900",
  },
});
