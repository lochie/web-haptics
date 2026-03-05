import styles from "./styles.module.scss";

import { CodeBlock } from "../../components/codeblock";

export const Usage = () => {
  return (
    <div className={styles.usage}>
      <CodeBlock
        code={`import { trigger, defaultPatterns } from "web-haptics";

trigger(); // medium impact
trigger(defaultPatterns.success);`}
      />
    </div>
  );
};
