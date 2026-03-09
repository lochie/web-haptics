import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./styles.module.scss";

// ─── Types ────────────────────────────────────────────────────────────────────

type LogType = "info" | "event" | "vibrate" | "section" | "warn" | "error";
type LogEntry = { ts: string; msg: string; type: LogType };
type LogFn = (msg: string, type?: LogType) => void;
type TestFn = (log: LogFn) => Promise<void>;
type TestDef = { id: string; label: string; description?: string; fn: TestFn };
type Section = { id: string; title: string; tests: TestDef[] };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ts() {
  const d = new Date();
  return `${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

type ElOptions = {
  useSwitch?: boolean;
  labelStyle?: Partial<CSSStyleDeclaration>;
  checkboxStyle?: Partial<CSSStyleDeclaration>;
  startChecked?: boolean;
};

function createEl(opts: ElOptions = {}) {
  const { useSwitch = true, labelStyle = {}, checkboxStyle = {}, startChecked = false } = opts;
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  if (useSwitch) checkbox.setAttribute("switch", "");
  checkbox.checked = startChecked;
  Object.assign(label.style, {
    position: "fixed",
    bottom: "240px",
    right: "16px",
    zIndex: "9999999",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    ...labelStyle,
  });
  Object.assign(checkbox.style, checkboxStyle);
  label.appendChild(checkbox);
  document.body.appendChild(label);
  return { label, checkbox, cleanup: () => label.remove() };
}

function attachListeners(
  { label, checkbox }: { label: HTMLElement; checkbox: HTMLInputElement },
  log: LogFn,
) {
  const evs = ["click", "change", "input", "pointerdown", "pointerup"];
  evs.forEach((ev) => {
    label.addEventListener(ev, () => log(`  label:${ev}`, "event"), { passive: true });
    checkbox.addEventListener(
      ev,
      () => log(`  cb:${ev} checked=${checkbox.checked}`, "event"),
      { passive: true },
    );
  });
}

function doVibrate(log: LogFn, pattern: number[]) {
  if (typeof navigator.vibrate !== "function") {
    log("  navigator.vibrate: not supported", "warn");
    return;
  }
  const result = navigator.vibrate(pattern);
  log(`  navigator.vibrate(${JSON.stringify(pattern)}) → ${result}`, "vibrate");
}

// ─── Test definitions ─────────────────────────────────────────────────────────

function visSwitchTest(style: Partial<CSSStyleDeclaration>, desc: string): TestFn {
  return async (log) => {
    const { label, checkbox, cleanup } = createEl({ useSwitch: true });
    Object.assign(label.style, style);
    attachListeners({ label, checkbox }, log);
    log(`  hiding via: ${desc}`, "warn");
    label.click();
    doVibrate(log, [30]);
    await delay(100);
    cleanup();
  };
}

const SECTIONS: Section[] = [
  {
    id: "baseline",
    title: "1 — Baseline",
    tests: [
      {
        id: "b1", label: "Regular checkbox — label.click()", description: "Current approach (no switch attr)",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: false });
          attachListeners({ label, checkbox }, log);
          label.click(); doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "b2", label: "Switch checkbox — label.click()", description: "Library's actual approach",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          label.click(); doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "b3", label: "Regular checkbox — checkbox.click()", description: "Click the input directly",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: false });
          attachListeners({ label, checkbox }, log);
          checkbox.click(); doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "b4", label: "Switch checkbox — checkbox.click()", description: "Click the input directly",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          checkbox.click(); doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
    ],
  },
  {
    id: "native",
    title: "2 — Native Haptic (no vibrate API)",
    tests: [
      {
        id: "n1", label: "Switch, visible — label.click(), NO vibrate", description: "Does iOS fire native haptic without vibrate()?",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({
            useSwitch: true,
            labelStyle: { bottom: "260px", background: "#222", padding: "8px", borderRadius: "8px" },
          });
          attachListeners({ label, checkbox }, log);
          label.click();
          log("  (no navigator.vibrate call)", "warn");
          await delay(200); cleanup();
        },
      },
      {
        id: "n2", label: "Switch, visible — checkbox.click(), NO vibrate",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({
            useSwitch: true,
            labelStyle: { bottom: "260px", background: "#222", padding: "8px", borderRadius: "8px" },
          });
          attachListeners({ label, checkbox }, log);
          checkbox.click();
          log("  (no navigator.vibrate call)", "warn");
          await delay(200); cleanup();
        },
      },
      {
        id: "n3", label: "Regular, visible — label.click(), NO vibrate", description: "Control: no switch, no vibrate",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({
            useSwitch: false,
            labelStyle: { bottom: "260px", background: "#222", padding: "8px", borderRadius: "8px" },
          });
          attachListeners({ label, checkbox }, log);
          label.click();
          log("  (no navigator.vibrate call)", "warn");
          await delay(200); cleanup();
        },
      },
    ],
  },
  {
    id: "visibility",
    title: "3 — Visibility Variants",
    tests: [
      { id: "v1", label: "display: none", fn: visSwitchTest({ display: "none" }, "display:none") },
      { id: "v2", label: "visibility: hidden", fn: visSwitchTest({ visibility: "hidden" }, "visibility:hidden") },
      { id: "v3", label: "opacity: 0", fn: visSwitchTest({ opacity: "0" }, "opacity:0") },
      { id: "v4", label: "clip-path: inset(100%)", fn: visSwitchTest({ clipPath: "inset(100%)" }, "clip-path:inset(100%)") },
      { id: "v5", label: "position fixed offscreen (top: -9999px)", fn: visSwitchTest({ top: "-9999px", bottom: "auto" }, "top:-9999px") },
      { id: "v6", label: "transform: scale(0)", fn: visSwitchTest({ transform: "scale(0)" }, "scale(0)") },
      { id: "v7", label: "width:0 height:0 overflow:hidden", fn: visSwitchTest({ width: "0", height: "0", overflow: "hidden", padding: "0" }, "w:0 h:0") },
      {
        id: "v8", label: "pointer-events: none on label", description: "Checkbox clicked directly",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          label.style.pointerEvents = "none";
          attachListeners({ label, checkbox }, log);
          checkbox.click(); doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
    ],
  },
  {
    id: "events",
    title: "4 — Event Dispatch Method",
    tests: [
      {
        id: "e2", label: "MouseEvent('click') — bubbles:true",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          label.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
          doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "e3", label: "MouseEvent('click') — bubbles:false",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          label.dispatchEvent(new MouseEvent("click", { bubbles: false, cancelable: true }));
          doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "e4", label: "PointerEvent('click') on label",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          label.dispatchEvent(new PointerEvent("click", { bubbles: true, cancelable: true }));
          doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "e5", label: "PointerEvent('pointerdown') on label",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          label.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
          doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "e7", label: "change event dispatch on checkbox",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
          doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
    ],
  },
  {
    id: "timing",
    title: "5 — Timing (gesture context)",
    tests: [
      {
        id: "t1", label: "Synchronous (same call stack)",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          label.click(); doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "t2", label: "setTimeout(fn, 0)",
        fn: (log) => new Promise((resolve) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          setTimeout(() => {
            log("  (inside setTimeout 0)", "warn");
            label.click(); doVibrate(log, [30]);
            setTimeout(() => { cleanup(); resolve(); }, 100);
          }, 0);
        }),
      },
      {
        id: "t3", label: "setTimeout(fn, 50)",
        fn: (log) => new Promise((resolve) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          setTimeout(() => {
            log("  (inside setTimeout 50ms)", "warn");
            label.click(); doVibrate(log, [30]);
            setTimeout(() => { cleanup(); resolve(); }, 100);
          }, 50);
        }),
      },
      {
        id: "t4", label: "setTimeout(fn, 500)", description: "Should break gesture context",
        fn: (log) => new Promise((resolve) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          log("  (waiting 500ms...)", "warn");
          setTimeout(() => {
            log("  (inside setTimeout 500ms)", "warn");
            label.click(); doVibrate(log, [30]);
            setTimeout(() => { cleanup(); resolve(); }, 100);
          }, 500);
        }),
      },
      {
        id: "t5", label: "requestAnimationFrame",
        fn: (log) => new Promise((resolve) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          requestAnimationFrame(() => {
            log("  (inside rAF 1)", "warn");
            label.click(); doVibrate(log, [30]);
            setTimeout(() => { cleanup(); resolve(); }, 100);
          });
        }),
      },
      {
        id: "t6", label: "rAF → rAF (2 frames)",
        fn: (log) => new Promise((resolve) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              log("  (inside rAF 2)", "warn");
              label.click(); doVibrate(log, [30]);
              setTimeout(() => { cleanup(); resolve(); }, 100);
            });
          });
        }),
      },
    ],
  },
  {
    id: "state",
    title: "6 — Checked State",
    tests: [
      {
        id: "s1", label: "Toggle unchecked → checked",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true, startChecked: false });
          attachListeners({ label, checkbox }, log);
          log(`  before: checked=${checkbox.checked}`, "warn");
          label.click(); doVibrate(log, [30]);
          log(`  after: checked=${checkbox.checked}`, "warn");
          await delay(100); cleanup();
        },
      },
      {
        id: "s2", label: "Toggle checked → unchecked",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true, startChecked: true });
          attachListeners({ label, checkbox }, log);
          log(`  before: checked=${checkbox.checked}`, "warn");
          label.click(); doVibrate(log, [30]);
          log(`  after: checked=${checkbox.checked}`, "warn");
          await delay(100); cleanup();
        },
      },
      {
        id: "s3", label: "Rapid toggle ×5 (10ms apart)",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          for (let i = 0; i < 5; i++) {
            label.click();
            log(`  click ${i + 1}: checked=${checkbox.checked}`, "warn");
            await delay(10);
          }
          await delay(100); cleanup();
        },
      },
      {
        id: "s4", label: "Rapid toggle ×10 (20ms apart)",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          for (let i = 0; i < 10; i++) {
            label.click();
            log(`  click ${i + 1}: checked=${checkbox.checked}`, "warn");
            await delay(20);
          }
          await delay(100); cleanup();
        },
      },
      {
        id: "s5", label: "Reset checked=false before each click", description: "Avoid state latching",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          for (let i = 0; i < 5; i++) {
            checkbox.checked = false;
            label.click();
            log(`  click ${i + 1}: checked=${checkbox.checked}`, "warn");
            await delay(30);
          }
          await delay(100); cleanup();
        },
      },
    ],
  },
  {
    id: "switchattr",
    title: "7 — Switch Attribute Variants",
    tests: [
      {
        id: "sw1", label: 'switch="" (setAttribute)',
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: false });
          checkbox.setAttribute("switch", "");
          log(`  switch attr: "${checkbox.getAttribute("switch")}"`, "warn");
          label.click(); doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "sw2", label: "no switch attr (control)",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: false });
          log(`  switch present: ${checkbox.hasAttribute("switch")}`, "warn");
          label.click(); doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "sw3", label: "appearance: auto only (no switch attr)", description: "Does appearance alone matter?",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: false });
          (checkbox.style as CSSStyleDeclaration & { webkitAppearance: string }).webkitAppearance = "auto";
          checkbox.style.appearance = "auto";
          log(`  switch present: ${checkbox.hasAttribute("switch")}`, "warn");
          label.click(); doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
      {
        id: "sw4", label: "switch + style='all: initial'",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          checkbox.style.all = "initial";
          checkbox.style.appearance = "auto";
          label.click(); doVibrate(log, [30]);
          await delay(100); cleanup();
        },
      },
    ],
  },
  {
    id: "patterns",
    title: "8 — Pattern Playback (switch only)",
    tests: [
      {
        id: "p1", label: "Success pattern via switch clicks (no vibrate)", description: "2-tap: 60ms gap",
        fn: async (log) => {
          const { label, cleanup } = createEl({ useSwitch: true });
          log("  tap 1", "warn"); label.click();
          await delay(60);
          log("  tap 2", "warn"); label.click();
          log("  done (no vibrate)", "warn");
          await delay(200); cleanup();
        },
      },
      {
        id: "p2", label: "Error pattern via switch clicks (no vibrate)", description: "3 rapid clicks",
        fn: async (log) => {
          const { label, cleanup } = createEl({ useSwitch: true });
          label.click(); await delay(40);
          label.click(); await delay(40);
          label.click();
          log("  done (no vibrate)", "warn");
          await delay(200); cleanup();
        },
      },
      {
        id: "p3", label: "Selection — 1 quick click (no vibrate)",
        fn: async (log) => {
          const { label, cleanup } = createEl({ useSwitch: true });
          label.click();
          log("  done (no vibrate)", "warn");
          await delay(200); cleanup();
        },
      },
      {
        id: "p4", label: "Switch click + navigator.vibrate() simultaneously",
        fn: async (log) => {
          const { label, checkbox, cleanup } = createEl({ useSwitch: true });
          attachListeners({ label, checkbox }, log);
          label.click();
          doVibrate(log, [30, 60, 40]);
          await delay(200); cleanup();
        },
      },
    ],
  },
];

// ─── Gesture Lease demos ──────────────────────────────────────────────────────

function GestureLeaseSection({ log }: { log: LogFn }) {
  // Shared haptic checkbox (persistent, not per-test)
  const hapticCbRef = useRef<HTMLInputElement | null>(null);

  function ensureHapticCb() {
    if (hapticCbRef.current) return hapticCbRef.current;
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.setAttribute("switch", "");
    cb.style.cssText = "position:fixed;opacity:0;pointer-events:none;top:-200px;";
    document.body.appendChild(cb);
    hapticCbRef.current = cb;
    return cb;
  }

  function fireHaptic() {
    ensureHapticCb().click();
  }

  useEffect(() => {
    return () => {
      hapticCbRef.current?.remove();
      hapticCbRef.current = null;
    };
  }, []);

  // Gesture tracking (shared across demos)
  const gestureActiveRef = useRef(false);
  const gestureEndTimeRef = useRef(0);
  const [gestureActive, setGestureActiveState] = useState(false);

  useEffect(() => {
    const onStart = () => { gestureActiveRef.current = true; setGestureActiveState(true); };
    const onEnd = () => { gestureActiveRef.current = false; gestureEndTimeRef.current = performance.now(); setGestureActiveState(false); };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  // ── Demo 1: Standard tap ────────────────────────────────────────────────────

  // ── Demo 2: Hold pad (gesture lease via rAF loop) ──────────────────────────

  const [leaseCount, setLeaseCount] = useState(0);
  const [holdActive, setHoldActive] = useState(false);
  const hapticQueueRef = useRef(0);
  const rafLoopRef = useRef<number | null>(null);
  const leaseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const leaseCountRef = useRef(0);
  const holdPadRef = useRef<HTMLDivElement>(null);

  function startRafLoop() {
    if (rafLoopRef.current) return;
    const loop = () => {
      if (hapticQueueRef.current > 0) {
        hapticQueueRef.current--;
        fireHaptic();
        leaseCountRef.current++;
        setLeaseCount(leaseCountRef.current);
        log(`  lease haptic #${leaseCountRef.current} fired (via rAF)`, "vibrate");
      }
      if (gestureActiveRef.current || hapticQueueRef.current > 0) {
        rafLoopRef.current = requestAnimationFrame(loop);
      } else {
        rafLoopRef.current = null;
      }
    };
    rafLoopRef.current = requestAnimationFrame(loop);
  }

  useEffect(() => {
    const pad = holdPadRef.current;
    if (!pad) return;

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      setHoldActive(true);
      leaseCountRef.current = 0;
      setLeaseCount(0);
      log("  touchstart — starting gesture lease rAF loop", "warn");
      startRafLoop();
      leaseIntervalRef.current = setInterval(() => {
        hapticQueueRef.current++;
      }, 300);
    };

    const onEnd = () => {
      setHoldActive(false);
      if (leaseIntervalRef.current) {
        clearInterval(leaseIntervalRef.current);
        leaseIntervalRef.current = null;
      }
      log("  touchend — lease released", "warn");
    };

    pad.addEventListener("touchstart", onStart, { passive: false });
    pad.addEventListener("touchend", onEnd, { passive: true });
    pad.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      pad.removeEventListener("touchstart", onStart);
      pad.removeEventListener("touchend", onEnd);
      pad.removeEventListener("touchcancel", onEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log]);

  // ── Demo 3: Drag threshold ─────────────────────────────────────────────────

  const [dragPct, setDragPct] = useState(50);
  const lastThresholdRef = useRef(5);
  const dragStripRef = useRef<HTMLDivElement>(null);

  function updateDrag(clientX: number, rect: DOMRect) {
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setDragPct(pct);
    const bucket = Math.round(pct / 10);
    if (bucket !== lastThresholdRef.current) {
      lastThresholdRef.current = bucket;
      hapticQueueRef.current++;
      startRafLoop();
      log(`  threshold crossed → ${bucket * 10}%`, "vibrate");
    }
  }

  const dragActiveRef = useRef(false);

  // ── Demo 4: Grace window ───────────────────────────────────────────────────

  function testGrace(delayMs: number) {
    log(`▶ Grace window: firing after ${delayMs}ms`, "section");
    setTimeout(() => {
      const sinceTouchEnd = gestureActiveRef.current
        ? 0
        : Math.round(performance.now() - gestureEndTimeRef.current);
      fireHaptic();
      if (gestureActiveRef.current) {
        log(`  ⚡ fired (gesture still active)`, "vibrate");
      } else {
        log(`  ⚡ fired ${sinceTouchEnd}ms after touchend — feel it?`, "warn");
      }
    }, delayMs);
  }

  // ── Demo 5: Pure async ─────────────────────────────────────────────────────

  function testPureAsync() {
    log("▶ Pure async: firing in 2s (no gesture)", "section");
    setTimeout(() => {
      fireHaptic();
      log("  ⚡ fired at 2s — no gesture at all — feel it?", "warn");
    }, 2000);
  }

  return (
    <>
      {/* Demo 1: standard tap */}
      <div className={styles.testRow}>
        <div className={styles.testLabel}>
          Standard tap — fireHaptic() in onClick
          <small>switch checkbox .click() synchronously in handler</small>
        </div>
        <button
          className={styles.testBtn}
          onClick={() => {
            log("▶ Standard tap", "section");
            fireHaptic();
            log("  fireHaptic() called", "vibrate");
          }}
        >
          Tap
        </button>
      </div>

      {/* Demo 2: hold pad */}
      <div className={styles.demoRow}>
        <div className={styles.testLabel}>
          Gesture lease — hold pad
          <small>
            setInterval enqueues haptics every 300ms; rAF loop drains them
            while gesture is active. The click never touches the interval.
          </small>
        </div>
        <div className={styles.demoContent}>
          <div
            ref={holdPadRef}
            className={`${styles.holdPad} ${holdActive ? styles.holdPadActive : ""}`}
          >
            {holdActive ? `Releasing… (${leaseCount})` : "Hold me"}
          </div>
          <div className={styles.gestureStatus}>
            <span
              className={`${styles.gestureDot} ${gestureActive ? styles.gestureDotActive : ""}`}
            />
            <span>{gestureActive ? "Gesture active" : "No gesture"}</span>
          </div>
        </div>
      </div>

      {/* Demo 3: drag threshold */}
      <div className={styles.demoRow}>
        <div className={styles.testLabel}>
          Drag threshold
          <small>Haptic fires each time you cross a 10% threshold — triggered by position logic, not the drag event.</small>
        </div>
        <div className={styles.demoContent}>
          <div
            ref={dragStripRef}
            className={styles.dragStrip}
            onTouchStart={(e) => {
              dragActiveRef.current = true;
              const rect = dragStripRef.current!.getBoundingClientRect();
              updateDrag(e.touches[0].clientX, rect);
              startRafLoop();
            }}
            onTouchMove={(e) => {
              if (!dragActiveRef.current) return;
              const rect = dragStripRef.current!.getBoundingClientRect();
              updateDrag(e.touches[0].clientX, rect);
            }}
            onTouchEnd={() => { dragActiveRef.current = false; }}
          >
            <div className={styles.dragFill} style={{ width: `${dragPct}%` }} />
            <div className={styles.dragThumb} style={{ left: `${dragPct}%` }} />
            <span className={styles.dragValue}>{Math.round(dragPct)}%</span>
          </div>
        </div>
      </div>

      {/* Demo 4: grace window */}
      <div className={styles.demoRow}>
        <div className={styles.testLabel}>
          Post-gesture grace window
          <small>Tap a delay — fires haptic that many ms after touchend. Tests how long the gesture window stays open.</small>
        </div>
        <div className={styles.demoContent}>
          <div className={styles.graceRow}>
            {[0, 100, 300, 1000].map((ms) => (
              <button key={ms} className={styles.graceBtn} onClick={() => testGrace(ms)}>
                {ms}ms
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo 5: pure async */}
      <div className={styles.testRow}>
        <div className={styles.testLabel}>
          Pure async — no gesture at all
          <small>Fires haptic 2s after tap — no touch context whatsoever. Should fail on iOS.</small>
        </div>
        <button className={styles.testBtn} onClick={testPureAsync}>
          Start
        </button>
      </div>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Lab() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const running = useRef(false);

  const log = useCallback((msg: string, type: LogType = "info") => {
    setLogs((prev) => [...prev, { ts: ts(), msg, type }]);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const runTest = useCallback(
    async (test: TestDef) => {
      if (running.current) return;
      running.current = true;
      log(`▶ ${test.label}`, "section");
      try {
        await test.fn(log);
        log("  ✓ done", "vibrate");
      } catch (e) {
        log(`  ✗ ${(e as Error).message}`, "error");
      }
      log("");
      running.current = false;
    },
    [log],
  );

  const runAll = useCallback(async () => {
    if (running.current) return;
    log("═══ RUN ALL ═══", "section");
    for (const section of SECTIONS) {
      for (const test of section.tests) {
        await runTest(test);
        await delay(300);
      }
    }
    log("═══ COMPLETE ═══", "section");
  }, [log, runTest]);

  const hasVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  return (
    <>
      <button className={styles.trigger} onClick={() => setOpen(true)} aria-label="Open haptic lab">
        Lab
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.overlay}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <span className={styles.headerTitle}>Haptic Lab</span>
                <span className={`${styles.cap} ${hasVibrate ? styles.capYes : styles.capNo}`}>
                  vibrate: {hasVibrate ? "yes" : "no"}
                </span>
                <span className={`${styles.cap} ${isIOS ? styles.capYes : styles.capUnk}`}>
                  {isIOS ? "iOS" : "not iOS"}
                </span>
              </div>
              <div className={styles.headerRight}>
                <button className={styles.headerBtn} onClick={runAll}>All</button>
                <button className={styles.headerBtn} onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className={styles.body}>
              {SECTIONS.map((section) => (
                <div key={section.id}>
                  <div className={styles.sectionLabel}>{section.title}</div>
                  {section.tests.map((test) => (
                    <div key={test.id} className={styles.testRow}>
                      <div className={styles.testLabel}>
                        {test.label}
                        {test.description && <small>{test.description}</small>}
                      </div>
                      <button className={styles.testBtn} onClick={() => runTest(test)}>
                        Test
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              {/* Gesture lease section */}
              <div>
                <div className={styles.sectionLabel}>9 — Gesture Lease</div>
                <GestureLeaseSection log={log} />
              </div>

              <div style={{ height: "1rem" }} />
            </div>

            {/* Log panel */}
            <div className={styles.logPanel}>
              <div className={styles.logToolbar}>
                <span className={styles.logLabel}>LOG</span>
                <button className={styles.headerBtn} onClick={() => setLogs([])}>Clear</button>
              </div>
              <div className={styles.logScroll} ref={logRef}>
                {logs.length === 0 && (
                  <span className={styles.logEmpty}>Tap a test to begin</span>
                )}
                {logs.map((entry, i) => (
                  <div key={i} className={styles.logEntry}>
                    <span className={styles.logTs}>{entry.ts}</span>
                    <span className={`${styles.logMsg} ${styles[`log_${entry.type}`]}`}>
                      {entry.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
