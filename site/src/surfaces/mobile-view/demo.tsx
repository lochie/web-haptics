import styles from "./styles.module.scss";

import { useWebHaptics } from "web-haptics/react";
import { defaultPatterns } from "web-haptics";
import { useRef } from "react";
import { useParticles } from "../../components/particles";
import { useApp } from "../../context/app";

// add emoji sets
const emojis = {
  success: ["✅", "🎉", "🤝", "💚", "👍"],
  nudge: ["🫨", "🙉", "👉", "😳"],
  error: ["⛔️", "🚨", "🚫", "🙅‍♀️"],
  long: ["🐝", "🍯"],
};

export const Demo = ({
  setShaking,
}: {
  setShaking?: (shaking: boolean) => void;
}) => {
  const { debug } = useApp();
  const { trigger } = useWebHaptics({
    debug,
  });
  const { create } = useParticles();

  const spanRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const handleTrigger = (
    name: string,
    pattern: (typeof defaultPatterns)[keyof typeof defaultPatterns],
    x?: number,
    y?: number,
  ) => {
    trigger(pattern);
    if (setShaking) {
      setShaking(true);
      setTimeout(() => setShaking(false), name === "long" ? 1000 : 300);
    }
    if (x !== undefined && y !== undefined) {
      create(
        x,
        y,
        emojis[name as keyof typeof emojis],
        name === "long" ? 1000 : undefined,
      );
    }
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
          <div
            key={name}
            className={styles.button}
            ref={(el) => {
              if (el) spanRefs.current.set(name, el);
            }}
            onAnimationEnd={(e) =>
              (e.currentTarget as HTMLSpanElement).classList.remove(
                styles[name]!,
              )
            }
          >
            <button
              data-pattern={name}
              aria-description={pattern.description}
              onTouchStart={(e) =>
                handleTrigger(
                  name,
                  pattern,
                  e.touches[0].clientX,
                  e.touches[0].clientY,
                )
              }
              onMouseDown={(e) =>
                handleTrigger(name, pattern, e.clientX, e.clientY)
              }
            >
              <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
