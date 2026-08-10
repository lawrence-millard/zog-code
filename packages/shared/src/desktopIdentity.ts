// FILE: desktopIdentity.ts
// Purpose: Defines the canonical desktop application identity across packaging and runtime.

export const ZOG_DESKTOP_SCHEME = "zog";
export const ZOG_DESKTOP_ORIGIN = `${ZOG_DESKTOP_SCHEME}://app`;
export const ZOG_DESKTOP_ENTRY_URL = `${ZOG_DESKTOP_ORIGIN}/index.html`;
export const ZOG_DESKTOP_UPDATE_CHANNEL = "zog";
export const ZOG_PRODUCTION_BUNDLE_ID = "com.lawrence-millard.zog";
export const ZOG_DEVELOPMENT_BUNDLE_ID = `${ZOG_PRODUCTION_BUNDLE_ID}.dev`;
export const ZOG_CANARY_BUNDLE_ID = `${ZOG_PRODUCTION_BUNDLE_ID}.canary`;
export const ZOG_CANARY_DESKTOP_SCHEME = "zog-canary";
export const ZOG_CANARY_DESKTOP_ORIGIN = `${ZOG_CANARY_DESKTOP_SCHEME}://app`;
export const ZOG_CANARY_DESKTOP_ENTRY_URL = `${ZOG_CANARY_DESKTOP_ORIGIN}/index.html`;

export type ZogDesktopFlavor = "production" | "development" | "canary";

export interface ZogDesktopIdentity {
  readonly flavor: ZogDesktopFlavor;
  readonly displayName: string;
  readonly bundleId: string;
  readonly scheme: string;
  readonly origin: string;
  readonly entryUrl: string;
  readonly userDataDirectoryName: string;
  readonly defaultHomeDirectoryName: string;
  readonly usesScriptedUpdates: boolean;
}

export function resolveZogDesktopFlavor(input: {
  readonly isDevelopment: boolean;
  readonly requestedFlavor?: string | undefined;
}): ZogDesktopFlavor {
  if (input.requestedFlavor?.trim().toLowerCase() === "canary") {
    return "canary";
  }
  return input.isDevelopment ? "development" : "production";
}

export function zogDesktopIdentity(flavor: ZogDesktopFlavor): ZogDesktopIdentity {
  if (flavor === "canary") {
    return {
      flavor,
      displayName: "Zog Code Editor Canary",
      bundleId: ZOG_CANARY_BUNDLE_ID,
      scheme: ZOG_CANARY_DESKTOP_SCHEME,
      origin: ZOG_CANARY_DESKTOP_ORIGIN,
      entryUrl: ZOG_CANARY_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "zog-canary",
      defaultHomeDirectoryName: ".zog-canary",
      usesScriptedUpdates: true,
    };
  }
  if (flavor === "development") {
    return {
      flavor,
      displayName: "Zog Code Editor (Dev)",
      bundleId: ZOG_DEVELOPMENT_BUNDLE_ID,
      scheme: ZOG_DESKTOP_SCHEME,
      origin: ZOG_DESKTOP_ORIGIN,
      entryUrl: ZOG_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "zog-dev",
      defaultHomeDirectoryName: ".zog",
      usesScriptedUpdates: false,
    };
  }
  return {
    flavor,
    displayName: "Zog Code Editor",
    bundleId: ZOG_PRODUCTION_BUNDLE_ID,
    scheme: ZOG_DESKTOP_SCHEME,
    origin: ZOG_DESKTOP_ORIGIN,
    entryUrl: ZOG_DESKTOP_ENTRY_URL,
    userDataDirectoryName: "zog",
    defaultHomeDirectoryName: ".zog",
    usesScriptedUpdates: false,
  };
}

export function zogBundleId(isDevelopment: boolean): string {
  return zogDesktopIdentity(isDevelopment ? "development" : "production").bundleId;
}
