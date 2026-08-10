import { describe, expect, it } from "vitest";

import {
  resolveZogDesktopFlavor,
  ZOG_CANARY_BUNDLE_ID,
  ZOG_CANARY_DESKTOP_ENTRY_URL,
  ZOG_CANARY_DESKTOP_ORIGIN,
  ZOG_DESKTOP_ENTRY_URL,
  ZOG_DESKTOP_ORIGIN,
  ZOG_DESKTOP_UPDATE_CHANNEL,
  ZOG_DEVELOPMENT_BUNDLE_ID,
  ZOG_PRODUCTION_BUNDLE_ID,
  zogBundleId,
  zogDesktopIdentity,
} from "./desktopIdentity";

describe("desktopIdentity", () => {
  it("uses the exact canonical production and development bundle IDs", () => {
    expect(ZOG_PRODUCTION_BUNDLE_ID).toBe("com.lawrence-millard.zog");
    expect(ZOG_DEVELOPMENT_BUNDLE_ID).toBe("com.lawrence-millard.zog.dev");
    expect(zogBundleId(false)).toBe(ZOG_PRODUCTION_BUNDLE_ID);
    expect(zogBundleId(true)).toBe(ZOG_DEVELOPMENT_BUNDLE_ID);
  });

  it("uses the exact packaged renderer origin and entry URL", () => {
    expect(ZOG_DESKTOP_ORIGIN).toBe("zog://app");
    expect(ZOG_DESKTOP_ENTRY_URL).toBe("zog://app/index.html");
  });

  it("uses the isolated Zog desktop update channel", () => {
    expect(ZOG_DESKTOP_UPDATE_CHANNEL).toBe("zog");
  });

  it("gives Canary a fully separate desktop identity and storage profile", () => {
    expect(ZOG_CANARY_BUNDLE_ID).toBe("com.lawrence-millard.zog.canary");
    expect(ZOG_CANARY_DESKTOP_ORIGIN).toBe("zog-canary://app");
    expect(ZOG_CANARY_DESKTOP_ENTRY_URL).toBe("zog-canary://app/index.html");
    expect(zogDesktopIdentity("canary")).toEqual({
      flavor: "canary",
      displayName: "Zog Canary",
      bundleId: ZOG_CANARY_BUNDLE_ID,
      scheme: "zog-canary",
      origin: ZOG_CANARY_DESKTOP_ORIGIN,
      entryUrl: ZOG_CANARY_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "zog-canary",
      defaultHomeDirectoryName: ".zog-canary",
      usesScriptedUpdates: true,
    });
  });

  it("selects Canary explicitly without changing normal dev and production defaults", () => {
    expect(resolveZogDesktopFlavor({ isDevelopment: false })).toBe("production");
    expect(resolveZogDesktopFlavor({ isDevelopment: true })).toBe("development");
    expect(resolveZogDesktopFlavor({ isDevelopment: false, requestedFlavor: " canary " })).toBe(
      "canary",
    );
    expect(resolveZogDesktopFlavor({ isDevelopment: true, requestedFlavor: "canary" })).toBe(
      "canary",
    );
  });
});
