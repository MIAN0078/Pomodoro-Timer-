import { useEffect, useRef, useState } from "react";
import useLocalStorage from "./hooks/useLocalStorage";
import TimerRing from "./components/TimerRing";
import Settings from "./components/Settings";
import "./App.css";

const MODES = [
  { key: "focus", label: "Focus" },
  { key: "short", label: "Short Break" },
  { key: "long", label: "Long Break" },
];

const DEFAULT_SETTINGS = { focus: 25, short: 5, long: 15 };

// Beep sound (Web Audio API, koi file nahi chahiye)
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* sound na chale to koi masla nahi */
  }
}

export default function App() {
  const [settings, setSettings] = useLocalStorage("pomo-settings", DEFAULT_SETTINGS);
  const [sessions, setSessions] = useLocalStorage("pomo-sessions", 0);

  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(settings.focus * 60);
  const [isRunning, setIsRunning] = useState(false);

  // useRef: aisi values jo badle to re-render nahi chahiye
  const endTimeRef = useRef(null); // timer kab khatam hoga
  const toggleRef = useRef(null); // latest toggle function

  const totalSeconds = settings[mode] * 60;

  // ---------- Handlers ----------
  const toggleTimer = () => {
    if (!isRunning) {
      // start karte waqt end time yaad rakho (drift se bachne ke liye)
      endTimeRef.current = Date.now() + secondsLeft * 1000;
    }
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(settings[mode] * 60);
  };

  const changeMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setSecondsLeft(settings[newMode] * 60);
  };

  const updateSetting = (key, value) => {
    const minutes = Math.min(120, Math.max(1, Number(value) || 1));
    setSettings((prev) => ({ ...prev, [key]: minutes }));
    if (key === mode && !isRunning) setSecondsLeft(minutes * 60);
  };

  const resetSessions = () => setSessions(0);

  // Har render par latest function ref mein rakho
  toggleRef.current = toggleTimer;

  // ---------- Effect 1: Countdown (setInterval + cleanup) ----------
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      const left = Math.max(
        0,
        Math.round((endTimeRef.current - Date.now()) / 1000)
      );
      setSecondsLeft(left);
    }, 250);

    // CLEANUP: pause/unmount par interval band
    return () => clearInterval(id);
  }, [isRunning]);

  // ---------- Effect 2: Timer khatam hone par ----------
  useEffect(() => {
    if (secondsLeft !== 0) return;

    setIsRunning(false);
    beep();

    if (mode === "focus") {
      const done = sessions + 1;
      setSessions(done);
      // har 4th focus ke baad long break
      const next = done % 4 === 0 ? "long" : "short";
      setMode(next);
      setSecondsLeft(settings[next] * 60);
    } else {
      setMode("focus");
      setSecondsLeft(settings.focus * 60);
    }
  }, [secondsLeft, mode, sessions, settings, setSessions]);

  // ---------- Effect 3: Tab title mein countdown ----------
  useEffect(() => {
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const s = String(secondsLeft % 60).padStart(2, "0");
    const label = MODES.find((x) => x.key === mode).label;
    document.title = isRunning ? `${m}:${s} - ${label}` : "Pomodoro Timer";
  }, [secondsLeft, mode, isRunning]);

  // Unmount par title wapas normal
  useEffect(() => {
    return () => {
      document.title = "Pomodoro Timer";
    };
  }, []);

  // ---------- Effect 4: Space dabao to start/pause (listener + cleanup) ----------
  useEffect(() => {
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.code === "Space" && tag !== "INPUT" && tag !== "BUTTON") {
        e.preventDefault();
        toggleRef.current();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ---------- UI ----------
  return (
    <div className="app" data-mode={mode}>
      <div className="card">
        <h1>🍅 Pomodoro Timer</h1>

        <div className="tabs">
          {MODES.map((m) => (
            <button
              key={m.key}
              className={`tab ${mode === m.key ? "active" : ""}`}
              onClick={() => changeMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <TimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />

        <div className="controls">
          <button className="btn primary" onClick={toggleTimer}>
            {isRunning ? "Pause" : "Start"}
          </button>
          <button className="btn" onClick={resetTimer}>
            Reset
          </button>
        </div>

        <p className="hint">Space dabao to start / pause</p>

        <div className="sessions">
          <span>Completed sessions: <strong>{sessions}</strong></span>
          <button className="link" onClick={resetSessions}>
            clear
          </button>
        </div>

        <Settings settings={settings} onChange={updateSetting} />
      </div>
    </div>
  );
}