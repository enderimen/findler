import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissNotice } from "@/store/slices/game";
import { Notice } from "@/types/game";
import styles from "./style.module.css";

const NOTICE_DURATION = 3000;

function ToastItem({ notice }: { notice: Notice }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissNotice(notice.id)), NOTICE_DURATION);
    return () => clearTimeout(timer);
  }, [dispatch, notice.id]);

  return (
    <div className={`${styles.toast} ${notice.type === "error" ? styles.error : ""} ${notice.type === "leave" ? styles.leave : ""}`} role="status">
      {notice.message}
    </div>
  );
}

// Ekranın üst ortasında görünen bildirimler ("Eda Oyuna Dahil Oldu" gibi)
function Toast() {
  const notices = useAppSelector((state) => state.game.notices);

  return (
    <div className={styles.stack}>
      {notices.slice(-3).map((notice) => (
        <ToastItem key={notice.id} notice={notice} />
      ))}
    </div>
  );
}

export default Toast;
