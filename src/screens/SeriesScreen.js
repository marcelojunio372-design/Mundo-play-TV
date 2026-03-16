import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import Sidebar from "../components/Sidebar";
import ContentCard from "../components/ContentCard";
import { SERIES_CATEGORIES, SERIES } from "../data/mockData";
import { COLORS } from "../utils/constants";

function Header({ onBack, onLogout }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.headerBtn}>VOLTAR</Text>
      </TouchableOpacity>

      <View>
        <Text style={styles.brand}>SÉRIES</Text>
        <Text style={styles.brandSub}>Temporadas e episódios</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>SAIR</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SeriesScreen({ onBack, onLogout }) {
  const [selectedCategory, setSelectedCategory] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={onBack} onLogout={onLogout} />

      <View style={styles.contentWrap}>
        <Sidebar
          title="Categorias"
          items={SERIES_CATEGORIES}
          selectedIndex={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <View style={styles.contentPanel}>
          <Text style={styles.contentTitle}>Todas as séries</Text>

          <ScrollView>
            <View style={styles.posterGrid}>
              {SERIES.map((item, index) => (
                <ContentCard
                  key={`${item.title}-${index}`}
                  title={item.title}
                  rating={item.rating}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.panel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },
  brand: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  brandSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  logoutBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: { color: COLORS.primary, fontWeight: "800" },

  contentWrap: {
    flex: 1,
    flexDirection: "row",
    padding: 14,
    gap: 14,
  },

  contentPanel: {
    flex: 1,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 14,
  },

  contentTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },

  posterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
