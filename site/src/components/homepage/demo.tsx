import styles from "./styles.module.scss";

import { useWebHaptics } from "web-haptics/react";
import { defaultPatterns } from "web-haptics";
import { useRef, useState } from "react";
import { Button } from "../button";

export const Demo = () => {
  const { trigger } = useWebHaptics({
    debug: import.meta.env.DEV,
  });
  const [intensity, setIntensity] = useState<number | undefined>(undefined);
  const spanRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const handleTrigger = (
    name: string,
    pattern: (typeof defaultPatterns)[keyof typeof defaultPatterns],
  ) => {
    trigger(pattern, { intensity });
    const span = spanRefs.current.get(name);
    if (!span) return;
    span.classList.remove(styles[name]!);
    void span.offsetWidth;
    span.classList.add(styles[name]!);
  };

  return (
    <div className={styles.demo}>
      <div className={styles.buttons}>
        {Object.entries(defaultPatterns).map(([name, pattern]) => (
          <button
            key={name}
            aria-description={pattern.description}
            onTouchStart={() => handleTrigger(name, pattern)}
            onMouseDown={() => handleTrigger(name, pattern)}
          >
            <span
              ref={(el) => {
                if (el) spanRefs.current.set(name, el);
              }}
              onAnimationEnd={(e) =>
                (e.currentTarget as HTMLSpanElement).classList.remove(
                  styles[name]!,
                )
              }
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.intensityControl}>
        <label htmlFor="intensity">
          Intensity:{" "}
          {intensity !== undefined ? `${Math.round(intensity * 100)}%` : "Auto"}
        </label>
        <input
          id="intensity"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
        />
        <Button onClick={() => setIntensity(undefined)}>Reset</Button>
      </div>
    </div>
  );
};
