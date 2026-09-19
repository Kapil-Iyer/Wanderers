/**
 * react-native-maps requires a custom native build (not supported inside
 * Expo Go, which is how this app is being tested) - so the map is rendered
 * as a WebView running Leaflet + OpenStreetMap dark tiles instead. This
 * needs no Google Maps API key and works in plain Expo Go. Marker taps post
 * a message back to RN (window.ReactNativeWebView.postMessage) to scroll the
 * bottom activity-card strip to that bubble - mirrors the web MapOverlay's
 * "glass pills on map + horizontal activity cards" pattern, and the campus
 * boundary uses the exact same coordinates/styling as src/lib/campusBounds.ts.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { colors } from "@/lib/theme";
import { BubbleCard } from "@/components/BubbleCard";
import { LoadingState } from "@/components/LoadingState";
import { useGuest } from "@/contexts/GuestContext";
import { listBubbles } from "@/api/bubbles";
import { mockBubbles } from "@/lib/mockData";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { inferCategory } from "@/lib/bubbleHelpers";

const UW_CENTER = { latitude: 43.4723, longitude: -80.5449 };

// Same perimeter + style as src/lib/campusBounds.ts (UW_CAMPUS_BOUNDARY / getCampusPolygonStyle).
const UW_CAMPUS_BOUNDARY: [number, number][] = [
  [43.4792, -80.5566],
  [43.4792, -80.5432],
  [43.4778, -80.5332],
  [43.473, -80.531],
  [43.4685, -80.5322],
  [43.4658, -80.536],
  [43.465, -80.543],
  [43.4652, -80.551],
  [43.467, -80.5566],
  [43.474, -80.558],
  [43.4792, -80.5566],
];

type MapPin = {
  id: string;
  emoji: string;
  title: string;
  zone?: string | null;
  category: string;
  lat: number;
  lng: number;
  joined?: number;
  maxPeople?: number;
};

function buildMapHtml(center: { latitude: number; longitude: number }, pins: MapPin[]) {
  // "Bubble pill" markers - matches the web app's glass pill map markers
  // (emoji + activity name, category-accent border/glow) rather than a
  // plain dot, since these represent live joinable bubbles, not places.
  const markers = pins.map((p) => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    color: getCategoryTheme(p.category).accent,
    emoji: p.emoji,
    label: p.title.length > 18 ? `${p.title.slice(0, 17)}…` : p.title,
    count: p.joined !== undefined && p.maxPeople !== undefined ? `${p.joined}/${p.maxPeople}` : null,
  }));

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; background: ${colors.bg}; }
    .leaflet-control-attribution { display: none; }
    /* OSM's standard tiles are the only truly free, no-API-key tile source -
       this CSS-invert trick fakes a dark theme on top of them (CartoDB's
       "free" dark tiles turned out to require a key after all). */
    .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.9) saturate(0.8); }
    .bubble-pill {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(10,9,8,0.88);
      border-radius: 999px;
      padding: 5px 10px 5px 5px;
      white-space: nowrap;
      font-family: -apple-system, Roboto, sans-serif;
    }
    .bubble-pill.selected { outline: 2px solid #FAFAFA; }
    .bubble-pill .emoji { font-size: 15px; line-height: 1; }
    .bubble-pill .label { color: #FAFAFA; font-size: 11px; font-weight: 700; }
    .bubble-pill .count { color: #A5A5B8; font-size: 10px; font-weight: 600; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${center.latitude}, ${center.longitude}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    L.polygon(${JSON.stringify(UW_CAMPUS_BOUNDARY)}, {
      color: '#E0339E', weight: 1.5, opacity: 0.6, fillColor: '#E0339E', fillOpacity: 0.05, interactive: false,
    }).addTo(map);

    const markers = ${JSON.stringify(markers)};
    markers.forEach(function (m) {
      const html =
        '<div class="bubble-pill" style="border:1.5px solid ' + m.color + '; box-shadow:0 2px 10px rgba(0,0,0,0.55), 0 0 10px ' + m.color + '55;">' +
          '<span class="emoji">' + m.emoji + '</span>' +
          '<span class="label">' + m.label + '</span>' +
          (m.count ? '<span class="count">' + m.count + '</span>' : '') +
        '</div>';
      const icon = L.divIcon({ className: '', html: html, iconSize: [180, 32], iconAnchor: [16, 16] });
      const marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
      marker.on('click', function () {
        map.panTo([m.lat, m.lng]);
        window.ReactNativeWebView.postMessage(JSON.stringify({ id: m.id }));
      });
    });
  </script>
</body>
</html>`;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { isGuest } = useGuest();
  const [center, setCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const stripRef = useRef<FlatList<MapPin>>(null);

  const query = useQuery({
    queryKey: ["bubbles-list"],
    queryFn: listBubbles,
    enabled: !isGuest,
  });

  useEffect(() => {
    // Guest demo bubbles (mockBubbles) are hardcoded near UW campus - if we
    // centered on the device's real GPS position instead, a guest testing
    // from anywhere else would see an empty map with no pins in view.
    if (isGuest) {
      setCenter(UW_CENTER);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({});
          if (!cancelled) {
            setCenter({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            return;
          }
        }
      } catch {
        /* fall through to campus default */
      }
      if (!cancelled) setCenter(UW_CENTER);
    })();
    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  const pins: MapPin[] = useMemo(() => {
    if (isGuest) {
      return mockBubbles
        .filter((b) => b.lat != null && b.lng != null)
        .map((b) => ({
          id: b.id,
          emoji: b.emoji,
          title: b.title,
          zone: b.zone,
          category: b.category,
          lat: b.lat!,
          lng: b.lng!,
          joined: b.joined,
          maxPeople: b.maxPeople,
        }));
    }
    return (query.data?.data ?? [])
      .filter((b) => b.lat != null && b.lng != null)
      .map((b) => ({
        id: b.id,
        emoji: b.emoji ?? "🫧",
        title: b.activity ?? "Activity",
        zone: b.zone,
        category: inferCategory(b.activity),
        lat: b.lat as number,
        lng: b.lng as number,
        joined: b.members_count,
        maxPeople: b.max_members ?? undefined,
      }));
  }, [isGuest, query.data]);

  const ready = center !== null && (isGuest || !query.isLoading);
  const html = useMemo(() => (center ? buildMapHtml(center, pins) : ""), [center, pins]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      {!ready ? (
        <LoadingState />
      ) : (
        <WebView
          key={pins.length}
          source={{ html }}
          cacheEnabled={false}
          originWhitelist={["*"]}
          onError={(e) => console.warn("Map WebView error:", e.nativeEvent)}
          onHttpError={(e) => console.warn("Map WebView HTTP error:", e.nativeEvent)}
          style={{ flex: 1, backgroundColor: colors.bg }}
          onMessage={(e) => {
            try {
              const { id } = JSON.parse(e.nativeEvent.data);
              const index = pins.findIndex((p) => p.id === id);
              if (index >= 0) stripRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
            } catch {
              /* ignore malformed messages */
            }
          }}
        />
      )}

      <Pressable
        onPress={() => router.back()}
        style={{ top: insets.top + 12, backgroundColor: colors.cardGlassBg }}
        className="absolute left-5 h-10 w-10 items-center justify-center rounded-full"
      >
        <Ionicons name="close" size={22} color={colors.textPrimary} />
      </Pressable>

      {pins.length > 0 ? (
        <FlatList
          ref={stripRef}
          data={pins}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p) => p.id}
          style={{ position: "absolute", left: 0, right: 0, bottom: insets.bottom + 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          getItemLayout={(_, index) => ({ length: 208, offset: 208 * index, index })}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item }) => (
            <View style={{ width: 200 }}>
              <BubbleCard
                compact
                emoji={item.emoji}
                title={item.title}
                zone={item.zone}
                joined={item.joined}
                maxPeople={item.maxPeople}
                category={item.category}
                onPress={() => router.push(`/chat/${item.id}`)}
              />
            </View>
          )}
        />
      ) : (
        <View style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 16, alignItems: "center" }}>
          <View
            style={{ backgroundColor: colors.cardGlassBg, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <Text className="text-center text-sm" style={{ color: colors.textSecondary }}>
              No bubbles nearby right now.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
