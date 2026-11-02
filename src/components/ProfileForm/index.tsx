import { useState } from "react";
import AvatarPicker from "@/components/AvatarPicker";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { Profile } from "@/types/game";
import { Error as ErrorMessage } from "@/utils/constants";
import { getProfile, handleApiError } from "@/utils/helpers";
import { useAppSelector } from "@/store/hooks";
import styles from "./style.module.css";

interface ProfileAction {
  label: string;
  run: (profile: Profile) => Promise<unknown>;
}

interface ProfileFormProps {
  actions: ProfileAction[];
  // inline: etiket solda, butonlar sağda (kullanıcı adı ekranı)
  // stacked: etiketsiz, ortalı alan ve tam genişlikte buton (davet kartı)
  variant?: "inline" | "stacked";
}

const NAME_MIN = 2;
const NAME_MAX = 16;

// Avatar + kullanıcı adı formu. Son kullanılan profil otomatik doldurulur.
function ProfileForm({ actions, variant = "inline" }: ProfileFormProps) {
  const stacked = variant === "stacked";
  const [name, setName] = useState(() => getProfile()?.name ?? "");
  const [avatar, setAvatar] = useState<string | null>(() => getProfile()?.avatar ?? null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const connected = useAppSelector((state) => state.game.connected);

  const submit = async (action: ProfileAction) => {
    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
      setError(ErrorMessage.username);
      return;
    }
    setError("");
    setBusy(true);
    try {
      await action.run({ name: trimmed, avatar });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className={`${styles.form} ${stacked ? styles.stacked : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        submit(actions[actions.length - 1]);
      }}
    >
      <AvatarPicker name={name} value={avatar} onChange={setAvatar} />
      <Input
        label={stacked ? undefined : "Kullanıcı Adın:"}
        placeholder={stacked ? "Kullanıcı adın" : undefined}
        variant={stacked ? "stacked" : "inline"}
        value={name}
        onChange={setName}
        maxLength={NAME_MAX}
        autoFocus
      />
      <div className={styles.buttons}>
        {actions.map((action, i) => (
          <Button
            key={action.label}
            value={action.label}
            disabled={busy}
            block={stacked}
            type={i === actions.length - 1 ? "submit" : "button"}
            onClick={i === actions.length - 1 ? undefined : () => submit(action)}
          />
        ))}
      </div>
      {busy && !connected ? (
        <p className={styles.waking} role="status">Sunucu hazırlanıyor, birazdan hazır olacak…</p>
      ) : (
        <p className={styles.error} role="alert">{error || " "}</p>
      )}
    </form>
  );
}

export default ProfileForm;
