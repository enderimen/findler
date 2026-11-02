import styles from '@/styles/pages/rule.module.css';

const GameRules = () => {
  return (
    <section className={styles.rule}>
      <h1 className={styles.ruleTitle}>Oyun Kuralları</h1>

      <ul className={styles.ruleList}>
        <li className={styles.ruleSubListContent}>
          <h3 className={styles.ruleSubTitle}>1. Oyuna Katılım:</h3>
          <ul className={styles.ruleSubList}>
            <li>Oyuncular, özel oda linki ile oyuna katılır.</li>
            <li>Odaya girerken bir kullanıcı adı belirlemeleri gerekir.</li>
            <li>Bir odada en az 2, en fazla 6 oyuncu olabilir. İstersen "Tek Kişilik" ile yalnız da oynayabilirsin.</li>
            <li>Oyunu oda kurucusu başlatır; oyun başlayana kadar oyuncular lobide bekler.</li>
            <li>Oda kurucusu yetkisini lobide veya oyun sırasında başka bir oyuncuya devredebilir.</li>
          </ul>
        </li>
        
        <li className={styles.ruleSubListContent}>
          <h3 className={styles.ruleSubTitle}>2. Kartları Çevirme:</h3>
          <ul className={styles.ruleSubList}>
            <li>Kartlar seçilen seviyeye göre 3, 5, 7, 9, 12, 15 veya 20 adettir.</li>
            <li>Kartlar sayılarla (1, 2, 3...), tek sayılarla (1, 3, 5...), çift sayılarla (0, 2, 4...) veya harflerle (A, B, C...) oynanabilir.</li>
            <li>Sırası gelen oyuncu, bir kart çevirir.</li>
            <li>Eğer açılan kart ilk kart (1 veya A) değilse, kart tekrar kapatılır ve sıra diğer oyuncuya geçer.</li>
          </ul>
        </li>
        
        <li className={styles.ruleSubListContent}>
          <h3 className={styles.ruleSubTitle}>3. Sıralı Açma Kuralı:</h3>
          <ul className={styles.ruleSubList}>
            <li>Oyuncular ilk karttan başlayarak sırayla kartları açmalıdır.</li>
            <li>Eğer doğru sırayla kart açarsa, devam edebilir.</li>
            <li>Yanlış sırada bir kart açarsa, tüm açık kartlar kapanır ve sıra diğer oyuncuya geçer.</li>
          </ul>
        </li>

        <li className={styles.ruleSubListContent}>
          <h3 className={styles.ruleSubTitle}>4. Oyunun Amacı:</h3>
          <ul className={styles.ruleSubList}>
            <li>Oyuncular açılan kartların konumlarını hatırlayarak tüm kartları doğru sırayla açmaya çalışır.</li>
            <li>Tek seferde tüm kartları doğru sırayla açan oyuncu kazanır!</li>
          </ul>
        </li>
        
        <li className={styles.ruleSubListContent}>
          <h3 className={styles.ruleSubTitle}>5. Sıra Sistemi:</h3>
          <ul className={styles.ruleSubList}>
            <li>Oyun sıra tabanlıdır, yani her oyuncu kendi sırası geldiğinde kart açabilir.</li>
            <li>Yanlış açılan kartlar hemen kapanır ve sıra diğer oyuncuya geçer.</li>
            <li>Hamle süresini oda kurucusu belirler (10, 20, 30, 60 saniye veya süresiz). Süre dolarsa açık kartlar kapanır ve sıra diğer oyuncuya geçer.</li>
            <li>Çok oyunculu oyunlarda tahtanın altındaki çubuktan rakiplerine emoji ya da "Süpersin!" gibi hazır mesajlar gönderebilirsin.</li>
          </ul>
        </li>

        <li className={styles.ruleSubListContent}>
          <h3 className={styles.ruleSubTitle}>6. Kazanan:</h3>
          <ul className={styles.ruleSubList}>
            <li><strong>Klasik:</strong> Tüm kartları eksiksiz ve doğru sırayla açan ilk oyuncu oyunu kazanır.</li>
            <li><strong>Sürekli Devam:</strong> Bitiren oyuncu sıralamaya girip pasife geçer, kartlar yeniden karıştırılır ve kalanlar devam eder. Son kalan oyuncu sonuncu olur.</li>
            <li>Kazanan oyuncu açıklandıktan sonra yeni bir oyun başlatılabilir.</li>
          </ul>
        </li>

        <p style={{marginBottom: '8px', marginTop: '16px'}}>
          <strong>Not: </strong>
          Unutma! Bu oyun bir hafıza oyunu, aklında tutarak sıralama yapıyor olmalısın. 
        </p>

        <p style={{marginBottom: '16px'}}>
          <strong>İyi Eğlenceler!</strong>
        </p>
      </ul>
    </section>
  )
}

export default GameRules;
