import { useState } from "react";

import styles from "./styles.module.scss";

import { TextMorph } from "torph/react";

import { CodeBlock } from "../../components/codeblock";
import { useHaptics } from "../../hooks/useHaptics";

const pkgCmds = {
  npm: "npm i web-haptics",
  pnpm: "pnpm i web-haptics",
  yarn: "yarn add web-haptics",
  bun: "bun i web-haptics",
  skill: "npx skills add lochie/web-haptics",
};

export const InstallCommands = () => {
  const { trigger } = useHaptics();
  const [cmdIndex, setCmdIndex] = useState(0);

  return (
    <div className={styles.install}>
      <div className={styles.commands}>
        {Object.keys(pkgCmds).map((cmd, i) => (
          <button
            key={cmd}
            onClick={() => {
              if (i === cmdIndex) return;
              setCmdIndex(i);
              trigger();
            }}
            data-active={i === cmdIndex}
          >
            {cmd}
          </button>
        ))}
      </div>

      <div className={styles.cmd}>
        <CodeBlock
          code={pkgCmds[Object.keys(pkgCmds)[cmdIndex] as keyof typeof pkgCmds]}
        >
          <span
            style={{
              opacity: 0.4,
              userSelect: "none",
            }}
          >
            {"$ "}
          </span>
          <TextMorph>
            {pkgCmds[Object.keys(pkgCmds)[cmdIndex] as keyof typeof pkgCmds]}
          </TextMorph>
        </CodeBlock>
      </div>
    </div>
  );
};
