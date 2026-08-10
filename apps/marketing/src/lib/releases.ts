// FILE: releases.ts
// Purpose: Defines the GitHub release source used by the marketing site download flows.
// Layer: Marketing util
// Exports: repo/release URLs plus the latest-release fetch helper.

const REPO = "lawrence-millard/zog-code";
export const REPO_URL = `https://github.com/${REPO}`;

export const RELEASES_URL = `https://github.com/${REPO}/releases`;

const LATEST_API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const LIST_API_URL = `https://api.github.com/repos/${REPO}/releases?per_page=5`;
const CACHE_KEY = "zog-latest-release-v2";
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface Release {
  tag_name: string;
  html_url: string;
  assets: ReleaseAsset[];
}

interface CachedRelease {
  cachedAt: number;
  release: Release;
}

function isRelease(value: unknown): value is Release {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Release;
  return typeof candidate.tag_name === "string" && Array.isArray(candidate.assets);
}

function readCache(): Release | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRelease;
    if (!parsed?.release || !isRelease(parsed.release)) return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed.release;
  } catch {
    return null;
  }
}

function writeCache(release: Release): void {
  const payload: CachedRelease = { cachedAt: Date.now(), release };
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new Error(`GitHub release request failed (${response.status})`);
  }
  return response.json();
}

export async function fetchLatestRelease(): Promise<Release> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const latest = await fetchJson(LATEST_API_URL);
    if (isRelease(latest) && latest.assets.length > 0) {
      writeCache(latest);
      return latest;
    }
  } catch {
    // Fall through to the releases list — latest can 404 before the first publish.
  }

  const listed = await fetchJson(LIST_API_URL);
  if (!Array.isArray(listed)) {
    throw new Error("Unexpected GitHub releases response");
  }

  const withAssets = listed.find(
    (entry) => isRelease(entry) && entry.assets.length > 0,
  );
  if (!withAssets || !isRelease(withAssets)) {
    throw new Error("No published Zog desktop releases yet");
  }

  writeCache(withAssets);
  return withAssets;
}
