import styles from "./styles.module.scss";

import { useState } from "react";

import * as Logos from "./logos";

import { CodeBlock } from "../../components/codeblock";
import { useWebHaptics } from "web-haptics/react";
import { useApp } from "../../context/app";

const examples = {
  vanilla: `import { WebHaptics, defaultPatterns } from "web-haptics";

const haptics = new WebHaptics();
haptics.trigger(); // medium impact
haptics.trigger(defaultPatterns.success);`,
  react: `import { useWebHaptics } from "web-haptics/react";

const { trigger } = useWebHaptics();

<button onClick={() => trigger()}>Tap me</button>`,
  vue: `<script setup>
  import { useWebHaptics } from "web-haptics/vue";
  const { trigger } = useWebHaptics();
</script>

<template>
  <button @click="trigger()">Tap me</button>
</template>`,
  svelte: `<script>
  import { createWebHaptics } from "web-haptics/svelte";
  import { onDestroy } from "svelte";
  const { trigger, destroy } = createWebHaptics();
  onDestroy(destroy);
</script>

<button on:click={() => trigger()}>Tap me</button>`,
};

const frameworks = [
  {
    name: "React",
    entrypoint: "web-haptics/react",
    logo: <Logos.ReactLogo />,
    example: examples.react,
  },
  {
    name: "TypeScript",
    entrypoint: "web-haptics",
    logo: <Logos.TypeScriptLogo />,
    example: examples.vanilla,
  },
  {
    name: "Vue",
    entrypoint: "web-haptics/vue",
    logo: <Logos.VueLogo />,
    example: examples.vue,
  },
  {
    name: "Svelte",
    entrypoint: "web-haptics/svelte",
    logo: <Logos.SvelteLogo />,
    example: examples.svelte,
  },
];

export const Usage = () => {
  const { debug } = useApp();
  const { trigger } = useWebHaptics({ debug });
  const [frameworkIndex, setFrameworkIndex] = useState(0);

  return (
    <div className={styles.usage}>
      <div className={styles.commands}>
        {frameworks.map((f, i) => (
          <button
            key={f.name}
            onClick={() => {
              if (i === frameworkIndex) return;
              setFrameworkIndex(i);
              trigger();
            }}
            data-active={frameworkIndex === i}
          >
            <span className={styles.logo}>{f.logo}</span>
            <span className={styles.name}>{f.name}</span>
          </button>
        ))}
      </div>

      <CodeBlock
        code={frameworks[frameworkIndex % frameworks.length].example}
      />
    </div>
  );
};
