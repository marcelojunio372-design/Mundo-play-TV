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
import { LIVE_CATEGORIES as MOCK_CATEGORIES, LIVE_CHANNELS as MOCK_CHANNELS } from "../data/mockData";

export default function LiveTVScreen({ session, onBack, onOpenSettings, onLogout }) {
  const now = useMemo(() => new Date(), []);
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("pt-BR");

  const realChannels =
    session?.type === "m3u"
      ? session?.data?.channels || []
      : [];

  const channels = realChannels.length > 0 ? realChannels : MOCK_CHANNELS;

  const categories =
    realChannels.length > 0
      ? [
          {
            id: "all",
            name: "TODOS OS CANAIS",
            count: channels.length,
          },
          {
            id: "fav",
            name: "FAVORITOS",
            count: 0,
          },
        ]
      : MOCK_CATEGORIES;

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState(0);

  const current = channels[selectedChannel];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerBrand}>| Ao vivo</Text>
        <Text style={styles.headerClock}>{time}   {date}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.leftPanel}>
          <Text style={styles.searchTitle}>Pesquisa em categorias</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {categories.map((item, index) => {
              const active = selectedCategory === index;
              return (
                <TouchableOpacity
                  key={item.id || String(index)}
                  style={[styles.categoryRow, active && styles.categoryRowActive]}
                  onPress={() => {
                    setSelectedCategory(index);
                    setSelectedChannel(0);
                  }}
                >
                  <Text
                    style={[styles.categoryName, active && styles.categoryNameActive]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.categoryCount, active && styles.categoryNameActive]}
                  >
                    {item.count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.centerPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {channels.map((item, index) => {
              const active = selectedChannel === index;
              return (
                <TouchableOpacity
                  key={item.id || `${item.name}-${index}`}
                  style={[styles.channelRow, active && styles.channelRowActive]}
                  onPress={() => setSelectedChannel(index)}
                >
                  <View style={styles.channelLogo}>
                    <Text style={styles.channelLogoText}>
                      {(item.name || "CH").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.channelTextWrap}>
                    <Text
                      style={[styles.channelName, active && styles.channelNameActive]}
                      numberOfLines={1}
                    >
                      {item.name || item.title || "Sem nome"}
                    </Text>

                    <Text style={styles.channelEpg} numberOfLines={1}>
                      {item.epg || item.group || "Sem programação"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.rightPanel}>
          <Text style={styles.previewHint}>Pressione "OK" para jogar</Text>

          <View style={styles.previewBox} />

          <View style={styles.epgBox}>
            <Text style={styles.epgTime}>Canal: {current?.name || current?.title || "Nenhum"}</Text>
            <Text style={styles.epgProgram}>{current?.epg || current?.group || "Sem informação"}</Text>
            <Text style={styles.epgDescription}>
              URL pronta: {current?.url ? "Sim" : "Não"}
            </Text>
          </View>

          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.smallBtn} onPress={onBack}>
              <Text style={styles.smallBtnText}>VOLTAR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.smallBtn} onPress={onOpenSettings}>
              <Text style={styles.smallBtnText}>CONFIG.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.smallBtn} onPress={onLogout}>
              <Text style={styles.smallBtnText}>SAIR</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  centerPanel: {
    flex: 1,
    paddingHorizontal: 10,
  },
  channelRow: {
    minHeight: LAYOUT.isTV ? 56 : 44,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
  },
  channelRowActive: {
    backgroundColor: "#6de9ea",
    borderRadius: 4,
  },
  channelLogo: {
    width: LAYOUT.isTV ? 42 : 30,
    height: LAYOUT.isTV ? 42 : 30,
    borderRadius: 6,
    backgroundColor: "#315b88",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  channelLogoText: {
    color: "#fff",
    fontSize: LAYOUT.isTV ? 12 : 9,
    fontWeight: "900",
  },
  channelTextWrap: {
    flex: 1,
  },
  channelName: {
    color: "#ffffff",
    fontSize: LAYOUT.isTV ? 16 : 11,
    fontWeight: "800",
  },
  channelNameActive: {
    color: "#0d2340",
  },
  channelEpg: {
    color: "#cfe9ff",
    fontSize: LAYOUT.isTV ? 13 : 9,
    marginTop: 2,
  },
  rightPanel: {
    width: LAYOUT.isTV ? 360 : 120,
    paddingLeft: 10,
  },
  previewHint: {
    color: "#dff8ff",
    textAlign: "center",
    fontSize: LAYOUT.isTV ? 14 : 9,
    marginTop: 8,
    marginBottom: 10,
  },
  previewBox: {
    height: LAYOUT.isTV ? 230 : 100,
    backgroundColor: "#1a2246",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  epgBox: {
    padding: 8,
  },
  epgTime: {
    color: "#eaf9ff",
    fontSize: LAYOUT.isTV ? 13 : 9,
    fontWeight: "700",
    marginBottom: 4,
  },
  epgProgram: {
    color: "#ffffff",
    fontSize: LAYOUT.isTV ? 16 : 10,
    fontWeight: "800",
    marginBottom: 6,
  },
  epgDescription: {
    color: "#c5dbf8",
    fontSize: LAYOUT.isTV ? 12 : 8,
    lineHeight: LAYOUT.isTV ? 18 : 11,
  },
  footerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 8,
  },
  smallBtn: {
    flex: 1,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  smallBtnText: {
    color: COLORS.primary,
    fontSize: LAYOUT.isTV ? 12 : 9,
    fontWeight: "900",
  },
});
