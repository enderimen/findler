import { useEffect } from "react";
import styles from "@/styles/pages/splash.module.css";
import CardFan from "@/components/CardFan";
import Watermark from "@/components/Watermark";
import { playSound, preloadSounds } from "@/utils/helpers";
import shuffleSound from "@/assets/sounds/card-shuffle-short.mp3";
import hoverSound from "@/assets/sounds/card-sound-hover.mp3";

const SHUFFLE_VOLUME = 0.8;

// Sayfa açılır açılmaz yüklemeye başlasın ki ses animasyonla aynı anda çalabilsin
preloadSounds(shuffleSound, hoverSound);

function Splash() {
  // Kartlar sayfa yüklenir yüklenmez dağıtılır. Tarayıcı, kullanıcı sayfayla etkileşime
  // girmeden sesi engelleyebilir; o durumda animasyon sessiz oynar.
  useEffect(() => {
    playSound(shuffleSound, SHUFFLE_VOLUME);
  }, []);

  return (
    <div className={styles.splash}>
      <CardFan />
      {/* Yelpaze açıldıktan sonra harfler dönerek belirir */}
      <Watermark animated delay={1.3} />
    </div>
  )
}

export default Splash;
