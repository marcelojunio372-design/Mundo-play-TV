import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const COLORS = {
  bg: "#07111f",
  panel: "#0d1b2a",
  panel2: "#13253a",
  card: "#10233a",
  primary: "#23d5ff",
  primarySoft: "rgba(35,213,255,0.18)",
  text: "#ffffff",
  muted: "#9fb3c8",
  border: "rgba(255,255,255,0.10)",
};

export const IS_TV_LAYOUT = width >= 900;
