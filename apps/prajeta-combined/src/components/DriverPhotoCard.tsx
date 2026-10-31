import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";

import { BACKEND_URL, api, authedUrl, getToken } from "@/src/api";
import { fonts, radius, space, useTheme } from "@/src/theme";
import { Btn, Card, Row, Sheet, Tag, Txt, useToast } from "@/src/ui";
import { uploadForm } from "@/src/utils/upload";

type Src = "camera" | "library";
const TONE: Record<string, "success" | "warn" | "brand"> = { APPROVED: "success", PENDING: "warn", REJECTED: "brand" };
const LABEL: Record<string, string> = { APPROVED: "Approved · visible to customers", PENDING: "Under review", REJECTED: "Not approved" };

/** Driver's own approved photo (falls back to the previous approved one, then a person icon). */
export function DriverAvatar({ profile, size = 40, testID = "driver-avatar" }: { profile: any; size?: number; testID?: string }) {
  const { colors } = useTheme();
  const ph = profile?.photo?.status === "APPROVED" ? profile.photo : profile?.approved_photo;
  const [uri, setUri] = useState("");
  useEffect(() => {
    if (ph?.id) authedUrl(`/driver/photo/file/${ph.id}`).then(setUri);
    else setUri("");
  }, [ph?.id]);
  return (
    <View testID={testID} style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: colors.tint, borderWidth: ph ? 2 : 1, borderColor: ph ? colors.success : colors.borderStrong, alignItems: "center", justifyContent: "center" }}>
      {ph && uri ? (
        <Image testID={`${testID}-image`} source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={150} />
      ) : (
        <Ionicons name="person" size={Math.round(size / 2)} color={colors.onSurface} />
      )}
    </View>
  );
}

/** Driver uploads a uniform photo (selfie or gallery); staff approve before customers see it. */
export function DriverPhotoCard({ compact }: { compact?: boolean }) {
  const { colors } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["driver-profile"], queryFn: () => api<any>("/driver/profile") });
  const photo = q.data?.photo;
  const [uri, setUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState<Src | null>(null);
  const [blocked, setBlocked] = useState<Src | null>(null);

  useEffect(() => {
    if (photo?.id) authedUrl(`/driver/photo/file/${photo.id}`).then(setUri);
  }, [photo?.id]);

  if (compact && photo?.status === "APPROVED") return null;

  const pick = async (src: Src) => {
    const res =
      src === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], cameraType: ImagePicker.CameraType.front, allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setBusy(true);
    try {
      const token = await getToken();
      const r = await uploadForm(`${BACKEND_URL}/api/driver/photo`, {
        headers: { Authorization: `Bearer ${token}` },
        files: { file: { uri: a.uri, name: a.fileName ?? "photo.jpg", mimeType: a.mimeType ?? "image/jpeg" } },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail ?? "Upload failed");
      toast("Photo uploaded — our team will review it");
      qc.invalidateQueries({ queryKey: ["driver-profile"] });
    } catch (e: any) {
      toast(e.message, "err");
    } finally {
      setBusy(false);
    }
  };

  // Check first; explain before the OS prompt; respect canAskAgain; offer Settings when blocked.
  const start = async (src: Src) => {
    if (Platform.OS === "web") return pick(src);
    const cur = src === "camera" ? await ImagePicker.getCameraPermissionsAsync() : await ImagePicker.getMediaLibraryPermissionsAsync();
    if (cur.granted) return pick(src);
    if (!cur.canAskAgain) return setBlocked(src);
    setAsk(src);
  };
  const allow = async () => {
    const src = ask!;
    setAsk(null);
    const r = src === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (r.granted) return pick(src);
    if (!r.canAskAgain) setBlocked(src);
    else toast(src === "camera" ? "Camera access is needed to take a selfie" : "Photo access is needed to choose a picture", "err");
  };

  return (
    <Card style={{ gap: space.md }} testID="driver-photo-card">
      <Row gap={space.md} style={{ alignItems: "flex-start" }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, overflow: "hidden", backgroundColor: colors.tint, borderWidth: 2, borderColor: photo?.status === "APPROVED" ? colors.success : colors.borderStrong, alignItems: "center", justifyContent: "center" }}>
          {photo && uri ? <Image testID="driver-photo-image" source={{ uri }} style={{ width: 72, height: 72 }} contentFit="cover" /> : <Ionicons name="person" size={32} color={colors.muted} />}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="h3" style={{ fontFamily: fonts.bold }}>Profile photo in uniform</Txt>
          {photo ? <Tag testID="driver-photo-status" tone={TONE[photo.status]} label={LABEL[photo.status]} /> : <Txt v="caption">Customers see your face on their booking once our team approves it.</Txt>}
          {photo?.status === "REJECTED" && photo.reason ? (
            <Txt v="caption" color={colors.brandPrimary} testID="driver-photo-reason">Reason: {photo.reason}</Txt>
          ) : null}
          {photo && photo.status !== "APPROVED" && q.data?.approved_photo ? <Txt v="caption">Customers still see your previous approved photo.</Txt> : null}
        </View>
      </Row>
      <View style={{ backgroundColor: colors.tint, borderRadius: radius.md, padding: space.md }}>
        <Txt v="caption" style={{ color: colors.onSurface }}>Face the camera in good light, wear your uniform, no sunglasses or caps.</Txt>
      </View>
      <Row>
        <Btn style={{ flex: 1 }} variant="dark" icon="camera-outline" title="Take selfie" loading={busy} onPress={() => start("camera")} testID="driver-photo-camera" />
        <Btn style={{ flex: 1 }} variant="outline" icon="images-outline" title="From gallery" disabled={busy} onPress={() => start("library")} testID="driver-photo-library" />
      </Row>

      <Sheet visible={!!ask} onClose={() => setAsk(null)} title={ask === "camera" ? "Allow camera" : "Allow photos"} testID="driver-photo-permission-sheet">
        <View style={{ gap: space.md }}>
          <Txt v="body">{ask === "camera" ? "Prajeta uses your camera only to take your profile selfie." : "Prajeta opens your photos only so you can choose your profile picture."}</Txt>
          <Btn title="Continue" onPress={allow} testID="driver-photo-permission-continue" />
          <Btn title="Not now" variant="ghost" onPress={() => setAsk(null)} />
        </View>
      </Sheet>
      <Sheet visible={!!blocked} onClose={() => setBlocked(null)} title="Access turned off" testID="driver-photo-blocked-sheet">
        <View style={{ gap: space.md }}>
          <Txt v="body">{blocked === "camera" ? "Camera" : "Photo"} access is turned off for Prajeta. Turn it on in Settings to add your photo.</Txt>
          <Btn title="Open Settings" icon="settings-outline" onPress={() => { setBlocked(null); Linking.openSettings(); }} testID="driver-photo-open-settings" />
          {blocked === "camera" ? <Btn title="Choose from gallery instead" variant="outline" onPress={() => { setBlocked(null); start("library"); }} /> : null}
        </View>
      </Sheet>
    </Card>
  );
}
