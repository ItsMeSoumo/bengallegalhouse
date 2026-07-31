"use client";

import React, { useState, useRef, useEffect } from "react";

interface ExamSchedulerProps {
  date: string;
  startTime: string;
  endTime: string;
  onDateChange: (v: string) => void;
  onStartTimeChange: (v: string) => void;
  onEndTimeChange: (v: string) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function todayIST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function tomorrowIST() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function formatFriendlyDate(iso: string) {
  if (!iso) return "Select Date";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parse24to12(t24: string) {
  if (!t24) return { hour: "10", minute: "00", period: "AM" };
  const [hStr, mStr] = t24.split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) h = 10;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const hour = String(h).padStart(2, "0");
  const minute = String(parseInt(mStr, 10) || 0).padStart(2, "0");
  return { hour, minute, period };
}

function format12to24(hourStr: string, minuteStr: string, period: string) {
  let h = parseInt(hourStr, 10);
  if (isNaN(h)) h = 12;
  h = Math.max(1, Math.min(12, h));
  
  let m = parseInt(minuteStr, 10);
  if (isNaN(m)) m = 0;
  m = Math.max(0, Math.min(59, m));

  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ── Custom Dark Calendar Component (Opens Upward to avoid cutoff) ───────────
function CustomDarkCalendar({
  selectedDate,
  onSelectDate,
  onClose,
}: {
  selectedDate: string;
  onSelectDate: (d: string) => void;
  onClose: () => void;
}) {
  const initial = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
  const [currentMonth, setCurrentMonth] = useState(initial.getMonth());
  const [currentYear, setCurrentYear] = useState(initial.getFullYear());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const todayStr = todayIST();

  return (
    <div className="absolute left-0 bottom-full mb-2 z-[100] w-72 p-4 rounded-2xl bg-navy-950 border border-gold-500/40 shadow-2xl backdrop-blur-xl animate-fade-in space-y-3">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-navy-800 pb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="w-7 h-7 rounded-lg bg-navy-900 hover:bg-navy-800 text-gold-400 font-bold flex items-center justify-center transition cursor-pointer"
        >
          ‹
        </button>
        <span className="text-xs font-bold text-white tracking-wide">
          {monthNames[currentMonth]} {currentYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-7 h-7 rounded-lg bg-navy-900 hover:bg-navy-800 text-gold-400 font-bold flex items-center justify-center transition cursor-pointer"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-foreground/40 uppercase">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const monthStr = String(currentMonth + 1).padStart(2, "0");
          const dayStr = String(dayNum).padStart(2, "0");
          const dateIso = `${currentYear}-${monthStr}-${dayStr}`;

          const isSelected = selectedDate === dateIso;
          const isToday = todayStr === dateIso;
          const isPast = dateIso < todayStr;

          return (
            <button
              key={dayNum}
              type="button"
              disabled={isPast}
              onClick={() => {
                onSelectDate(dateIso);
                onClose();
              }}
              className={`h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                isSelected
                  ? "bg-gold-500 text-navy-950 font-bold shadow-md shadow-gold-500/20"
                  : isToday
                  ? "border border-gold-500/50 text-gold-400 font-bold bg-gold-500/10"
                  : isPast
                  ? "text-foreground/20 cursor-not-allowed"
                  : "text-white hover:bg-navy-900 hover:text-gold-400"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {/* Quick Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-navy-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            onSelectDate(todayIST());
            onClose();
          }}
          className="text-gold-400 hover:underline"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            onSelectDate(tomorrowIST());
            onClose();
          }}
          className="text-purple-400 hover:underline"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-foreground/40 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Hybrid Typeable & Selectable Time Input ──────────────────────────────────
function CustomDarkTimePicker({
  value24,
  onChange24,
  label,
}: {
  value24: string;
  onChange24: (val: string) => void;
  label: string;
}) {
  const { hour, minute, period } = parse24to12(value24);

  const [inputHour, setInputHour] = useState(hour);
  const [inputMinute, setInputMinute] = useState(minute);

  useEffect(() => {
    setInputHour(hour);
    setInputMinute(minute);
  }, [hour, minute]);

  const handleHourBlur = () => {
    let h = parseInt(inputHour, 10);
    if (isNaN(h)) h = 12;
    h = Math.max(1, Math.min(12, h));
    const hStr = String(h).padStart(2, "0");
    setInputHour(hStr);
    onChange24(format12to24(hStr, inputMinute, period));
  };

  const handleMinuteBlur = () => {
    let m = parseInt(inputMinute, 10);
    if (isNaN(m)) m = 0;
    m = Math.max(0, Math.min(59, m));
    const mStr = String(m).padStart(2, "0");
    setInputMinute(mStr);
    onChange24(format12to24(inputHour, mStr, period));
  };

  const handlePeriodToggle = (newPeriod: string) => {
    onChange24(format12to24(inputHour, inputMinute, newPeriod));
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-foreground/40 font-semibold uppercase">{label}</span>
        <span className="text-gold-400 font-bold">
          {inputHour.padStart(2, "0")}:{inputMinute.padStart(2, "0")} {period}
        </span>
      </div>

      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-navy-950 border border-white/10">
        {/* Typeable Hour Input */}
        <input
          type="text"
          maxLength={2}
          value={inputHour}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setInputHour(val);
            if (val.length === 2) {
              const h = Math.max(1, Math.min(12, parseInt(val, 10) || 12));
              const hStr = String(h).padStart(2, "0");
              onChange24(format12to24(hStr, inputMinute, period));
            }
          }}
          onBlur={handleHourBlur}
          className="w-14 bg-navy-900 text-white text-sm font-extrabold text-center py-2 rounded-xl border border-navy-700 focus:outline-none focus:border-gold-500 transition shadow-inner"
          placeholder="HH"
        />

        <span className="text-sm font-bold text-gold-400">:</span>

        {/* Typeable Minute Input */}
        <input
          type="text"
          maxLength={2}
          value={inputMinute}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setInputMinute(val);
            if (val.length === 2) {
              const m = Math.max(0, Math.min(59, parseInt(val, 10) || 0));
              const mStr = String(m).padStart(2, "0");
              onChange24(format12to24(inputHour, mStr, period));
            }
          }}
          onBlur={handleMinuteBlur}
          className="w-14 bg-navy-900 text-white text-sm font-extrabold text-center py-2 rounded-xl border border-navy-700 focus:outline-none focus:border-gold-500 transition shadow-inner"
          placeholder="MM"
        />

        {/* AM / PM Toggle Pill */}
        <div className="flex items-center bg-navy-900 rounded-lg p-0.5 border border-navy-800 ml-auto">
          {["AM", "PM"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePeriodToggle(p)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                period === p
                  ? "bg-gold-500 text-navy-950 shadow-sm"
                  : "text-foreground/40 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ExamScheduler Component ────────────────────────────────────────────
export default function ExamScheduler({
  date,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: ExamSchedulerProps) {
  const isOn = !!(date || startTime || endTime);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const enable = () => {
    const t = todayIST();
    console.log("🗓️ [EXAM_SCHEDULER] Setting schedule window enabled:", { date: t, startTime: "10:00", endTime: "12:00" });
    onDateChange(t);
    onStartTimeChange("10:00");
    onEndTimeChange("12:00");
  };

  const disable = () => {
    console.log("🗓️ [EXAM_SCHEDULER] Removing schedule window (Always Available 24/7)");
    onDateChange("");
    onStartTimeChange("");
    onEndTimeChange("");
    setShowCalendar(false);
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Live Schedule Window</span>
          <span
            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
              isOn
                ? "text-gold-300 bg-gold-500/10 border-gold-500/30"
                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
            }`}
          >
            {isOn ? "● Restricted Window" : "● Always Available (24/7)"}
          </span>
        </div>
        {isOn ? (
          <button
            type="button"
            onClick={disable}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-red-500/10"
          >
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Remove Schedule</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={enable}
            className="text-xs font-bold text-gold-400 hover:text-gold-300 border border-gold-500/30 px-3.5 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/15 transition cursor-pointer"
          >
            + Set Window
          </button>
        )}
      </div>

      {!isOn && (
        <p className="text-xs text-foreground/40">
          Students can take this exam anytime. Click{" "}
          <span className="text-gold-400 font-semibold">+ Set Window</span> to lock access to a specific date & time slot.
        </p>
      )}

      {isOn && (
        <div className="space-y-4 p-4 rounded-2xl bg-navy-950/60 border border-gold-500/20">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-2">
            {[
              { label: "Today", v: todayIST() },
              { label: "Tomorrow", v: tomorrowIST() },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => onDateChange(chip.v)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  date === chip.v
                    ? "bg-gold-500/20 text-gold-300 border-gold-500/40"
                    : "bg-navy-900 text-foreground/50 border-white/10 hover:text-white"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Three Pickers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Custom Dark Date Picker (Opens Upwards) */}
            <div className="relative space-y-1" ref={calendarRef}>
              <span className="text-[11px] text-foreground/40 font-semibold uppercase block">
                Exam Date
              </span>
              <button
                type="button"
                onClick={() => setShowCalendar((prev) => !prev)}
                className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-white/10 text-white text-xs font-bold flex items-center justify-between hover:border-gold-500/40 transition cursor-pointer"
              >
                <span>📅 {date ? formatFriendlyDate(date) : "Select Date"}</span>
                <span className="text-foreground/40 text-[10px]">▲</span>
              </button>

              {showCalendar && (
                <CustomDarkCalendar
                  selectedDate={date}
                  onSelectDate={onDateChange}
                  onClose={() => setShowCalendar(false)}
                />
              )}
            </div>

            {/* 2. Typeable Start Time Picker */}
            <CustomDarkTimePicker
              label="Start Time"
              value24={startTime || "10:00"}
              onChange24={onStartTimeChange}
            />

            {/* 3. Typeable End Time Picker */}
            <CustomDarkTimePicker
              label="End Time"
              value24={endTime || "12:00"}
              onChange24={onEndTimeChange}
            />
          </div>

          {/* Schedule Summary Bar */}
          {date && startTime && endTime && (
            <div className="flex items-center justify-between pt-2 border-t border-navy-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-foreground/40">Active Window:</span>
                <span className="font-bold text-white">{formatFriendlyDate(date)}</span>
                <span className="text-foreground/30">·</span>
                <span className="font-bold text-gold-400">
                  {parse24to12(startTime).hour}:{parse24to12(startTime).minute}{" "}
                  {parse24to12(startTime).period} → {parse24to12(endTime).hour}:
                  {parse24to12(endTime).minute} {parse24to12(endTime).period} IST
                </span>
              </div>

              {/* Calculated Window Duration Badge */}
              {(() => {
                const [sh, sm] = startTime.split(":").map(Number);
                const [eh, em] = endTime.split(":").map(Number);
                if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
                  let sMins = sh * 60 + sm;
                  let eMins = eh * 60 + em;
                  if (eMins <= sMins) eMins += 1440;
                  const diff = eMins - sMins;
                  const hrs = Math.floor(diff / 60);
                  const m = diff % 60;
                  const durationStr = hrs > 0 && m > 0 ? `${hrs}h ${m}m` : hrs > 0 ? `${hrs} Hour${hrs > 1 ? "s" : ""}` : `${m} Mins`;
                  return (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 shrink-0">
                      <span>⏱️</span>
                      <span>Window Duration: {durationStr}</span>
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
