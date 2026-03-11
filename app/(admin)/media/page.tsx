"use client";

import { useCallback, useEffect, useState } from "react";

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  _count: { schedules: number };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fetchMedia = useCallback(async () => {
    const res = await fetch("/api/media");
    const data = await res.json();
    setMedia(data);
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch("/api/media", { method: "POST", body: formData });
      }
      await fetchMedia();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this media file? Associated schedules will also be removed.")) return;
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    await fetchMedia();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <p className="text-muted mt-1">Upload and manage PDF and video files</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors mb-8 ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-card-border hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleUpload(e.dataTransfer.files);
        }}
      >
        <div className="text-4xl mb-3 text-muted">◎</div>
        <p className="text-sm font-medium mb-1">
          {uploading ? "Uploading..." : "Drop files here or click to upload"}
        </p>
        <p className="text-xs text-muted mb-4">PDF, MP4, WebM, or MOV</p>
        <label className="inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-primary-hover transition-colors">
          Choose Files
          <input
            type="file"
            className="hidden"
            accept=".pdf,.mp4,.webm,.mov"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg font-medium">No media uploaded yet</p>
          <p className="text-sm mt-1">Upload PDF or video files to get started</p>
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-muted-bg">
                <th className="text-left p-4 font-medium text-muted">File</th>
                <th className="text-left p-4 font-medium text-muted">Type</th>
                <th className="text-left p-4 font-medium text-muted">Size</th>
                <th className="text-left p-4 font-medium text-muted">Schedules</th>
                <th className="text-left p-4 font-medium text-muted">Uploaded</th>
                <th className="text-right p-4 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {media.map((item) => (
                <tr key={item.id} className="border-b border-card-border last:border-0 hover:bg-muted-bg/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-white ${
                        item.mimeType.startsWith("video/") ? "bg-violet-500" : "bg-rose-500"
                      }`}>
                        {item.mimeType.startsWith("video/") ? "MP4" : "PDF"}
                      </span>
                      <div>
                        <p className="font-medium truncate max-w-[250px]">{item.originalName}</p>
                        <p className="text-xs text-muted">{item.filename}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted">{item.mimeType}</td>
                  <td className="p-4 text-muted">{formatBytes(item.size)}</td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 bg-muted-bg rounded-full text-xs">
                      {item._count.schedules}
                    </span>
                  </td>
                  <td className="p-4 text-muted">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/api/uploads/${item.filename}`}
                        target="_blank"
                        className="px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        Preview
                      </a>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1.5 text-xs font-medium text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
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
