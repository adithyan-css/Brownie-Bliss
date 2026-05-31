import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import { fetchProducts, Product } from "@/lib/api";

const CATS = ["All", "Cakes", "Brownies", "Desserts", "Cookies", "Birthday"];

function ProductRow({ product }: { product: Product }) {
  const colors = useColors();
  const { addItem, items } = useCart();
  const inCart = items.find((i) => i._id === product._id);

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: product.img }} style={styles.rowImage} resizeMode="cover" />
      <View style={styles.rowBody}>
        <Text style={[styles.rowName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.rowCat, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {product.category || product.type}
        </Text>
        <View style={styles.rowFooter}>
          <Text style={[styles.rowPrice, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            ₹{product.price}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              addItem(product);
            }}
            style={[
              styles.addBtn,
              { backgroundColor: inCart ? colors.accent : colors.primary },
            ]}
          >
            <Feather name={inCart ? "check" : "plus"} size={16} color="#FFF9F2" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { count } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const filtered = products.filter((p) => {
    const matchCat =
      activeCategory === "All"
        ? true
        : activeCategory === "Birthday"
        ? p.type === "birthday"
        : p.category?.toLowerCase() === activeCategory.toLowerCase();
    const matchSearch = search
      ? p.name.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchCat && matchSearch;
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <Text style={[styles.headerTitle, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
          Our Menu
        </Text>
        <Pressable onPress={() => router.push("/cart")} style={styles.cartBtn}>
          <Feather name="shopping-bag" size={24} color="#F4E4BC" />
          {count > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.badgeText, { fontFamily: "Inter_700Bold" }]}>{count}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.primary }]}>
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,249,242,0.15)" }]}>
          <Feather name="search" size={16} color="#F4E4BC" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search treats..."
            placeholderTextColor="rgba(244,228,188,0.6)"
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: "#FFF9F2", fontFamily: "Inter_400Regular" }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#F4E4BC" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: colors.secondary }}
        contentContainerStyle={styles.chips}
      >
        {CATS.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[
              styles.chip,
              {
                backgroundColor: activeCategory === cat ? colors.primary : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: activeCategory === cat ? "#FFF9F2" : colors.foreground,
                  fontFamily: activeCategory === cat ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ProductRow product={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 100 : 120 },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                No treats found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 22 },
  cartBtn: { padding: 4, position: "relative" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, color: "#4A2C0A" },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  chips: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: { fontSize: 14 },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 12,
  },
  rowImage: { width: 100, height: 100 },
  rowBody: { flex: 1, padding: 12, justifyContent: "space-between" },
  rowName: { fontSize: 15, lineHeight: 20 },
  rowCat: { fontSize: 12, textTransform: "capitalize", marginTop: 2 },
  rowFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  rowPrice: { fontSize: 16 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
