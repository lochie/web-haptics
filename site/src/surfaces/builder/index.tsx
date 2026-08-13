import { useReducer, useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { defaultPatterns } from "web-haptics";
import type { HapticPreset, Vibration } from "web-haptics";

import styles from "./styles.module.scss";
import { useHaptics } from "../../hooks/useHaptics";
import { useClickOutside } from "../../hooks/useClickOutside";
import { CodeBlock } from "../../components/codeblock";
import { HorizontalScroll } from "../../components/horizontal-scroll";

// --- Types ---

interface Tap {
  id: string;
  position: number;
  duration: number;
  intensity: number;
}

interface BuilderState {
  taps: Tap[];
  selectedId: string | null;
}

type BuilderAction =
  | { type: "ADD_TAP"; position: number }
  | { type: "SELECT_TAP"; id: string | null }
  | { type: "MOVE_TAP"; id: string; position: number }
  | { type: "SET_DURATION"; id: string; duration: number }
  | { type: "RESIZE_LEFT"; id: string; position: number }
  | { type: "REMOVE_TAP"; id: string }
  | { type: "SET_TAP_INTENSITY"; id: string; intensity: number }
  | { type: "LOAD_PRESET"; taps: Tap[] };

// --- Helpers ---

let nextId = 100;
const genId = () => String(nextId++);
const snap = (v: number) => Math.round(v / 10) * 10;

function getNeighborBounds(
  taps: Tap[],
  id: string,
): { minPos: number; maxEnd: number } {
  const sorted = [...taps].sort((a, b) => a.position - b.position);
  const idx = sorted.findIndex((t) => t.id === id);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  return {
    minPos: prev ? prev.position + prev.duration : 0,
    maxEnd: next ? next.position : 1000,
  };
}

function canFitTap(taps: Tap[], position: number, duration: number): boolean {
  for (const tap of taps) {
    const tapEnd = tap.position + tap.duration;
    const newEnd = position + duration;
    if (position < tapEnd && newEnd > tap.position) return false;
  }
  return position >= 0 && position + duration <= 1000;
}

function tapsToPattern(taps: Tap[]): Vibration[] {
  if (taps.length === 0) return [];
  const sorted = [...taps].sort((a, b) => a.position - b.position);
  return sorted.map((tap, i) => {
    const prev = sorted[i - 1];
    const delay = prev
      ? tap.position - (prev.position + prev.duration)
      : tap.position;
    return {
      ...(delay > 0 && { delay }),
      duration: tap.duration,
      intensity: tap.intensity,
    };
  });
}

function patternToTaps(vibs: Vibration[], defaultIntensity = 0.5): Tap[] {
  let cursor = 0;
  return vibs.map((v) => {
    cursor += v.delay ?? 0;
    const tap: Tap = {
      id: genId(),
      position: cursor,
      duration: v.duration,
      intensity: v.intensity ?? defaultIntensity,
    };
    cursor += v.duration;
    return tap;
  });
}

// --- Reducer ---

const DEFAULT_DURATION = 50;

const initialState: BuilderState = {
  taps: patternToTaps(defaultPatterns.success.pattern),
  selectedId: null,
};

function reducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "ADD_TAP": {
      const snapped = snap(
        Math.max(0, Math.min(1000 - DEFAULT_DURATION, action.position)),
      );
      if (!canFitTap(state.taps, snapped, DEFAULT_DURATION)) return state;
      const newTap: Tap = {
        id: genId(),
        position: snapped,
        duration: DEFAULT_DURATION,
        intensity: 0.5,
      };
      return {
        ...state,
        taps: [...state.taps, newTap],
        selectedId: newTap.id,
      };
    }

    case "SELECT_TAP":
      return { ...state, selectedId: action.id };

    case "MOVE_TAP": {
      const tap = state.taps.find((t) => t.id === action.id);
      if (!tap) return state;
      const bounds = getNeighborBounds(state.taps, action.id);
      const clamped = snap(
        Math.max(
          bounds.minPos,
          Math.min(bounds.maxEnd - tap.duration, action.position),
        ),
      );
      return {
        ...state,
        taps: state.taps.map((t) =>
          t.id === action.id ? { ...t, position: clamped } : t,
        ),
      };
    }

    case "SET_DURATION": {
      const tap = state.taps.find((t) => t.id === action.id);
      if (!tap) return state;
      const bounds = getNeighborBounds(state.taps, action.id);
      const maxDur = bounds.maxEnd - tap.position;
      const dur = Math.max(10, Math.min(maxDur, action.duration));
      return {
        ...state,
        taps: state.taps.map((t) =>
          t.id === action.id ? { ...t, duration: dur } : t,
        ),
      };
    }

    case "RESIZE_LEFT": {
      const tap = state.taps.find((t) => t.id === action.id);
      if (!tap) return state;
      const bounds = getNeighborBounds(state.taps, action.id);
      const newPos = snap(
        Math.max(
          bounds.minPos,
          Math.min(tap.position + tap.duration - 10, action.position),
        ),
      );
      const newDur = tap.position + tap.duration - newPos;
      return {
        ...state,
        taps: state.taps.map((t) =>
          t.id === action.id ? { ...t, position: newPos, duration: newDur } : t,
        ),
      };
    }

    case "REMOVE_TAP":
      return {
        ...state,
        taps: state.taps.filter((t) => t.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };

    case "SET_TAP_INTENSITY":
      return {
        ...state,
        taps: state.taps.map((t) =>
          t.id === action.id
            ? { ...t, intensity: Math.max(0, Math.min(1, action.intensity)) }
            : t,
        ),
      };

    case "LOAD_PRESET":
      return { taps: action.taps, selectedId: null };

    default:
      return state;
  }
}

// --- Constants ---

const GRIDLINES = Array.from({ length: 19 }, (_, i) => (i + 1) * 50); // 50, 100, ... 950
const LABELS = Array.from({ length: 11 }, (_, i) => i * 100);
const presets = Object.entries(defaultPatterns) as [string, HapticPreset][];

// --- Delete threshold (distance outside timeline bounds) ---

const DELETE_THRESHOLD = 20; // px beyond timeline edge

// --- Code generation ---

function generateCode(vibs: Vibration[]): string {
  if (vibs.length === 0) return "trigger()";

  const intensities = vibs.map((v) => v.intensity ?? 0.5);
  const allSame = intensities.every((v) => v === intensities[0]);

  const formatVib = (v: Vibration, showIntensity: boolean) => {
    const parts: string[] = [];
    if (v.delay && v.delay > 0) {
      parts.push(`delay: ${v.delay}`);
    }
    parts.push(`duration: ${v.duration}`);
    if (showIntensity && (v.intensity ?? 0.5) !== 0.5) {
      parts.push(`intensity: ${v.intensity}`);
    }
    return `{ ${parts.join(", ")} }`;
  };

  if (allSame && intensities[0] === 0.5) {
    // All default intensity — omit intensity everywhere
    const items = vibs.map((v) => formatVib(v, false));
    return `trigger([\n  ${items.join(",\n  ")},\n])`;
  }

  if (allSame) {
    // All same non-default — use TriggerOptions
    const items = vibs.map((v) => formatVib(v, false));
    return `trigger([\n  ${items.join(",\n  ")},\n], { intensity: ${intensities[0]} })`;
  }

  // Mixed — per-vibration intensity
  const items = vibs.map((v) => formatVib(v, true));
  return `trigger([\n  ${items.join(",\n  ")},\n])`;
}

// --- Component ---

export const HapticBuilder = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { trigger } = useHaptics();
  const timelineRef = useRef<HTMLDivElement>(null);
  const { ref: builderRef } = useClickOutside<HTMLDivElement>(() => {
    dispatch({ type: "SELECT_TAP", id: null });
  });
  const [playing, setPlaying] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteIdRef = useRef<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTapIds, setActiveTapIds] = useState<Set<string>>(new Set());
  const [playCount, setPlayCount] = useState(0);
  const timeoutsRef = useRef<number[]>([]);

  const pattern = tapsToPattern(state.taps);
  const totalDuration = state.taps.length
    ? Math.max(...state.taps.map((t) => t.position + t.duration))
    : 0;

  const activePreset = presets.find(([, p]) => {
    if (p.pattern.length !== pattern.length) return false;
    return p.pattern.every((v, i) => {
      const pv = pattern[i];
      if (!pv) return false;
      return (
        v.duration === pv.duration &&
        (v.intensity ?? 0.5) === (pv.intensity ?? 0.5) &&
        (v.delay ?? 0) === (pv.delay ?? 0)
      );
    });
  })?.[0];

  // Click empty timeline to add
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;
      const position = ((e.clientX - rect.left) / rect.width) * 1000;
      dispatch({ type: "ADD_TAP", position });
      trigger();
    },
    [trigger],
  );

  // Drag circle to move (or drag outside to delete)
  const handleDragStart = useCallback(
    (e: React.PointerEvent, tapId: string) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: "SELECT_TAP", id: tapId });

      const container = timelineRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      // Offset between cursor and tap position so dragging doesn't snap
      const cursorMs = ((e.clientX - rect.left) / rect.width) * 1000;
      const tap = state.taps.find((t) => t.id === tapId);
      const offsetMs = tap ? cursorMs - tap.position : 0;
      let currentPosition = tap?.position ?? 0;

      // Grab offset so delete-drag doesn't snap circle to cursor
      const initialTapScreenX =
        rect.left + ((tap?.position ?? 0) / 1000) * rect.width;
      const initialTapScreenY = rect.top + rect.height / 2;
      const grabOffsetX = e.clientX - initialTapScreenX;
      const grabOffsetY = e.clientY - initialTapScreenY;

      const onMove = (me: PointerEvent) => {
        // Distance from timeline bounds in each direction
        const distLeft = rect.left - me.clientX;
        const distRight = me.clientX - rect.right;
        const distTop = rect.top - me.clientY;
        const distBottom = me.clientY - rect.bottom;
        const maxDist = Math.max(distLeft, distRight, distTop, distBottom);

        if (maxDist > DELETE_THRESHOLD) {
          // Delete mode — tap follows cursor, maintaining grab offset
          setPendingDeleteId(tapId);
          pendingDeleteIdRef.current = tapId;
          const tapHomeX = rect.left + (currentPosition / 1000) * rect.width;
          const tapHomeY = rect.top + rect.height / 2;
          setDragOffset({
            x: me.clientX - grabOffsetX - tapHomeX,
            y: me.clientY - grabOffsetY - tapHomeY,
          });
        } else {
          // Normal mode — reposition horizontally
          setPendingDeleteId(null);
          pendingDeleteIdRef.current = null;
          setDragOffset({ x: 0, y: 0 });
          const position =
            ((me.clientX - rect.left) / rect.width) * 1000 - offsetMs;
          dispatch({ type: "MOVE_TAP", id: tapId, position });
          currentPosition = snap(Math.max(0, Math.min(1000, position)));
        }
      };
      const onUp = () => {
        if (pendingDeleteIdRef.current === tapId) {
          dispatch({ type: "REMOVE_TAP", id: tapId });
          trigger();
        }
        setPendingDeleteId(null);
        pendingDeleteIdRef.current = null;
        setDragOffset({ x: 0, y: 0 });
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [state.taps, trigger],
  );

  // Drag resize handle
  const handleResizeStart = useCallback(
    (e: React.PointerEvent, tapId: string) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: "SELECT_TAP", id: tapId });

      const container = timelineRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      const onMove = (me: PointerEvent) => {
        const tap = state.taps.find((t) => t.id === tapId);
        if (!tap) return;
        const msAtCursor = ((me.clientX - rect.left) / rect.width) * 1000;
        const newDuration = snap(Math.max(10, msAtCursor - tap.position));
        dispatch({ type: "SET_DURATION", id: tapId, duration: newDuration });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [state.taps],
  );

  // Drag left resize handle
  const handleResizeLeftStart = useCallback(
    (e: React.PointerEvent, tapId: string) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: "SELECT_TAP", id: tapId });

      const container = timelineRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      const onMove = (me: PointerEvent) => {
        const msAtCursor = ((me.clientX - rect.left) / rect.width) * 1000;
        dispatch({ type: "RESIZE_LEFT", id: tapId, position: msAtCursor });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [],
  );

  // Drag intensity from top/bottom edges
  const handleIntensityDragStart = useCallback(
    (e: React.PointerEvent, tapId: string, edge: "top" | "bottom") => {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: "SELECT_TAP", id: tapId });

      const container = timelineRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      const onMove = (me: PointerEvent) => {
        // Map cursor to inset from the dragged edge, then derive intensity
        const distFromEdge =
          edge === "top"
            ? (me.clientY - rect.top) / rect.height
            : (rect.bottom - me.clientY) / rect.height;
        const intensity =
          Math.round(Math.max(0, Math.min(1, 1 - distFromEdge * 2)) * 100) /
          100;
        dispatch({ type: "SET_TAP_INTENSITY", id: tapId, intensity });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [],
  );

  // Playback
  const handlePlay = useCallback(() => {
    if (state.taps.length === 0) return;

    // Reset any in-progress playback
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Immediately activate taps at position 0 to avoid setTimeout race
    const immediate = new Set(
      state.taps.filter((t) => t.position === 0).map((t) => t.id),
    );
    setActiveTapIds(immediate);

    const pat = tapsToPattern(state.taps);
    trigger(pat);
    setPlaying(true);
    setPlayCount((c) => c + 1);

    for (const tap of state.taps) {
      if (tap.position > 0) {
        timeoutsRef.current.push(
          window.setTimeout(
            () => setActiveTapIds((prev) => new Set(prev).add(tap.id)),
            tap.position,
          ),
        );
      }
      timeoutsRef.current.push(
        window.setTimeout(() => {
          setActiveTapIds((prev) => {
            const next = new Set(prev);
            next.delete(tap.id);
            return next;
          });
        }, tap.position + tap.duration),
      );
    }

    const end = Math.max(...state.taps.map((t) => t.position + t.duration));
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setPlaying(false);
        setActiveTapIds(new Set());
      }, end),
    );
  }, [state.taps, trigger]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedId) {
        e.preventDefault();
        dispatch({ type: "REMOVE_TAP", id: state.selectedId });
        trigger();
      }
      if (e.key === " " && state.taps.length > 0) {
        e.preventDefault();
        handlePlay();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.selectedId, state.taps.length, trigger, handlePlay]);

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  const code = generateCode(pattern);

  return (
    <div ref={builderRef} className={styles.builder}>
      <div className={styles.header}>
        <HorizontalScroll>
          {/* Presets */}
          <div className={styles.presets}>
            {presets.map(([name, preset]) => (
              <button
                key={name}
                data-pattern={name}
                data-active={activePreset === name}
                onClick={() => {
                  if (activePreset === name) return;
                  trigger();
                  dispatch({
                    type: "LOAD_PRESET",
                    taps: patternToTaps(preset.pattern, 0.5),
                  });
                }}
              >
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </button>
            ))}
          </div>
        </HorizontalScroll>
        {totalDuration > 0 && (
          <div className={styles.controls}>
            <span className={styles.totalDuration}>{totalDuration}ms</span>

            <button onClick={handlePlay} disabled={state.taps.length === 0}>
              <svg
                aria-label="Play"
                width="15"
                height="17"
                viewBox="0 0 15 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.000323688 2.50385L0.000322723 13.6729C0.000322555 15.6161 2.12025 16.8164 3.78656 15.8166L13.0941 10.2321C14.7125 9.2611 14.7125 6.91565 13.0941 5.94465L3.78656 0.36012C2.12025 -0.639667 0.000323855 0.560616 0.000323688 2.50385Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className={styles.timelineContainer}>
        <div
          className={styles.timeline}
          ref={timelineRef}
          onClick={handleTimelineClick}
        >
          {/* Gridlines */}
          {GRIDLINES.map((ms) => (
            <div
              key={ms}
              className={styles.gridline}
              data-minor={ms % 100 !== 0}
              style={{ left: `${(ms / 1000) * 100}%` }}
            />
          ))}

          {/* Taps */}
          <AnimatePresence>
            {state.taps.map((tap) => {
              const inset = `calc(${1 - tap.intensity} * (50% - 10px))`;
              const isDeleting = pendingDeleteId === tap.id;
              return (
                <motion.div
                  key={tap.id}
                  style={{
                    position: "absolute",
                    left: `${(tap.position / 1000) * 100}%`,
                    width: `${(tap.duration / 1000) * 100}%`,
                    minWidth: 16,
                    top: 0,
                    bottom: 0,
                    x: isDeleting ? dragOffset.x : 0,
                    y: isDeleting ? dragOffset.y : 0,
                    zIndex: isDeleting ? 9999 : undefined,
                    pointerEvents: "none",
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    x: isDeleting ? dragOffset.x : 0,
                    y: isDeleting ? dragOffset.y : 0,
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    x: { type: "spring", stiffness: 300, damping: 25 },
                    y: { type: "spring", stiffness: 300, damping: 25 },
                  }}
                >
                  <div
                    className={isDeleting ? styles.wobble : undefined}
                    style={{ position: "absolute", inset: 0 }}
                  >
                    {/* Region bar */}
                    <motion.div
                      className={styles.tapRegion}
                      data-selected={tap.id === state.selectedId}
                      data-playing={activeTapIds.has(tap.id)}
                      style={{
                        left: 0,
                        right: 0,
                        top: inset,
                        bottom: inset,
                        pointerEvents: "auto",
                      }}
                      onPointerDown={(e) => handleDragStart(e, tap.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: "SELECT_TAP", id: tap.id });
                      }}
                    >
                      <div
                        className={styles.resizeHandleLeft}
                        onPointerDown={(e) => handleResizeLeftStart(e, tap.id)}
                      />
                      <div
                        className={styles.resizeHandle}
                        onPointerDown={(e) => handleResizeStart(e, tap.id)}
                      />
                      <div
                        className={styles.intensityHandleTop}
                        onPointerDown={(e) =>
                          handleIntensityDragStart(e, tap.id, "top")
                        }
                      />
                      <div
                        className={styles.intensityHandleBottom}
                        onPointerDown={(e) =>
                          handleIntensityDragStart(e, tap.id, "bottom")
                        }
                      />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Playhead */}
          {playing && totalDuration > 0 && (
            <motion.div
              key={`playhead-${playCount}`}
              className={styles.playhead}
              initial={{ left: 0 }}
              animate={{ left: `${(totalDuration / 1000) * 100}%` }}
              transition={{ duration: totalDuration / 1000, ease: "linear" }}
            />
          )}

          {/* Empty state */}
          {state.taps.length === 0 && (
            <div className={styles.emptyState}>
              <span>Tap to add a tap</span>
            </div>
          )}
        </div>

        {/* Labels */}
        <div className={styles.timelineLabels}>
          {LABELS.map((ms) => (
            <span key={ms}>{ms}</span>
          ))}
        </div>
      </div>

      {/* Code output */}
      <CodeBlock code={code} />
    </div>
  );
};
