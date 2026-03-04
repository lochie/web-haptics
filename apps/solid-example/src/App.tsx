import { useWebHaptics } from "web-haptics/solid";

export default function App() {
  const { trigger } = useWebHaptics();

  return (
    <div
      style={{
        display: "flex",
        "justify-content": "center",
        "align-items": "center",
        height: "100vh",
        "font-size": "2rem",
      }}
    >
      <button onClick={() => trigger()}>Tap me</button>
    </div>
  );
}
