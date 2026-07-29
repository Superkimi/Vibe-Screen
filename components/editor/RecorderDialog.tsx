"use client";

import {
  Camera,
  Check,
  Desktop,
  Microphone,
  Pause,
  Play,
  Record,
  SpeakerHigh,
  Stop,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/project";
import { startScreenRecording, type ActiveRecording } from "@/lib/recorder";
import { useEditor } from "./EditorContext";

interface RecorderDialogProps {
  open: boolean;
  onClose: () => void;
}

export function RecorderDialog({ open, onClose }: RecorderDialogProps) {
  const { addBlob } = useEditor();
  const [microphone, setMicrophone] = useState(true);
  const [camera, setCamera] = useState(false);
  const [systemAudio, setSystemAudio] = useState(true);
  const [frameRate, setFrameRate] = useState<30 | 60>(60);
  const [status, setStatus] = useState<"setup" | "recording" | "paused" | "saving">("setup");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const active = useRef<ActiveRecording | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<number | null>(null);
  const startedAt = useRef(0);
  const pausedElapsed = useRef(0);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      active.current?.cancel();
    };
  }, []);

  if (!open) return null;

  const start = async () => {
    setError("");
    try {
      const recording = await startScreenRecording({
        microphone,
        camera,
        systemAudio,
        frameRate,
      });
      active.current = recording;
      if (previewRef.current) {
        previewRef.current.srcObject = recording.screenStream;
        await previewRef.current.play();
      }
      startedAt.current = performance.now();
      pausedElapsed.current = 0;
      setElapsed(0);
      setStatus("recording");
      timer.current = window.setInterval(() => {
        setElapsed(pausedElapsed.current + (performance.now() - startedAt.current) / 1000);
      }, 200);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Screen access was not granted. Choose a tab, window, or display and try again.",
      );
    }
  };

  const togglePause = () => {
    const recording = active.current;
    if (!recording) return;
    if (status === "recording") {
      pausedElapsed.current += (performance.now() - startedAt.current) / 1000;
      recording.pause();
      setStatus("paused");
    } else {
      recording.resume();
      startedAt.current = performance.now();
      setStatus("recording");
    }
  };

  const stop = async () => {
    const recording = active.current;
    if (!recording) return;
    setStatus("saving");
    if (timer.current) window.clearInterval(timer.current);
    try {
      const result = await recording.stop();
      await addBlob(result.screen, `Recording ${new Date().toLocaleString()}.webm`, "screen", true);
      if (result.camera) {
        await addBlob(result.camera, "Camera.webm", "camera");
      }
      active.current = null;
      setStatus("setup");
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The recording could not be saved.");
      setStatus("setup");
    }
  };

  const close = () => {
    if (status === "recording" || status === "paused") {
      active.current?.cancel();
      active.current = null;
    }
    if (timer.current) window.clearInterval(timer.current);
    setStatus("setup");
    setError("");
    onClose();
  };

  const isCapturing = status === "recording" || status === "paused";
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="recorder-dialog" role="dialog" aria-modal="true" aria-labelledby="record-title">
        <header>
          <div>
            <span className="dialog-kicker">Browser capture</span>
            <h2 id="record-title">{isCapturing ? "Recording in progress" : "Start a new recording"}</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close recorder">
            <X size={18} />
          </button>
        </header>

        {isCapturing || status === "saving" ? (
          <>
            <div className="record-preview">
              <video ref={previewRef} muted playsInline />
              <span className="recording-time">
                <i />
                {formatTime(elapsed)}
              </span>
            </div>
            <div className="capture-controls">
              <button onClick={togglePause} disabled={status === "saving"} className="secondary-button">
                {status === "paused" ? <Play size={18} weight="fill" /> : <Pause size={18} weight="fill" />}
                {status === "paused" ? "Resume" : "Pause"}
              </button>
              <button onClick={stop} disabled={status === "saving"} className="danger-button">
                <Stop size={18} weight="fill" />
                {status === "saving" ? "Preparing editor..." : "Stop recording"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="capture-source">
              <Desktop size={30} />
              <div>
                <strong>Choose after you click record</strong>
                <span>Your browser will ask for a tab, window, or display.</span>
              </div>
              <Check size={18} weight="bold" />
            </div>
            <div className="record-options">
              <ToggleOption
                icon={<Microphone size={19} />}
                label="Microphone"
                detail="Noise suppression on"
                checked={microphone}
                onChange={setMicrophone}
              />
              <ToggleOption
                icon={<SpeakerHigh size={19} />}
                label="Shared audio"
                detail="Availability depends on the selected source"
                checked={systemAudio}
                onChange={setSystemAudio}
              />
              <ToggleOption
                icon={<Camera size={19} />}
                label="Camera"
                detail="Recorded as an editable overlay"
                checked={camera}
                onChange={setCamera}
              />
            </div>
            <fieldset className="frame-rate">
              <legend>Capture frame rate</legend>
              {[30, 60].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={frameRate === value ? "active" : ""}
                  onClick={() => setFrameRate(value as 30 | 60)}
                >
                  {value} fps
                </button>
              ))}
            </fieldset>
            {error && <p className="inline-error">{error}</p>}
            <button className="primary-button record-start" onClick={start}>
              <Record size={18} weight="fill" />
              Choose screen and record
            </button>
            <p className="privacy-note">Media stays on this device. Nothing is uploaded by Vibe Screen.</p>
          </>
        )}
      </section>
    </div>
  );
}

function ToggleOption({
  icon,
  label,
  detail,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-option">
      <span className="option-icon">{icon}</span>
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}
