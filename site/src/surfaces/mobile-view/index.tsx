import styles from "./styles.module.scss";

import { Demo } from "./demo";
import { useApp } from "../../context/app";
import { SoundIcon } from "./sound-icon";
import { Logo } from "../../components/logo";
import { Toggle, ToggleGroup } from "../../components/toggle";
import { useWebHaptics } from "web-haptics/react";
import { SafariBar } from "./safari-bar";
import { useState } from "react";
import { InstallCommands } from "../installation";
import { Usage } from "../usage";

export default function MobileView({
  disabled,
  setShaking,
}: {
  disabled?: boolean;
  setShaking?: (shaking: boolean) => void;
}) {
  const { debug, setDebug } = useApp();
  const { trigger } = useWebHaptics({ debug });

  const [view, setView] = useState<"play" | "install">("play");

  return (
    <div className={styles.page}>
      <div className={styles.debug}>
        <button
          onClick={() => {
            trigger();
            setDebug(!debug);
          }}
        >
          <SoundIcon enabled={debug} />
        </button>
      </div>
      <div className={styles.container}>
        <div className={styles.header}>
          <Logo />
          <p>Haptic feedback for the mobile web</p>
        </div>

        {!disabled && (
          <div className={styles.toggleGroup}>
            <ToggleGroup>
              <Toggle onClick={() => setView("play")} active={view === "play"}>
                Play
              </Toggle>
              <Toggle
                onClick={() => setView("install")}
                active={view === "install"}
              >
                Install
              </Toggle>
            </ToggleGroup>
          </div>
        )}

        {view === "play" && <Demo setShaking={setShaking} />}
        {view === "install" && (
          <div className={styles.installation}>
            <InstallCommands />
            <Usage />
          </div>
        )}
      </div>

      {disabled && (
        <div className={styles.safariUI}>
          <SafariBar />
        </div>
      )}
    </div>
  );
}
