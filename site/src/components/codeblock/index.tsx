import { useState } from "react";

import styles from "./styles.module.scss";
import { TextMorph } from "torph/react";
import { useHaptics } from "../../hooks/useHaptics";

export const CodeBlock = ({
  code,
  prefix,
}: {
  code: string;
  prefix?: React.ReactNode;
}) => {
  const { trigger } = useHaptics();

  const [isCopied, setIsCopied] = useState(false);

  return (
    <div className={styles.container}>
      <button
        className={styles.copy}
        onClick={() => {
          if (code) {
            setIsCopied(true);
            navigator.clipboard.writeText(code.toString());
            trigger();
            setTimeout(() => {
              setIsCopied(false);
            }, 2000);
          }
        }}
      >
        <TextMorph>{isCopied ? "Copied" : "Copy"}</TextMorph>
      </button>
      <pre>
        {prefix}
        {/* torph's root sets white-space: nowrap, which drops leading
            indentation until the first morph rewrites it as nbsp segments */}
        <TextMorph style={{ whiteSpace: "pre" }}>{code}</TextMorph>
      </pre>
    </div>
  );
};
