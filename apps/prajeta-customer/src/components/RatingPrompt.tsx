import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { BACKEND_URL, api } from "@/src/api";
import { APP_ROLES, useAuth } from "@/src/auth";
import { queryClient } from "@/src/query-client";
import { fonts, space, useTheme } from "@/src/theme";
import { Btn, Chip, Field, Row, Sheet, Txt, useToast } from "@/src/ui";

export const REVIEW_TAGS = ["Punctual", "Safe driving", "Polite", "Well dressed", "Knows routes", "Careful with car"];

// The card shows at most once per app session (rated or "Later"); it returns on the next app open if trips are still unrated.
let doneThisSession = false;

type Pending = { id: string; ref: string; service_name?: string; driver: { name: string; photo_url?: string | null } };

/** Opens the rating card by itself when a trip ends (and on the next app open while still unrated). */
export function RatingPrompt() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const enabled = !!user && APP_ROLES.includes(user.role);
  const q = useQuery({
    queryKey: ["pending-review"],
    queryFn: () => api<{ booking: Pending | null }>("/bookings/pending-review"),
    enabled: enabled && !doneThisSession,
    retry: false,
    // Stop polling if the backend doesn't offer this (e.g. older deploy returns 404)
    refetchInterval: (query) => (query.state.error ? false : 20000),
  });
  const [, rerender] = useState(0);
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const b = enabled ? q.data?.booking : null;
  const visible = !!b && !doneThisSession;

  const reset = () => {
    setRating(5);
    setTags([]);
    setText("");
  };
  const later = () => {
    doneThisSession = true;
    reset();
    rerender((n) => n + 1);
  };
  const submit = async () => {
    if (!b) return;
    setBusy(true);
    try {
      await api(`/bookings/${b.id}/review`, { body: { rating, comment: text, tags } });
      toast("Thanks for your feedback!");
      doneThisSession = true;
      reset();
      queryClient.invalidateQueries({ queryKey: ["booking", b.id] });
      queryClient.invalidateQueries({ queryKey: ["pending-review"] });
    } catch (e: any) {
      toast(e.message, "err");
    } finally {
      setBusy(false);
    }
  };

  if (!b) return null;
  const first = b.driver.name.split(" ")[0];
  return (
    <Sheet visible={visible} onClose={later} title="How was your trip?" testID="rating-prompt-sheet">
      <View style={{ gap: space.md }}>
        <Row gap={space.md}>
          <View style={{ width: 56, height: 56, borderRadius: 28, overflow: "hidden", backgroundColor: colors.tint, alignItems: "center", justifyContent: "center" }}>
            {b.driver.photo_url ? (
              <Image source={{ uri: `${BACKEND_URL}${b.driver.photo_url}` }} style={{ width: 56, height: 56 }} contentFit="cover" testID="rating-prompt-photo" />
            ) : (
              <Ionicons name="person" size={26} color={colors.onSurface} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="h3" style={{ fontFamily: fonts.bold }} testID="rating-prompt-driver">Rate {first}</Txt>
            <Txt v="caption">
              {b.service_name ?? "Trip"} · #{b.ref}
            </Txt>
          </View>
        </Row>
        <Row style={{ justifyContent: "center" }} gap={space.md}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} testID={`rating-prompt-star-${n}`}>
              <Ionicons name={n <= rating ? "star" : "star-outline"} size={38} color={colors.warning} />
            </Pressable>
          ))}
        </Row>
        <Row style={{ flexWrap: "wrap", justifyContent: "center" }}>
          {REVIEW_TAGS.map((t) => (
            <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} testID={`rating-prompt-tag-${t.replace(/ /g, "-")}`} />
          ))}
        </Row>
        <Field placeholder={`A short note about ${first} (optional)`} multiline value={text} onChangeText={setText} testID="rating-prompt-comment" />
        <Btn title="Submit rating" icon="star" loading={busy} onPress={submit} testID="rating-prompt-submit" />
        <Btn title="Later" variant="ghost" onPress={later} testID="rating-prompt-later" />
      </View>
    </Sheet>
  );
}
