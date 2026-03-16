import VideoPlayer from "../components/VideoPlayer";
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Sidebar from "../components/Sidebar";
import { LIVE_CATEGORIES, LIVE_CHANNELS } from "../data/mockData";
import { COLORS, IS_TV_LAYOUT } from "../utils/constants";

function Header({ onBack, onLogout }) {
  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("pt-BR");

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.headerBtn}>VOLTAR</Text>
      </TouchableOpacity>

      <View>
        <Text style={styles.brand}>LIVE TV</Text>
        <Text style={styles.brandSub}>Canais ao vivo por categoria</Text>
      </View>

      <View style={styles.headerRight}>
        <Text style={styles.headerInfo}>{time}   {date}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>SAIR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LiveTVScreen({ onBack, onLogout }) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState(0);

  const channels = LIVE_CHANNELS;

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={onBack} onLogout={onLogout} />

      <View style={styles.tvWrap}>
        <Sidebar
          title="Categorias"
          items={LIVE_CATEGORIES}
          selectedIndex={selectedCategory}
          onSelect={(index) => {
            setSelectedCategory(index);
            setSelectedChannel(0);
          }}
        />

        <View style={styles.liveCenter}>
          <Text style={styles.contentTitle}>Lista de canais</Text>

          <ScrollView>
            {channels.map((channel, index) => (
              <TouchableOpacity
                key={`${channel.name}-${index}`}
                style={[
                  styles.channelRow,
                  selectedChannel === index && styles.channelRowActive,
                ]}
                onPress={() => setSelectedChannel(index)}
              >
                <View style={styles.channelLogo} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.channelName}>{channel.name}</Text>
                  <Text style={styles.channelEpg}>{channel.epg}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.epgPanel}>
          <Text style={styles.contentTitle}>Preview / EPG</Text>

          <View style={styles.playerBox}>
            <Text style={styles.playerHint}>Pressione OK para reproduzir</Text>
          </View>

          <Text style={styles.epgText}>Canal: {channels[selectedChannel]?.name}</Text>
          <Text style={styles.epgText}>Programa: {channels[selectedChannel]?.epg}</Text>
          <Text style={styles.epgText}>11:15 - 11:37 • Polícia em Ação</Text>
          <Text style={styles.epgText}>11:37 - 11:58 • Polícia em Ação</Text>
          <Text style={styles.epgText}>11:58 - 12:20 • Polícia em Ação</Text>
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
  headerRight: { alignItems: "flex-end", gap: 8 },
  headerInfo: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  logoutBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: { color: COLORS.primary, fontWeight: "800" },

  tvWrap: {
    flex: 1,
    flexDirection: IS_TV_LAYOUT ? "row" : "column",
    padding: 14,
    gap: 14,
  },

  liveCenter: {
    flex: 1,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 14,
  },

  epgPanel: {
    width: IS_TV_LAYOUT ? 320 : "100%",
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

  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 8,
  },

  channelRowActive: {
    backgroundColor: COLORS.primarySoft,
  },

  channelLogo: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    marginRight: 12,
  },

  channelName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  channelEpg: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
  },

  playerBox: {
    height: 220,
    backgroundColor: "#09111b",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  playerHint: {
    color: COLORS.muted,
    fontSize: 14,
  },

  epgText: {
    color: COLORS.text,
    fontSize: 13,
    marginBottom: 8,
  },
});
