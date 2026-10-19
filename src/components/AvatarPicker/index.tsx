import { useRef } from "react";
import Avatar from "@/components/Avatar";
import styles from "./style.module.css";

interface AvatarPickerProps {
  name: string;
  value: string | null;
  onChange: (avatar: string | null) => void;
}

const AVATAR_SIZE = 128;

// Seçilen fotoğrafı kare kırpıp küçültür; sunucuya küçük bir data URL gider
const resizeImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      canvas
        .getContext("2d")!
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel okunamadı"));
    };
    img.src = url;
  });

function AvatarPicker({ name, value, onChange }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      onChange(await resizeImage(file));
    } catch {
      onChange(null);
    }
  };

  return (
    <div className={styles.picker}>
      <Avatar name={name} src={value} size={96} />
      <button
        type="button"
        className={styles.change}
        title="Fotoğraf seç"
        aria-label="Fotoğraf seç"
        onClick={() => inputRef.current?.click()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  );
}

export default AvatarPicker;
