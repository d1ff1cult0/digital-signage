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
  days: string;
  priority: number;
  active: boolean;
  screen: Screen;
  media: Media;
}

const ALL_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
  fri: "Fri", sat: "Sat", sun: "Sun",
};

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
    days: ALL_DAYS.join(","),
    priority: 0,
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

    setForm({
      screenId: "",
      mediaId: "",
      startTime: "08:00",
      endTime: "17:00",
      days: ALL_DAYS.join(","),
      priority: 0,
    });
    setShowForm(false);
    await fetchData();
  };

  const toggleActive = async (schedule: Schedule) => {
    await fetch(`/api/schedules/${schedule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !schedule.active }),
    });
    await fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this schedule?")) return;
    await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    await fetchData();
  };

  const toggleDay = (day: string) => {
    const currentDays = form.days.split(",").filter(Boolean);
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    setForm({ ...form, days: newDays.join(",") });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Schedules</h1>
          <p className="text-muted mt-1">Assign media to screens at specific times</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          {showForm ? "Cancel" : "+ New Schedule"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card-bg border border-card-border rounded-xl p-6 mb-8 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Screen</label>
              <select
                value={form.screenId}
                onChange={(e) => setForm({ ...form, screenId: e.target.value })}
                required
              >
                <option value="">Select a screen...</option>
                {screens.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Media</label>
              <select
                value={form.mediaId}
                onChange={(e) => setForm({ ...form, mediaId: e.target.value })}
                required
              >
                <option value="">Select media...</option>
                {media.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.originalName} ({m.mimeType.startsWith("video/") ? "Video" : "PDF"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Priority</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Active Days</label>
            <div className="flex gap-2">
              {ALL_DAYS.map((day) => {
                const selected = form.days.split(",").includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      selected
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-muted border-card-border hover:border-primary/50"
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Create Schedule
            </button>
          </div>
        </form>
      )}

      {schedules.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg font-medium">No schedules yet</p>
          <p className="text-sm mt-1">Create a schedule to assign media to screens</p>
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-muted-bg">
                <th className="text-left p-4 font-medium text-muted">Screen</th>
                <th className="text-left p-4 font-medium text-muted">Media</th>
                <th className="text-left p-4 font-medium text-muted">Time</th>
                <th className="text-left p-4 font-medium text-muted">Days</th>
                <th className="text-left p-4 font-medium text-muted">Priority</th>
                <th className="text-left p-4 font-medium text-muted">Status</th>
                <th className="text-right p-4 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b border-card-border last:border-0 hover:bg-muted-bg/50">
                  <td className="p-4 font-medium">{schedule.screen.name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold text-white ${
                        schedule.media.mimeType.startsWith("video/") ? "bg-violet-500" : "bg-rose-500"
                      }`}>
                        {schedule.media.mimeType.startsWith("video/") ? "▶" : "◻"}
                      </span>
                      <span className="truncate max-w-[200px]">{schedule.media.originalName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted">
                    {schedule.startTime} – {schedule.endTime}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {ALL_DAYS.map((d) => (
                        <span
                          key={d}
                          className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-medium ${
                            schedule.days.includes(d)
                              ? "bg-primary/10 text-primary"
                              : "bg-muted-bg text-muted/40"
                          }`}
                        >
                          {d[0].toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-muted">{schedule.priority}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleActive(schedule)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        schedule.active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {schedule.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="px-3 py-1.5 text-xs font-medium text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
