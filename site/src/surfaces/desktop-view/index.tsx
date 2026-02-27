import styles from "./styles.module.scss";

import { Footer } from "../../components/footer";
import MobileView from "../mobile-view";
import { QRCode } from "../../components/qrcode";
import { ScanText } from "./scan-text";
import { InstallCommands } from "../installation";
import { Usage } from "../usage";
import { useState } from "react";

export default function DesktopView() {
  const [shaking, setShaking] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.phone} data-shaking={shaking}>
            <MobileView disabled setShaking={setShaking} />
          </div>
          <div className={styles.scan}>
            <ScanText />
            <div className={styles.qrcode}>
              <QRCode />
            </div>
          </div>
        </div>

        <section>
          <h3>Install</h3>
          <InstallCommands />
        </section>

        <section>
          <h3>Usage</h3>
          <Usage />
        </section>

        <Footer />
      </div>
    </div>
  );
}
