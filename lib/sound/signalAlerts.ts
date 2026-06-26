"use client";

import type { ComputedSignal } from "@/lib/signal-engine/types";
import { isV10LiveDisplay, isV10PendingDisplay } from "@/lib/signal-engine/v10/validate";
import { readTilStorageItem, writeTilStorageItem } from "@/lib/storage/tilStorageKeys";

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

function playLiveAlert(sig: ComputedSignal, volume: number) {
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

function playPendingAlert(sig: ComputedSignal, volume: number) {
  beep(520, 0.12, 0, volume * 0.9, "triangle");
  beep(680, 0.16, 0.14, volume * 0.85, "triangle");
  if (sig.direction === "CALL") {
    beep(780, 0.2, 0.32, volume * 0.8, "triangle");
  } else {
    beep(420, 0.2, 0.32, volume * 0.8, "triangle");
  }
}

function loadAlertStore() {
  if (typeof window === "undefined") return { date: "", ids: [] as string[] };
  const today = new Date().toISOString().slice(0, 10);
  try {
    const s = JSON.parse(readTilStorageItem("alertedDaily") || "{}") as {
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
  writeTilStorageItem("alertedDaily", JSON.stringify(store));
}

/** Play at most one new V10 LIVE or Pending Order alert per scan. */
export function playScanAlerts(signals: ComputedSignal[], volume = 0.3) {
  if (!soundEnabled) return;
  const store = loadAlertStore();
  const allowed = signals.filter(
    (s) =>
      (isV10LiveDisplay(s) || isV10PendingDisplay(s)) &&
      (s.signalType === "FINAL TRADE" || s.signalType === "STRONG FINAL"),
  );
  for (const s of allowed) {
    if (!store.ids.includes(s.signalUid)) {
      if (isV10PendingDisplay(s)) playPendingAlert(s, volume);
      else playLiveAlert(s, volume);
      store.ids.push(s.signalUid);
      saveAlertStore(store);
      break;
    }
  }
}
