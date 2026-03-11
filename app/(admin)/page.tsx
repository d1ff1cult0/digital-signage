import { prisma } from "@/lib/prisma";
import { getBrusselsNow } from "@/lib/timezone";
import Link from "next/link";

async function getScreensWithCurrent() {
  const screens = await prisma.screen.findMany({
    include: {
      schedules: {
        include: { media: true },
        where: { active: true },
        orderBy: { priority: "desc" },
      },
    },
    orderBy: { id: "asc" },
  });

  const { day: currentDay, time: currentTime } = getBrusselsNow();

  return screens.map((screen) => {
    const activeSchedule = screen.schedules.find((s) => {
      const days = s.days.split(",").map((d) => d.trim().toLowerCase());
      if (!days.includes(currentDay)) return false;
      return currentTime >= s.startTime && currentTime < s.endTime;
    });

    return {
      ...screen,
      currentMedia: activeSchedule?.media || null,
      totalSchedules: screen.schedules.length,
    };
  });
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const screens = await getScreensWithCurrent();
  const totalMedia = await prisma.media.count();
  const totalSchedules = await prisma.schedule.count();
  const activeSchedules = await prisma.schedule.count({ where: { active: true } });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted mt-1">Overview of your digital signage network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Screens", value: screens.length, color: "bg-blue-500" },
          { label: "Media Files", value: totalMedia, color: "bg-emerald-500" },
          { label: "Total Schedules", value: totalSchedules, color: "bg-violet-500" },
          { label: "Active Schedules", value: activeSchedules, color: "bg-amber-500" },
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
        {screens.map((screen) => (
          <div
            key={screen.id}
            className="bg-card-bg border border-card-border rounded-xl overflow-hidden"
          >
            <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
              {screen.currentMedia ? (
                <div className="text-center p-4">
                  <div className="text-white/80 text-sm font-medium">
                    Now Playing
                  </div>
                  <div className="text-white text-xs mt-1 truncate max-w-[200px]">
                    {screen.currentMedia.originalName}
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                    {screen.currentMedia.mimeType.startsWith("video/") ? "VIDEO" : "PDF"}
                  </span>
                </div>
              ) : (
                <div className="text-white/30 text-sm">No content scheduled</div>
              )}
              <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${screen.currentMedia ? "bg-emerald-400" : "bg-slate-600"}`} />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm">{screen.name}</h3>
              {screen.description && (
                <p className="text-xs text-muted mt-0.5">{screen.description}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted">
                  {screen.totalSchedules} schedule{screen.totalSchedules !== 1 ? "s" : ""}
                </span>
                <Link
                  href={`/display/${screen.id}`}
                  target="_blank"
                  className="text-xs text-primary hover:underline"
                >
                  Open Display →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
