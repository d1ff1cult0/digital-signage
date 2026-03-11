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

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    screenId: "",
    mediaId: "",
    startTime: "08:00",
    endTime: "17:00",
  });

  const fetchData = useCallback(async () => {
    const [schedulesRes, screensRes, mediaRes] = await Promise.all([
      fetch("/api/schedules"),
      fetch("/api/screens"),
      fetch("/api/media"),
    ]);
    setSchedules(await schedulesRes.json());
    setScreens(await screensRes.json());
    setMedia(await mediaRes.json());
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.screenId || !form.mediaId) return;

    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm({ screenId: form.screenId, mediaId: "", startTime: "08:00", endTime: "17:00" });
    setShowForm(false);
    await fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this time slot?")) return;
    await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    await fetchData();
  };

  const grouped = screens
    .map((screen) => ({
      screen,
      slots: schedules
        .filter((s) => s.screenId === screen.id)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
    .filter((g) => g.slots.length > 0);

  const emptyScreens = screens.filter(
    (screen) => !schedules.some((s) => s.screenId === screen.id)
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Schedules</h1>
          <p className="text-muted mt-1">
            Set time slots for each screen — e.g. 10:00–13:00 File A, 13:00–16:00 File B
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Time Slot"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card-bg border border-card-border rounded-xl p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Screen</label>
              <select
                value={form.screenId}
                onChange={(e) => setForm({ ...form, screenId: e.target.value })}
                required
              >
                <option value="">Select screen...</option>
                {screens.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Media File</label>
              <select
                value={form.mediaId}
                onChange={(e) => setForm({ ...form, mediaId: e.target.value })}
                required
              >
                <option value="">Select file...</option>
                {media.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.originalName} ({m.mimeType.startsWith("video/") ? "Video" : "PDF"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">From</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Until</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Add Time Slot
            </button>
          </div>
        </form>
      )}

      {grouped.length === 0 && emptyScreens.length > 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg font-medium">No time slots configured</p>
          <p className="text-sm mt-1">Add time slots to assign media files to screens</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ screen, slots }) => (
            <div key={screen.id} className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-muted-bg border-b border-card-border">
                <h3 className="font-semibold text-sm">{screen.name}</h3>
              </div>
              <div className="divide-y divide-card-border">
                {slots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono font-medium w-28">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold text-white ${
                          slot.media.mimeType.startsWith("video/") ? "bg-violet-500" : "bg-rose-500"
                        }`}>
                          {slot.media.mimeType.startsWith("video/") ? "▶" : "◻"}
                        </span>
                        <span className="text-sm">{slot.media.originalName}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="px-3 py-1.5 text-xs font-medium text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {emptyScreens.length > 0 && (
            <div className="text-sm text-muted">
              <span className="font-medium">No slots:</span>{" "}
              {emptyScreens.map((s) => s.name).join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
