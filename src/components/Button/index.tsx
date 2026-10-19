import styles from "./style.module.css";

interface ButtonProps {
  value: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  // Bulunduğu alanın tamamını kaplar
  block?: boolean;
}

function Button({ value, onClick, type = "button", disabled = false, block = false }: ButtonProps) {
  return (
    <button type={type} className={`${styles.btn} ${block ? styles.block : ""}`} onClick={onClick} disabled={disabled}>
      {value}
    </button>
  )
};

export default Button;
