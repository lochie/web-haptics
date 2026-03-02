import styles from "./styles.module.scss";

import { defaultPatterns } from "web-haptics";
import { useRef } from "react";
import { useParticles, type EmojiOption } from "../../components/particles";
import { useHaptics } from "../../hooks/useHaptics";

// add emoji sets with [emoji, weight, canFlip?] tuples
type EmojiEntry = [emoji: string, weight: number, canFlip?: boolean];

const demoPresets = ["success", "warning", "nudge", "buzz"] as const;

const emojis = {
  success: [
    ["✅", 3],
    ["🎉", 2, true],
    ["🤝", 1],
    ["💚", 2],
    ["👍", 3, true],
  ] as EmojiEntry[],
  warning: [
    ["⚠️", 3],
    ["😬", 2],
    ["👀", 2],
    ["🫣", 1],
  ] as EmojiEntry[],
  nudge: [
    ["🫨", 2, true],
    ["🙉", 3],
    ["👉", 2, true],
    ["😳", 1],
  ] as EmojiEntry[],
  buzz: [
    ["🐝", 12, true],
    ["🍯", 8],
    ["🌼", 3],
  ] as EmojiEntry[],
};

function expandWeighted(entries: EmojiEntry[]): EmojiOption[] {
  return entries.flatMap(([emoji, weight, canFlip]) =>
    Array.from({ length: weight }, () => ({
      emoji,
      canFlip: canFlip ?? false,
    })),
  );
}

export const Demo = ({
  setShaking,
}: {
  setShaking?: (shaking: boolean) => void;
}) => {
  const { trigger } = useHaptics();
  const { create } = useParticles();

  const spanRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const handleTrigger = (
    name: string,
    pattern: (typeof defaultPatterns)[keyof typeof defaultPatterns],
    x?: number,
    y?: number,
  ) => {
    trigger(pattern);
    if (setShaking && name === "buzz") {
      setShaking(true);
      setTimeout(() => setShaking(false), 1000);
    }
    if (x !== undefined && y !== undefined) {
      create(
        x,
        y,
        expandWeighted(emojis[name as keyof typeof emojis]),
        name === "buzz" ? 1000 : undefined,
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
        {demoPresets.map((name) => (
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
              aria-description={defaultPatterns[name].description}
              onClick={(e) => {
                const x =
                  e.clientX ||
                  e.currentTarget.getBoundingClientRect().left +
                    e.currentTarget.offsetWidth / 2;
                const y =
                  e.clientY ||
                  e.currentTarget.getBoundingClientRect().top +
                    e.currentTarget.offsetHeight / 2;
                handleTrigger(name, defaultPatterns[name], x, y);
              }}
            >
              <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
