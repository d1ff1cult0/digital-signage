"use client";

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
const MINUTES = ["00", "15", "30", "45"];

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [h = "", m = ""] = value.split(":");

  const setHour = (hour: string) => onChange(`${hour}:${m || "00"}`);
  const setMinute = (minute: string) => onChange(`${h || "00"}:${minute}`);

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-medium text-muted mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-1">
        <select
          value={h}
          onChange={(e) => setHour(e.target.value)}
          className="!w-16 !py-1.5 !text-sm font-mono text-center"
        >
          <option value="" disabled>
            HH
          </option>
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <span className="text-sm font-bold text-muted">:</span>
        <select
          value={m}
          onChange={(e) => setMinute(e.target.value)}
          className="!w-16 !py-1.5 !text-sm font-mono text-center"
        >
          <option value="" disabled>
            MM
          </option>
          {MINUTES.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
