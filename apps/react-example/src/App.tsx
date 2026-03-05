import { trigger } from "web-haptics";

export default function App() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "2rem",
      }}
    >
      <button onClick={() => trigger()}>Tap me</button>
    </div>
  );
}
