import { useSoundMuted } from "@/hooks/useSoundMuted";
import styles from "./style.module.css";

// Header'daki ses aç/kapa butonu
function SoundToggle() {
  const [muted, setMuted] = useSoundMuted();
  const label = muted ? "Sesi aç" : "Sesi kapat";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setMuted(!muted)}
      aria-label={label}
      aria-pressed={muted}
      title={label}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" />
        {muted ? (
          <>
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )}
      </svg>
    </button>
  );
}

export default SoundToggle;
