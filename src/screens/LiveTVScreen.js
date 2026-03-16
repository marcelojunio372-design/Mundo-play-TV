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
import VideoPlayer from "../components/VideoPlayer";
import { LIVE_CATEGORIES, LIVE_CHANNELS } from "../data/mockData";
import { COLORS } from "../utils/constants";

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

  const channels = LIVE_CHANNELS || [];
  const current = channels[selectedChannel];

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

          <ScrollView showsVerticalScrollIndicator={false}>
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
                  <Text style={styles.channelEpg}>{channel.epg || "Sem programação"}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.epgPanel}>
          <Text style={styles.contentTitle}>Preview / EPG</Text>

          <View style={styles.playerBox}>
            {current?.url ? (
              <VideoPlayer url={current.url} />
            ) : (
              <View style={styles.emptyPlayer}>
                <Text style={styles.playerHint}>Canal sem URL de teste</Text>
              </View>
            )}
          </View>

          <Text style={styles.epgText}>Canal: {current?.name || "Nenhum"}</Text>
          <Text style={styles.epgText}>Programa: {current?.epg || "Sem programação"}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.panel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },
  brand: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  brandSub: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  headerInfo: { color: COLORS.text, fontSize: 11, fontWeight: "700", marginBottom: 4 },
  logoutBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutText: { color: COLORS.primary, fontWeight: "800", fontSize: 11 },

  tvWrap: {
    flex: 1,
    flexDirection: "row",
    padding: 10,
    gap: 10,
  },

  liveCenter: {
    flex: 1,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 10,
  },

  epgPanel: {
    width: 250,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 10,
  },

  contentTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 10,
  },

  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 8,
  },

  channelRowActive: {
    backgroundColor: COLORS.primarySoft,
  },

  channelLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primarySoft,
    marginRight: 10,
  },

  channelName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  channelEpg: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  playerBox: {
    height: 220,
    marginBottom: 12,
  },

  emptyPlayer: {
    flex: 1,
    backgroundColor: "#09111b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  playerHint: {
    color: COLORS.muted,
    fontSize: 12,
  },

  epgText: {
    color: COLORS.text,
    fontSize: 11,
    marginBottom: 6,
  },
});
