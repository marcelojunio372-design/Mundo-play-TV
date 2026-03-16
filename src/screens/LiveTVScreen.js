import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { LIVE_TV_CATEGORIES, LIVE_TV_CHANNELS } from "../data/mockData";

export default function LiveTVScreen({ navigation }) {
  const [clock, setClock] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(LIVE_TV_CATEGORIES[0]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const date = now.toLocaleDateString("pt-BR");
      setClock(`${time}   ${date}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadOnlyLiveTV = () => {
      const nextChannels =
        LIVE_TV_CHANNELS[selectedCategory.id] || LIVE_TV_CHANNELS.all || [];
      setChannels(nextChannels);
      setSelectedChannel(nextChannels[0] || null);
    };

    loadOnlyLiveTV();
  }, [selectedCategory]);

  const rightEPG = useMemo(() => {
    if (!selectedChannel) return [];
    return selectedChannel.epg || [];
  }, [selectedChannel]);

  function renderCategory({ item }) {
    const active = item.id === selectedCategory.id;

    return (
      <TouchableOpacity
        style={[styles.categoryItem, active && styles.categoryItemActive]}
        onPress={() => setSelectedCategory(item)}
      >
        <Text style={[styles.categoryName, active && styles.categoryNameActive]}>
          {item.name}
        </Text>
        <Text style={[styles.categoryCount, active && styles.categoryNameActive]}>
          {item.count}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderChannel({ item }) {
    const active = selectedChannel?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.channelItem, active && styles.channelItemActive]}
        onPress={() => setSelectedChannel(item)}
      >
        <View style={styles.channelLogo}>
          <Text style={styles.channelLogoText}>TV</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.channelName}>{item.name}</Text>
          <Text style={styles.channelProgram}>{item.currentProgram}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logo}>EPIC</Text>
        </TouchableOpacity>

        <Text style={styles.leftTitle}>| Ao vivo</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.clock}>{clock}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.leftColumn}>
          <View style={styles.searchHeader}>
            <Text style={styles.searchText}>🔍 Pesquisa em categorias</Text>
          </View>

          <FlatList
            data={LIVE_TV_CATEGORIES}
            keyExtractor={(item) => item.id}
            renderItem={renderCategory}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View style={styles.middleColumn}>
          <FlatList
            data={channels}
            keyExtractor={(item) => item.id}
            renderItem={renderChannel}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.previewBox}>
            <Text style={styles.previewHint}>Pressione "OK" para jogar</Text>
          </View>

          <View style={styles.epgBox}>
            {selectedChannel ? (
              <>
                <Text style={styles.epgCurrent}>
                  {selectedChannel.currentProgram}
                </Text>

                {rightEPG.map((line, index) => (
                  <Text key={index} style={styles.epgLine}>
                    {line}
                  </Text>
                ))}
              </>
            ) : (
              <Text style={styles.epgLine}>TV Guide info downloading...</Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#17103d",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    color: "#7df4ff",
    fontSize: 24,
    fontWeight: "900",
  },
  leftTitle: {
    color: "#d8f8ff",
    fontSize: 26,
    fontWeight: "800",
    marginLeft: 16,
  },
  clock: {
    color: "#e3f9ff",
    fontSize: 20,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  leftColumn: {
    width: "32%",
    marginRight: 12,
  },
  middleColumn: {
    width: "33%",
    marginRight: 12,
  },
  rightColumn: {
    flex: 1,
  },
  searchHeader: {
    backgroundColor: "#25204d",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  searchText: {
    color: "#dff8ff",
    fontSize: 16,
    fontWeight: "700",
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#221c49",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3f3768",
  },
  categoryItemActive: {
    backgroundColor: "#68f6ff",
  },
  categoryName: {
    color: "#f0f7ff",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  categoryNameActive: {
    color: "#11316e",
  },
  categoryCount: {
    color: "#f0f7ff",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 12,
  },
  channelItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#20184a",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#4c4474",
  },
  channelItemActive: {
    backgroundColor: "#90ffff",
  },
  channelLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  channelLogoText: {
    color: "#214891",
    fontWeight: "900",
  },
  channelName: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
  channelProgram: {
    color: "#dbe7ff",
    fontSize: 14,
    marginTop: 4,
  },
  previewBox: {
    flex: 1,
    minHeight: 250,
    backgroundColor: "#241d4b",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  previewHint: {
    color: "#f2fbff",
    fontSize: 18,
    fontWeight: "700",
  },
  epgBox: {
    backgroundColor: "#1e1743",
    borderRadius: 12,
    padding: 14,
    minHeight: 150,
  },
  epgCurrent: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },
  epgLine: {
    color: "#d8e6ff",
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});
