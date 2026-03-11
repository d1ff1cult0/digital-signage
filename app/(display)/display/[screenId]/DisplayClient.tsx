"use client";

import { useCallback, useEffect, useState } from "react";

interface MediaData {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
}

interface CurrentContent {
  media: MediaData | null;
  schedule: {
    id: number;
    startTime: string;
    endTime: string;
  } | null;
}

const POLL_INTERVAL = 10_000;

export default function DisplayClient({ screenId }: { screenId: string }) {
  const [content, setContent] = useState<CurrentContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/screens/${screenId}/current`);
      if (!res.ok) {
        setError(`Screen ${screenId} not found`);
        return;
      }
      const data: CurrentContent = await res.json();
      setContent((prev) => {
        if (prev?.media?.id !== data.media?.id) return data;
        return prev;
      });
      setError(null);
    } catch {
      setError("Connection lost. Retrying...");
    }
  }, [screenId]);

  useEffect(() => {
    fetchContent();
    const interval = setInterval(fetchContent, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchContent]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl font-light opacity-60">{error}</p>
        </div>
      </div>
    );
  }

  if (!content || !content.media) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-3xl font-light opacity-20 mb-2">Screen {screenId}</p>
          <p className="text-sm opacity-30">No content scheduled</p>
        </div>
      </div>
    );
  }

  const mediaUrl = `/api/uploads/${content.media.filename}`;

  if (content.media.mimeType.startsWith("video/")) {
    return (
      <video
        key={content.media.id}
        src={mediaUrl}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-contain bg-black"
      />
    );
  }

  if (content.media.mimeType === "application/pdf") {
    return (
      <iframe
        key={content.media.id}
        src={mediaUrl}
        className="w-full h-full border-0"
        title={content.media.originalName}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-black text-white">
      <p>Unsupported format: {content.media.mimeType}</p>
    </div>
  );
}
