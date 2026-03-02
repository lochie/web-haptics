import styles from "./styles.module.scss";

import { CodeBlock } from "../../components/codeblock";
import { useHaptics } from "../../hooks/useHaptics";

const presetCategories = [
  {
    name: "Notification",
    presets: [
      { name: "success", color: "var(--green)" },
      { name: "warning", color: "var(--orange)" },
      { name: "error", color: "var(--red)" },
    ],
  },
  {
    name: "Impact",
    presets: [
      { name: "light", color: "var(--color-light)" },
      { name: "medium", color: "var(--color-muted)" },
      { name: "heavy", color: "var(--color)" },
      { name: "soft", color: "var(--color-light)" },
      { name: "rigid", color: "var(--color)" },
    ],
  },
  {
    name: "Selection",
    presets: [{ name: "selection", color: "var(--blue)" }],
  },
  {
    name: "Custom",
    presets: [
      { name: "nudge", color: "var(--orange)" },
      { name: "buzz", color: "var(--red)" },
    ],
  },
];

const methods = [
  {
    signature: "trigger(input?, options?): Promise<void>",
    description:
      "Trigger haptic feedback. Accepts a preset name, duration in ms, pattern array, or HapticPreset object.",
  },
  {
    signature: "cancel(): void",
    description: "Stop current haptic pattern and cancel ongoing vibration.",
  },
  {
    signature: "destroy(): void",
    description: "Clean up all DOM elements and audio resources.",
  },
  {
    signature: "setDebug(debug: boolean): void",
    description:
      "Enable or disable debug mode. When enabled, plays audio clicks to simulate haptics on desktop.",
  },
  {
    signature: "setShowSwitch(show: boolean): void",
    description: "Show or hide the haptic feedback toggle switch in the UI.",
  },
  {
    signature: "WebHaptics.isSupported: boolean",
    description:
      "Static property. Returns true if the device supports the Vibration API.",
  },
];

export const Docs = () => {
  const { trigger } = useHaptics();

  return (
    <div className={styles.docs}>
      <details className={styles.section}>
        <summary>Constructor</summary>
        <CodeBlock
          code={`const haptics = new WebHaptics({
  debug: false,     // audio feedback for desktop testing
  showSwitch: false, // show haptic toggle switch
});`}
        />
      </details>

      <details className={styles.section}>
        <summary>Methods</summary>
        <div className={styles.methods}>
          {methods.map((m) => (
            <div key={m.signature} className={styles.method}>
              <div className={styles.signature}>{m.signature}</div>
              <div className={styles.description}>{m.description}</div>
            </div>
          ))}
        </div>
      </details>

      <details className={styles.section}>
        <summary>Trigger Input</summary>
        <p>The trigger method accepts multiple input formats:</p>
        <div className={styles.inputFormats}>
          <div className={styles.format}>
            <code>"success"</code>
            <span>Preset name</span>
          </div>
          <div className={styles.format}>
            <code>100</code>
            <span>Duration in ms</span>
          </div>
          <div className={styles.format}>
            <code>[50, 30, 50]</code>
            <span>Alternating on/off pattern</span>
          </div>
          <div className={styles.format}>
            <code>{"[{ duration: 30, intensity: 0.8 }]"}</code>
            <span>Vibration objects with intensity</span>
          </div>
          <div className={styles.format}>
            <code>{"{ pattern: [...] }"}</code>
            <span>HapticPreset object</span>
          </div>
        </div>
      </details>

      <details className={styles.section} open>
        <summary>Presets</summary>
        <div className={styles.presets}>
          {presetCategories.flatMap((category) =>
            category.presets.map((preset) => (
              <button
                key={preset.name}
                className={styles.preset}
                onClick={() => trigger(preset.name)}
              >
                <div
                  className={styles.dot}
                  style={{ background: preset.color }}
                />
                {preset.name}
              </button>
            )),
          )}
        </div>
      </details>

      <details className={styles.section}>
        <summary>Types</summary>
        <div className={styles.types}>
          <div className={styles.type}>
            <div className={styles.typeName}>Vibration</div>
            <div className={styles.typeBody}>
              {`{ duration: number, intensity?: number, delay?: number }`}
            </div>
          </div>
          <div className={styles.type}>
            <div className={styles.typeName}>HapticInput</div>
            <div className={styles.typeBody}>
              {`number | string | number[] | Vibration[] | HapticPreset`}
            </div>
          </div>
          <div className={styles.type}>
            <div className={styles.typeName}>TriggerOptions</div>
            <div className={styles.typeBody}>
              {`{ intensity?: number }  // 0–1, default 0.5`}
            </div>
          </div>
          <div className={styles.type}>
            <div className={styles.typeName}>WebHapticsOptions</div>
            <div className={styles.typeBody}>
              {`{ debug?: boolean, showSwitch?: boolean }`}
            </div>
          </div>
        </div>
      </details>

      <details className={styles.section}>
        <summary>React</summary>
        <CodeBlock
          code={`import { useWebHaptics } from 'web-haptics/react';

const { trigger, cancel, isSupported } = useWebHaptics({
  debug: false,
});`}
        />
      </details>

      <details className={styles.section}>
        <summary>Vue</summary>
        <CodeBlock
          code={`import { useWebHaptics } from 'web-haptics/vue';

const { trigger, cancel, isSupported } = useWebHaptics();`}
        />
      </details>

      <details className={styles.section}>
        <summary>Svelte</summary>
        <CodeBlock
          code={`import { createWebHaptics } from 'web-haptics/svelte';

const { trigger, cancel, destroy, isSupported } = createWebHaptics();
onDestroy(destroy);`}
        />
      </details>
    </div>
  );
};
