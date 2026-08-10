import * as FS from "node:fs";
import * as OS from "node:os";
import * as Path from "node:path";

import { describe, expect, it } from "vitest";

import {
  acknowledgeZogStorageSnapshot,
  readZogStorageSnapshot,
  saveZogStorageSnapshot,
  ZOG_STORAGE_SNAPSHOT_MAX_BYTES,
  validateZogStorageSnapshot,
} from "./desktopStorageMigration";

const snapshot = (exportedAt = "2026-07-09T00:00:00.000Z") => ({
  version: 1 as const,
  exportedAt,
  entries: {
    "zog:theme": "dark",
    "zog.openUsage.enabled": "true",
  },
});

describe("desktopStorageMigration", () => {
  it("round-trips atomically and acknowledges the snapshot", async () => {
    const directory = FS.mkdtempSync(Path.join(OS.tmpdir(), "zog-storage-migration-"));
    const target = Path.join(directory, "snapshot.json");
    try {
      await expect(saveZogStorageSnapshot(target, snapshot())).resolves.toBe(true);
      expect(readZogStorageSnapshot(target)).toEqual(snapshot());
      expect(FS.readdirSync(directory)).toEqual(["snapshot.json"]);

      await acknowledgeZogStorageSnapshot(target);
      expect(readZogStorageSnapshot(target)).toBeNull();
    } finally {
      FS.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects malformed, disallowed, and oversized snapshots", () => {
    expect(validateZogStorageSnapshot({ version: 1 })).toBeNull();
    expect(
      validateZogStorageSnapshot({
        ...snapshot(),
        entries: { "foreign:theme": "dark" },
      }),
    ).toBeNull();
    expect(
      validateZogStorageSnapshot({
        ...snapshot(),
        entries: { "zog:large": "x".repeat(ZOG_STORAGE_SNAPSHOT_MAX_BYTES) },
      }),
    ).toBeNull();
  });

  it("accepts renderer snapshots containing large composer drafts", () => {
    const largeDraft = "x".repeat(2 * 1024 * 1024);

    expect(
      validateZogStorageSnapshot({
        ...snapshot(),
        entries: { "zog:composer-drafts:v1": largeDraft },
      })?.entries["zog:composer-drafts:v1"],
    ).toBe(largeDraft);
  });

  it("does not replace a newer snapshot with an older export", async () => {
    const directory = FS.mkdtempSync(Path.join(OS.tmpdir(), "zog-storage-migration-"));
    const target = Path.join(directory, "snapshot.json");
    try {
      await saveZogStorageSnapshot(target, snapshot("2026-07-09T01:00:00.000Z"));
      await expect(
        saveZogStorageSnapshot(target, snapshot("2026-07-09T00:00:00.000Z")),
      ).resolves.toBe(false);
      expect(readZogStorageSnapshot(target)?.exportedAt).toBe("2026-07-09T01:00:00.000Z");
    } finally {
      FS.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("treats missing and malformed files as absent", () => {
    const directory = FS.mkdtempSync(Path.join(OS.tmpdir(), "zog-storage-migration-"));
    const target = Path.join(directory, "snapshot.json");
    try {
      expect(readZogStorageSnapshot(target)).toBeNull();
      FS.writeFileSync(target, "not json");
      expect(readZogStorageSnapshot(target)).toBeNull();
    } finally {
      FS.rmSync(directory, { recursive: true, force: true });
    }
  });
});
