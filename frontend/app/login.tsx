import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { APP_ROLE, APP_ROLES, homeFor, useAuth, User } from "@/src/auth";
import { exchangeSession, startGoogleLogin } from "@/src/googleAuth";
import { space, radius, useTheme } from "@/src/theme";
import { BrandLogo, Btn, Card, Field, Header, Row, Txt, useToast } from "@/src/ui";

export default function Login() {
  const params = useLocalSearchParams<{ next?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { signIn, signOut, user, authError, clearAuthError } = useAuth();
  const [gBusy, setGBusy] = useState(false);
  const [wrongApp, setWrongApp] = useState("");
  useEffect(() => {
    if (!user) return;
    if (!APP_ROLES.includes(user.role)) {
      // This app serves customers only; send other accounts to the right app
      setWrongApp(user.role === "driver" ? "This is a driver account. Please use the Prajeta Driver app." : "Staff accounts use the Prajeta ERP.");
      signOut();
      return;
    }
    if (params.next) router.replace(params.next as any);
    else router.replace(homeFor(user.role) as any);
  }, [user, params.next, signOut]);
  const google = async () => {
    setErr("");
    clearAuthError();
    setGBusy(true);
    try {
      const sid = await startGoogleLogin(role as "customer" | "driver");
      if (!sid) return; // web: page redirects; native: user cancelled
      const r = await exchangeSession(sid);
      if (r) {
        await signIn(r.token, r.user);
        toast(`Welcome${r.user.name ? ", " + r.user.name.split(" ")[0] : ""}!`);
      }
    } catch (e: any) {
      setErr(e.message ?? "Google sign-in failed");
    } finally {
      setGBusy(false);
    }
  };
  const role = APP_ROLE;
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [channel, setChannel] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const send = async () => {
    setErr("");
    if (phone.replace(/\D/g, "").length !== 10) return setErr("Enter your 10-digit mobile number");
    setBusy(true);
    try {
      const r = await api<any>("/auth/otp/send", { body: { phone } });
      setChannel(r.channel);
      setDevCode(r.dev_code ?? "");
      setStep("code");
      toast(r.channel === "whatsapp" ? "Code sent on WhatsApp" : "Verification code ready");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setErr("");
    if (code.length < 4) return setErr("Enter the code");
    setBusy(true);
    try {
      const r = await api<{ token: string; user: User }>("/auth/otp/verify", { body: { phone, code, role, name } });
      await signIn(r.token, r.user);
      toast(`Welcome${r.user.name ? ", " + r.user.name.split(" ")[0] : ""}!`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Log in or sign up" subtitle="Prajeta · secure WhatsApp OTP" back={false} />
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: insets.bottom + space.xl }}>
        <BrandLogo size={40} sub="Driver services" testID="login-brand" />
        <Txt v="title">{step === "phone" ? "Enter your mobile number" : "Enter verification code"}</Txt>
        {wrongApp ? (
          <Card tone="grey" testID="login-wrong-app">
            <Txt v="bodyBold" color={colors.brandPrimary}>{wrongApp}</Txt>
          </Card>
        ) : null}
        {step === "phone" ? (
          <>
            <Field label="Full name (new users)" placeholder="e.g. Ananya Shah" value={name} onChangeText={setName} testID="login-name-input" />
            <View style={{ gap: space.xs }}>
              <Txt v="label">Mobile number</Txt>
              <Row>
                <View style={{ height: 50, paddingHorizontal: space.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, justifyContent: "center" }}>
                  <Txt v="bodyBold">+91</Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Field placeholder="98765 43210" keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={(t) => setPhone(t.replace(/\D/g, ""))} testID="login-phone-input" />
                </View>
              </Row>
            </View>
            {err || authError ? <Txt v="bodyBold" color={colors.error} testID="login-error">{err || authError}</Txt> : null}
            <Btn title="Send code on WhatsApp" icon="logo-whatsapp" loading={busy} onPress={send} testID="login-send-otp-button" />
            <Row style={{ gap: space.sm }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Txt v="caption">or</Txt>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </Row>
            <Btn
              title="Continue with Google"
              icon="logo-google"
              variant="outline"
              loading={gBusy}
              onPress={google}
              testID="login-google-button"
            />
            <Txt v="caption">Add your mobile number later in Profile — it&apos;s needed before booking.</Txt>
            <Txt v="caption">By continuing you agree to our Terms and Privacy Policy and consent to receive a verification message on WhatsApp.</Txt>
          </>
        ) : (
          <>
            <Txt v="body" color={colors.muted}>
              {channel === "whatsapp" ? `We sent a 6-digit code to +91 ${phone} on WhatsApp.` : `Code for +91 ${phone}.`}
            </Txt>
            {channel === "preview" ? (
              <Card tone="grey" testID="login-preview-code">
                <Txt v="caption">Preview mode — WhatsApp sending not connected yet. Your code is:</Txt>
                <Txt v="numLg" color={colors.brandPrimary}>{devCode}</Txt>
              </Card>
            ) : null}
            {channel === "demo" ? (
              <Card tone="grey">
                <Txt v="caption">Demo account — use the demo code shared with your team.</Txt>
              </Card>
            ) : null}
            <Field placeholder="••••••" keyboardType="number-pad" maxLength={6} value={code} onChangeText={(t) => setCode(t.replace(/\D/g, ""))} testID="login-otp-input" style={{ fontSize: 24, letterSpacing: 8, textAlign: "center" }} />
            {err ? <Txt v="bodyBold" color={colors.error} testID="login-error">{err}</Txt> : null}
            <Btn title="Verify & continue" loading={busy} onPress={verify} testID="login-verify-otp-button" />
            <Row style={{ justifyContent: "space-between" }}>
              <Btn small variant="ghost" title="Change number" onPress={() => setStep("phone")} testID="login-change-number-button" />
              <Btn small variant="ghost" title="Resend code" onPress={send} testID="login-resend-button" />
            </Row>
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
