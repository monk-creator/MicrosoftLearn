import { useState } from "react";
import { GuideChat } from "./components/GuideChat";
import { LearnShell } from "./components/LearnShell";
import { LearnLanding } from "./components/LearnLanding";
import "./App.css";

export default function App() {
  const [view, setView] = useState<"home" | "guide">("home");

  return (
    <LearnShell breadcrumbCurrentLabel={view === "home" ? "Home (local)" : "AI Guide (local)"}>
      {view === "home" ? <LearnLanding onOpenGuide={() => setView("guide")} /> : <GuideChat />}
    </LearnShell>
  );
}
