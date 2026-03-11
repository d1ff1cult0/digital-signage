"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MediaData {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
}

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
  media: MediaData;
}

interface ScreenSchedule {
  screen: { id: number; name: string };
  slots: Slot[];
}

const SYNC_INTERVAL = 30_000;
const TICK_INTERVAL = 5_000;
const CACHE_KEY_PREFIX = "signage_schedule_";
const MEDIA_CACHE_NAME = "signage-media-v1";
const TIMEZONE = "Europe/Brussels";

function getBrusselsTime(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")!.value;
  const m = parts.find((p) => p.type === "minute")!.value;
  return `${h}:${m}`;
}

function findCurrentSlot(slots: Slot[]): Slot | null {
  const now = getBrusselsTime();
  return slots.find((s) => now >= s.startTime && now < s.endTime) ?? null;
}

export default function DisplayClient({ screenId }: { screenId: string }) {
  const [schedule, setSchedule] = useState<ScreenSchedule | null>(null);
  const [currentSlot, setCurrentSlot] = useState<Slot | null>(null);
  const [offline, setOffline] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState("");

  const blobUrlsRef = useRef<Map<string, string>>(new Map());
  const downloadingRef = useRef<Set<string>>(new Set());

  const saveScheduleToStorage = useCallback(
    (data: ScreenSchedule) => {
      try {
        localStorage.setItem(
          CACHE_KEY_PREFIX + screenId,
          JSON.stringify(data)
        );
      } catch {}
    },
    [screenId]
  );

  const loadScheduleFromStorage = useCallback((): ScreenSchedule | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY_PREFIX + screenId);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [screenId]);

  const getBlobUrl = useCallback((filename: string): string | null => {
    return blobUrlsRef.current.get(filename) ?? null;
  }, []);

  const downloadAndCacheMedia = useCallback(async (slots: Slot[]) => {
    const uniqueFiles = new Map<string, MediaData>();
    for (const slot of slots) {
      uniqueFiles.set(slot.media.filename, slot.media);
    }

    const toDownload: MediaData[] = [];
    for (const [filename, media] of uniqueFiles) {
      if (blobUrlsRef.current.has(filename)) continue;
      if (downloadingRef.current.has(filename)) continue;
      toDownload.push(media);
    }

    if (toDownload.length === 0) return;

    let cache: Cache | undefined;
    try {
      cache = await caches.open(MEDIA_CACHE_NAME);
    } catch {}

    for (let i = 0; i < toDownload.length; i++) {
      const media = toDownload[i];
      const url = `/api/uploads/${media.filename}`;

      if (blobUrlsRef.current.has(media.filename)) continue;
      downloadingRef.current.add(media.filename);

      setDownloadProgress(
        `Caching ${i + 1}/${toDownload.length}: ${media.originalName}`
      );

      try {
        let blob: Blob | null = null;

        if (cache) {
          const cached = await cache.match(url);
          if (cached) {
            blob = await cached.blob();
          }
        }

        if (!blob) {
          const res = await fetch(url);
          if (!res.ok) continue;

          const cloned = res.clone();
          blob = await res.blob();

          if (cache) {
            try {
              await cache.put(url, cloned);
            } catch {}
          }
        }

        const objectUrl = URL.createObjectURL(blob);
        blobUrlsRef.current.set(media.filename, objectUrl);
      } catch {
        // network error — will retry on next sync
      } finally {
        downloadingRef.current.delete(media.filename);
      }
    }

    setDownloadProgress("");

    if (cache) {
      try {
        const cachedKeys = await cache.keys();
        const activeUrls = new Set(
          [...uniqueFiles.keys()].map((f) => `/api/uploads/${f}`)
        );
        for (const req of cachedKeys) {
          if (!activeUrls.has(new URL(req.url).pathname)) {
            await cache.delete(req);
          }
        }
      } catch {}
    }
  }, []);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch(`/api/screens/${screenId}/schedule`);
      if (!res.ok) return;
      const data: ScreenSchedule = await res.json();

      setSchedule(data);
      saveScheduleToStorage(data);
      setOffline(false);
      await downloadAndCacheMedia(data.slots);
    } catch {
      setOffline(true);
      if (!schedule) {
        const cached = loadScheduleFromStorage();
        if (cached) {
          setSchedule(cached);
          await downloadAndCacheMedia(cached.slots);
        }
      }
    } finally {
      setInitialLoad(false);
    }
  }, [
    screenId,
    schedule,
    saveScheduleToStorage,
    loadScheduleFromStorage,
    downloadAndCacheMedia,
  ]);

  useEffect(() => {
    fetchSchedule();
    const interval = setInterval(fetchSchedule, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSchedule]);

  useEffect(() => {
    const tick = () => {
      if (schedule) {
        setCurrentSlot(findCurrentSlot(schedule.slots));
      }
    };
    tick();
    const interval = setInterval(tick, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [schedule]);

  if (initialLoad) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-sm opacity-30">Loading...</p>
          {downloadProgress && (
            <p className="text-xs opacity-20 mt-2">{downloadProgress}</p>
          )}
        </div>
      </div>
    );
  }

  if (!currentSlot) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-3xl font-light opacity-20 mb-2">
            Screen {screenId}
          </p>
          <p className="text-sm opacity-30">No content scheduled</p>
          {offline && (
            <p className="text-xs opacity-20 mt-4">
              Offline — using cached schedule
            </p>
          )}
          {downloadProgress && (
            <p className="text-xs opacity-20 mt-2">{downloadProgress}</p>
          )}
        </div>
      </div>
    );
  }

  const blobUrl = getBlobUrl(currentSlot.media.filename);
  const fallbackUrl = `/api/uploads/${currentSlot.media.filename}`;
  const mediaUrl = blobUrl || fallbackUrl;

  if (currentSlot.media.mimeType.startsWith("video/")) {
    return (
      <video
        key={`${currentSlot.id}-${blobUrl ? "blob" : "net"}`}
        src={mediaUrl}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-contain bg-black"
      />
    );
  }

  if (currentSlot.media.mimeType === "application/pdf") {
    return (
      <iframe
        key={`${currentSlot.id}-${blobUrl ? "blob" : "net"}`}
        src={mediaUrl}
        className="w-full h-full border-0"
        title={currentSlot.media.originalName}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-black text-white">
      <p>Unsupported format: {currentSlot.media.mimeType}</p>
    </div>
  );
}
