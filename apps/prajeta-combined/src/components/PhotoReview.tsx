import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { api, authedUrl } from "@/src/api";
import { fonts, radius, space, useTheme } from "@/src/theme";
import { Btn, Card, Field, Row, Tag, Txt, useToast } from "@/src/ui";

/** ERP: review a driver's uploaded uniform photo (approve / reject with reason). */
export function PhotoReview({ driverId, photo, onDone }: { driverId: string; photo: any; onDone: () => void }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [uri, setUri] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    if (photo?.id) authedUrl(`/driver/photo/file/${photo.id}`).then(setUri);
  }, [photo?.id]);

  const review = async (approve: boolean) => {
    if (!approve && !reason.trim()) return toast("Add a reason so the driver knows what to fix", "err");
    setBusy(approve ? "a" : "r");
    try {
      await api(`/admin/drivers/${driverId}/photo`, { body: { approve, reason } });
      toast(approve ? "Photo approved — customers will see it" : "Photo rejected — driver notified");
      setReason("");
      onDone();
    } catch (e: any) {
      toast(e.message, "err");
    } finally {
      setBusy("");
    }
  };

  return (
    <Card style={{ gap: space.md }} testID="admin-photo-card">
      <Row style={{ justifyContent: "space-between" }}>
        <Txt v="h3" style={{ fontFamily: fonts.bold }}>Profile photo</Txt>
        {photo ? <Tag testID="admin-photo-status" tone={photo.status === "APPROVED" ? "success" : photo.status === "PENDING" ? "warn" : "brand"} label={photo.status} /> : null}
      </Row>
      {!photo ? (
        <Txt v="caption">The driver hasn&apos;t uploaded a photo yet.</Txt>
      ) : (
        <>
          <Row gap={space.md} style={{ alignItems: "flex-start" }}>
            <View style={{ width: 120, height: 120, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.tint }}>
              {uri ? <Image testID="admin-photo-image" source={{ uri }} style={{ width: 120, height: 120 }} contentFit="cover" /> : null}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt v="caption">Uploaded {new Date(photo.uploaded_at).toLocaleString("en-IN")}</Txt>
              <Txt v="caption">Check: clear face, uniform, no sunglasses or caps, matches ID.</Txt>
              {photo.reason ? <Txt v="caption" color={colors.brandPrimary}>Last reason: {photo.reason}</Txt> : null}
            </View>
          </Row>
          {photo.status !== "APPROVED" ? (
            <>
              <Field label="Reason if rejecting" placeholder="e.g. Face not clear, not in uniform" value={reason} onChangeText={setReason} testID="admin-photo-reason" />
              <Row>
                <Btn small style={{ flex: 1 }} variant="success" icon="checkmark" title="Approve" loading={busy === "a"} onPress={() => review(true)} testID="admin-photo-approve" />
                <Btn small style={{ flex: 1 }} variant="outline" icon="close" title="Reject" loading={busy === "r"} onPress={() => review(false)} testID="admin-photo-reject" />
              </Row>
            </>
          ) : (
            <>
              <Field label="Reason for revoking" value={reason} onChangeText={setReason} testID="admin-photo-reason" />
              <Btn small variant="outline" icon="close" title="Revoke (reject)" onPress={() => review(false)} loading={busy === "r"} testID="admin-photo-revoke" />
            </>
          )}
        </>
      )}
    </Card>
  );
}
