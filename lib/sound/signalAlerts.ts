"use client";

import type { ComputedSignal } from "@/lib/signal-engine/types";
import { resolvePermission } from "@/lib/signal-engine/permission";

const ALERT_STORE_KEY = "til_v8_alerted_daily";

let audioCtx: AudioContext | null = null;
let soundEnabled = false;

export function isSoundEnabled() {
  return soundEnabled;
}

export function enableSoundAlerts(): boolean {
  if (typeof window === "undefined") return false;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return false;
  audioCtx = audioCtx || new Ctx();
  soundEnabled = true;
  return true;
}

function beep(
  freq: number,
  dur: number,
  start = 0,
  vol: number,
  type: OscillatorType = "sine"
) {
  if (!soundEnabled || !audioCtx) return;
  const t = audioCtx.currentTime + start;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
}

export function playTestAlert(volume = 0.3) {
  if (!enableSoundAlerts()) return;
  beep(650, 0.13, 0, volume);
  beep(900, 0.18, 0.18, volume);
  beep(620, 0.18, 0.42, volume);
}

function playSignalAlert(sig: ComputedSignal, volume: number) {
  if (sig.signalType === "STRONG FINAL") {
    if (sig.direction === "CALL") {
      beep(720, 0.14, 0, volume);
      beep(920, 0.18, 0.18, volume);
      beep(1120, 0.22, 0.42, volume);
    } else {
      beep(1120, 0.14, 0, volume);
      beep(880, 0.18, 0.18, volume);
      beep(620, 0.22, 0.42, volume);
    }
  } else if (sig.signalType === "FINAL TRADE") {
    if (sig.direction === "CALL") {
      beep(650, 0.18, 0, volume);
      beep(900, 0.2, 0.22, volume);
    } else {
      beep(900, 0.18, 0, volume);
      beep(620, 0.2, 0.22, volume);
    }
  }
}

function loadAlertStore() {
  if (typeof window === "undefined") return { date: "", ids: [] as string[] };
  const today = new Date().toISOString().slice(0, 10);
  try {
    const s = JSON.parse(localStorage.getItem(ALERT_STORE_KEY) || "{}") as {
      date?: string;
      ids?: string[];
    };
    if (s.date !== today) return { date: today, ids: [] };
    return { date: today, ids: s.ids || [] };
  } catch {
    return { date: today, ids: [] };
  }
}

function saveAlertStore(store: { date: string; ids: string[] }) {
  localStorage.setItem(ALERT_STORE_KEY, JSON.stringify(store));
}

/** Play at most one new TRADE ALLOWED alert per scan (HTML V8 behavior). */
export function playScanAlerts(signals: ComputedSignal[], volume = 0.3) {
  if (!soundEnabled) return;
  const store = loadAlertStore();
  const allowed = signals.filter(
    (s) =>
      resolvePermission(s) === "TRADE ALLOWED" &&
      (s.signalType === "FINAL TRADE" || s.signalType === "STRONG FINAL")
  );
  for (const s of allowed) {
    if (!store.ids.includes(s.signalUid)) {
      playSignalAlert(s, volume);
      store.ids.push(s.signalUid);
      saveAlertStore(store);
      break;
    }
  }
}
