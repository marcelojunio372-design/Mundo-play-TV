import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

const isTVLike = width >= 900 || height >= 600;

export const COLORS = {
  bg: "#06111d",
  panel: "#0d1b2a",
  panel2: "#122338",
  primary: "#38d7ff",
  primarySoft: "rgba(56,215,255,0.18)",
  text: "#ffffff",
  muted: "#9fb2c7",
  border: "rgba(255,255,255,0.08)",
};

export const LAYOUT = {
  isTV: isTVLike,
  isMobile: !isTVLike,
  sidebarWidth: isTVLike ? 250 : 96,
  rightPanelWidth: isTVLike ? 320 : 0,
  headerHeight: isTVLike ? 76 : 64,
  posterWidth: isTVLike ? 150 : 110,
  posterHeight: isTVLike ? 210 : 160,
  gap: isTVLike ? 14 : 10,
  topTitle: isTVLike ? 28 : 18,
  menuText: isTVLike ? 18 : 12,
};

export const APP_CONFIG = {
  appName: "MUNDO PLAY TV",
  tagline: "IPTV Profissional",
};
