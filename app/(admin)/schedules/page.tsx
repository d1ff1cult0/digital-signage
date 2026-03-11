"use client";

import { useCallback, useEffect, useState } from "react";

interface Screen {
  id: number;
  name: string;
}

interface Media {
  id: number;
  originalName: string;
  mimeType: string;
}

interface Schedule {
  id: number;
  screenId: number;
  mediaId: number;
  startTime: string;
  endTime: string;
  screen: Screen;
  media: Media;
}

interface SlotForm {
  mediaId: string;
  startTime: string;
  endTime: string;
}

const EMPTY_FORM: SlotForm = { mediaId: "", startTime: "", endTime: "" };

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [openScreens, setOpenScreens] = useState<Set<number>>(new Set());
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [form, setForm] = useState<SlotForm>(EMPTY_FORM);

  const fetchData = useCallback(async () => {
    const [schedulesRes, screensRes, mediaRes] = await Promise.all([
      fetch("/api/schedules"),
      fetch("/api/screens"),
      fetch("/api/media"),
    ]);
    setSchedules(await schedulesRes.json());
    const screenList: Screen[] = await screensRes.json();
    setScreens(screenList);
    setMedia(await mediaRes.json());
    if (openScreens.size === 0) {
      setOpenScreens(new Set(screenList.map((s) => s.id)));
    }
  }, [openScreens.size]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleScreen = (id: number) => {
    setOpenScreens((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const slotsFor = (screenId: number) =>
    schedules
      .filter((s) => s.screenId === screenId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const startAdding = (screenId: number) => {
    const existing = slotsFor(screenId);
    const lastEnd = existing.length > 0 ? existing[existing.length - 1].endTime : "08:00";
    setAddingTo(screenId);
    setForm({ mediaId: "", startTime: lastEnd, endTime: "" });
  };

  const cancelAdding = () => {
    setAddingTo(null);
    setForm(EMPTY_FORM);
  };

  const handleAdd = async (screenId: number) => {
    if (!form.mediaId || !form.startTime || !form.endTime) return;

    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        screenId,
        mediaId: form.mediaId,
        startTime: form.startTime,
        endTime: form.endTime,
      }),
    });
    cancelAdding();
    await fetchData();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    await fetchData();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Schedules</h1>
        <p className="text-muted mt-1">
          Configure time slots per screen — e.g. 10:00–13:00 File A, 13:00–16:00 File B
        </p>
      </div>

      {screens.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg font-medium">No screens configured</p>
          <p className="text-sm mt-1">Add screens from the Dashboard first</p>
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg font-medium">No media uploaded</p>
          <p className="text-sm mt-1">Upload files in the Media Library first</p>
        </div>
      ) : (
        <div className="space-y-4">
          {screens.map((screen) => {
            const slots = slotsFor(screen.id);
            const isOpen = openScreens.has(screen.id);
            const isAdding = addingTo === screen.id;

            return (
              <div
                key={screen.id}
                className="bg-card-bg border border-card-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleScreen(screen.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted-bg/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-muted text-xs transition-transform"
                      style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                    >
                      ▶
                    </span>
                    <h3 className="font-semibold text-sm">{screen.name}</h3>
                    <span className="text-xs text-muted bg-muted-bg px-2 py-0.5 rounded-full">
                      {slots.length} slot{slots.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-card-border">
                    {slots.length === 0 && !isAdding && (
                      <div className="px-5 py-6 text-center text-muted text-sm">
                        No time slots — click below to add one
                      </div>
                    )}

                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-4 px-5 py-2.5 border-b border-card-border last:border-0 hover:bg-muted-bg/30"
                      >
                        <span className="text-sm font-mono font-medium text-foreground w-28 shrink-0">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold text-white shrink-0 ${
                              slot.media.mimeType.startsWith("video/")
                                ? "bg-violet-500"
                                : "bg-rose-500"
                            }`}
                          >
                            {slot.media.mimeType.startsWith("video/") ? "▶" : "◻"}
                          </span>
                          <span className="text-sm truncate">
                            {slot.media.originalName}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="p-1.5 text-muted hover:text-danger transition-colors shrink-0"
                          title="Remove slot"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {isAdding ? (
                      <div className="flex items-end gap-3 px-5 py-3 bg-muted-bg/40 border-t border-card-border">
                        <div className="w-28 shrink-0">
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            From
                          </label>
                          <input
                            type="time"
                            value={form.startTime}
                            onChange={(e) =>
                              setForm({ ...form, startTime: e.target.value })
                            }
                            className="!py-1.5 !text-sm font-mono"
                            required
                          />
                        </div>
                        <div className="w-28 shrink-0">
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            Until
                          </label>
                          <input
                            type="time"
                            value={form.endTime}
                            onChange={(e) =>
                              setForm({ ...form, endTime: e.target.value })
                            }
                            className="!py-1.5 !text-sm font-mono"
                            required
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[11px] font-medium text-muted mb-1">
                            File
                          </label>
                          <select
                            value={form.mediaId}
                            onChange={(e) =>
                              setForm({ ...form, mediaId: e.target.value })
                            }
                            className="!py-1.5 !text-sm"
                            required
                          >
                            <option value="">Select file...</option>
                            {media.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.originalName} (
                                {m.mimeType.startsWith("video/")
                                  ? "Video"
                                  : "PDF"}
                                )
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleAdd(screen.id)}
                            disabled={
                              !form.mediaId || !form.startTime || !form.endTime
                            }
                            className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                          <button
                            onClick={cancelAdding}
                            className="px-3 py-1.5 text-xs font-medium text-muted border border-card-border rounded-lg hover:bg-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-5 py-2.5 border-t border-card-border">
                        <button
                          onClick={() => startAdding(screen.id)}
                          className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                          + Add time slot
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
