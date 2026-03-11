"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Media {
  id: number;
  originalName: string;
  mimeType: string;
}

interface Schedule {
  id: number;
  startTime: string;
  endTime: string;
  media: Media;
}

interface Screen {
  id: number;
  name: string;
  description: string | null;
  schedules: Schedule[];
}

const TIMEZONE = "Europe/Brussels";

function getBrusselsTime(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  return `${parts.find((p) => p.type === "hour")!.value}:${parts.find((p) => p.type === "minute")!.value}`;
}

export default function DashboardPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [totalMedia, setTotalMedia] = useState(0);
  const [totalSchedules, setTotalSchedules] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchData = useCallback(async () => {
    const [screensRes, mediaRes, schedulesRes] = await Promise.all([
      fetch("/api/screens"),
      fetch("/api/media"),
      fetch("/api/schedules"),
    ]);
    setScreens(await screensRes.json());
    const mediaList = await mediaRes.json();
    const scheduleList = await schedulesRes.json();
    setTotalMedia(mediaList.length);
    setTotalSchedules(scheduleList.length);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentTime = getBrusselsTime();

  const getCurrentMedia = (screen: Screen) =>
    screen.schedules.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    )?.media ?? null;

  const startEditing = (screen: Screen) => {
    setEditingId(screen.id);
    setEditName(screen.name);
    setEditDesc(screen.description || "");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await fetch(`/api/screens/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
    });
    setEditingId(null);
    await fetchData();
  };

  const addScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch("/api/screens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
    });
    setNewName("");
    setNewDesc("");
    setShowAdd(false);
    await fetchData();
  };

  const deleteScreen = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? Its schedules will also be removed.`)) return;
    await fetch(`/api/screens/${id}`, { method: "DELETE" });
    await fetchData();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted mt-1">Overview of your digital signage network</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          {showAdd ? "Cancel" : "+ Add Screen"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={addScreen}
          className="bg-card-bg border border-card-border rounded-xl p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Screen Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Screen 8 — Meeting Room"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. Third floor meeting room"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Add Screen
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Screens", value: screens.length, color: "bg-blue-500" },
          { label: "Media Files", value: totalMedia, color: "bg-emerald-500" },
          { label: "Schedules", value: totalSchedules, color: "bg-violet-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card-bg border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${stat.color}`} />
              <span className="text-sm text-muted">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Screen Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {screens.map((screen) => {
          const media = getCurrentMedia(screen);
          const isEditing = editingId === screen.id;

          return (
            <div
              key={screen.id}
              className="bg-card-bg border border-card-border rounded-xl overflow-hidden"
            >
              <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
                {media ? (
                  <div className="text-center p-4">
                    <div className="text-white/80 text-sm font-medium">Now Playing</div>
                    <div className="text-white text-xs mt-1 truncate max-w-[200px]">
                      {media.originalName}
                    </div>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                      {media.mimeType.startsWith("video/") ? "VIDEO" : "PDF"}
                    </span>
                  </div>
                ) : (
                  <div className="text-white/30 text-sm">No content scheduled</div>
                )}
                <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${media ? "bg-emerald-400" : "bg-slate-600"}`} />
              </div>
              <div className="p-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs font-medium text-muted border border-card-border rounded-lg hover:bg-muted-bg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{screen.name}</h3>
                        {screen.description && (
                          <p className="text-xs text-muted mt-0.5 truncate">{screen.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditing(screen)}
                          className="p-1 text-muted hover:text-foreground transition-colors"
                          title="Rename"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteScreen(screen.id, screen.name)}
                          className="p-1 text-muted hover:text-danger transition-colors"
                          title="Delete screen"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted">
                        {screen.schedules.length} slot{screen.schedules.length !== 1 ? "s" : ""}
                      </span>
                      <Link
                        href={`/display/${screen.id}`}
                        target="_blank"
                        className="text-xs text-primary hover:underline"
                      >
                        Open Display →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
