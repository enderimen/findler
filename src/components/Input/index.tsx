import { useId } from "react";
import styles from "./style.module.css";

type InputProps = {
  type?: string;
  label?: string;
  placeholder?: string;
  value: string;
  maxLength?: number;
  autoFocus?: boolean;
  variant?: "inline" | "stacked";
  onChange: (value: string) => void;
};

const DynamicInput = ({ type = "text", label, placeholder, value, maxLength, autoFocus, variant = "inline", onChange }: InputProps) => {
  const id = useId();

  return (
    <div className={`${styles.inputWrapper} ${variant === "stacked" ? styles.stacked : ""}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        aria-label={label ? undefined : placeholder}
        value={value}
        maxLength={maxLength}
        autoFocus={autoFocus}
        // Kullanıcı adı: telefon klavyesi kelimeyi düzeltip/tamamlayıp değiştirmesin
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        className={styles.input}
      />
    </div>
  );
};

export default DynamicInput;
