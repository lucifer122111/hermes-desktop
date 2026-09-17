import { useEffect, useState } from "react";
import { Ghosty } from "../vendor/openhuman/mascot/Ghosty";
import { useTheme } from "../components/ThemeProvider";

export default function Companion({
  busy,
  title,
  profile,
}: {
  busy: boolean;
  title: string;
  profile: string;
}): React.JSX.Element {
  const { appearance } = useTheme();
  const [motionAllowed, setMotionAllowed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!media.matches && !document.hidden);
    update();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <section className="mighty-companion" aria-label="Mighty companion">
      <span className="mighty-eyebrow">YOUR PERSONAL WORKSPACE</span>
      <div className="mighty-companion-character">
        <Ghosty
          size="100%"
          idPrefix="mighty-companion"
          bodyColor={appearance.mascot}
          variant="flat"
          face={busy ? "thinking" : "idle"}
          animated={appearance.animated && motionAllowed}
        />
      </div>
      <h2>{busy ? "On it." : "Let’s make something."}</h2>
      <p>
        {busy
          ? title || "Working in your current session"
          : "Talk, create, explore. Your tools are right here."}
      </p>
      <span className="mighty-pill">
        {profile} · {busy ? "Working" : "Ready for your next message"}
      </span>
      <small>The companion reflects task activity.</small>
    </section>
  );
}
