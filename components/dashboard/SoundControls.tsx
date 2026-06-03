"use client";

import { useState } from "react";
import {
  enableSoundAlerts,
  isSoundEnabled,
  playTestAlert,
} from "@/lib/sound/signalAlerts";

export function SoundControls() {
  const [on, setOn] = useState(false);
  const [volume, setVolume] = useState(0.3);

  const enable = () => {
    if (enableSoundAlerts()) {
      setOn(true);
      playTestAlert(volume);
    }
  };

  const test = () => {
    if (!isSoundEnabled()) enable();
    else playTestAlert(volume);
  };

  return (
    <div className="row sound-row">
      <button type="button" className={`jbtn ${on ? "btn-bull" : ""}`} onClick={enable}>
        {on ? "🔔 Sound ON" : "🔔 Enable Sound"}
      </button>
      <button type="button" className="jbtn" onClick={test}>
        Test
      </button>
      <select
        value={String(volume)}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Alert volume"
      >
        <option value="0.15">Low</option>
        <option value="0.3">Medium</option>
        <option value="0.55">High</option>
        <option value="0.85">Max</option>
      </select>
    </div>
  );
}
