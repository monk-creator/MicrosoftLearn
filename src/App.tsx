import { LearnShell } from "./components/LearnShell";
import { HostedGuide } from "./components/HostedGuide";
import "./App.css";

export default function App() {
  return (
    <LearnShell>
      <HostedGuide />
    </LearnShell>
  );
}
