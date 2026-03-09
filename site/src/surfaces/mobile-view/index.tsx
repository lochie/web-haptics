import styles from "./styles.module.scss";

import { Demo } from "./demo";
import { useApp } from "../../context/app";
import { SoundIcon } from "./sound-icon";
import { Logo } from "../../components/logo";
import { Toggle, ToggleGroup } from "../../components/toggle";
import { SafariBar } from "./safari-bar";
import { useRef, useState } from "react";
import { InstallCommands } from "../installation";
import { Usage } from "../usage";
import { AnimatePresence, motion } from "motion/react";
import { useHaptics } from "../../hooks/useHaptics";
import { Footer } from "../../components/footer";
import { HapticBuilder } from "../builder";
import { Lab } from "../../components/lab";

export default function MobileView({
  disabled,
  setShaking,
}: {
  disabled?: boolean;
  setShaking?: (shaking: boolean) => void;
}) {
  const { debug, setDebug } = useApp();
  const { trigger } = useHaptics();

  const views = ["play", "install", "build"] as const;
  const [view, setView] = useState<"play" | "install" | "build">("play");
  const directionRef = useRef(1);

  const navigate = (next: typeof view) => {
    directionRef.current = views.indexOf(next) > views.indexOf(view) ? 1 : -1;
    setView(next);
  };

  return (
    <div className={styles.page} data-disabled={!!disabled}>
      <Lab />
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
        <div className={styles.top}>
          <div className={styles.header}>
            <Logo />
            <p>Haptic feedback for the mobile web</p>
          </div>

          {!disabled && (
            <div className={styles.toggleGroup}>
              <ToggleGroup>
                <Toggle
                  onClick={() => navigate("play")}
                  active={view === "play"}
                >
                  Play
                </Toggle>
                <Toggle
                  onClick={() => navigate("install")}
                  active={view === "install"}
                >
                  Install
                </Toggle>
                <Toggle
                  onClick={() => navigate("build")}
                  active={view === "build"}
                >
                  Build
                </Toggle>
              </ToggleGroup>
            </div>
          )}
        </div>
        <div className={styles.scrollarea}>
          <div className={styles.content}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={view}
                initial={{ x: directionRef.current * 8 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {view === "play" && <Demo setShaking={setShaking} />}
                {view === "install" && (
                  <div className={styles.installation}>
                    <section>
                      <InstallCommands />
                    </section>

                    <section>
                      <h3>Usage</h3>
                      <Usage />
                    </section>

                    <Footer />
                  </div>
                )}
                {view === "build" && (
                  <div
                    className={styles.installation}
                    style={{
                      minHeight: 300,
                    }}
                  >
                    <section>
                      <h3>Custom Haptic</h3>
                      <HapticBuilder />
                    </section>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {disabled && (
        <div className={styles.safariUI}>
          <SafariBar />
        </div>
      )}
    </div>
  );
}
