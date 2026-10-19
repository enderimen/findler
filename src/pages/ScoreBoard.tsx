import { useNavigate } from 'react-router-dom';
import styles from '@/styles/pages/score.module.css';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import { useRoom } from '@/hooks/useRoom';
import { RoomScores } from '@/types/game';
import { getLastScores } from '@/utils/helpers';

// Skorlar oda bazındadır: odadaysan o odanın, değilsen son oynadığın odanın skorları.
// Kalıcı değildir; sekme ya da tarayıcı kapanınca silinir.
function ScoreBoard() {
  const navigate = useNavigate();
  const { room, playerId } = useRoom();

  const live: RoomScores | null =
    room && room.players.some((p) => p.games > 0)
      ? { roomId: room.roomId, solo: room.solo, meId: playerId, players: room.players }
      : null;
  const scores = live ?? getLastScores();
  const rows = scores ? [...scores.players].sort((a, b) => b.wins - a.wins || a.games - b.games) : [];

  return (
    <section className={styles.score}>
      <h1 className={styles.title}>Skor Tablosu</h1>

      {!scores ? (
        <div className={styles.empty}>
          <p>Henüz tamamlanmış bir oyunun yok. İlk oyununu bitirince skorlar burada görünecek.</p>
          <Button value="Hemen Oyna" onClick={() => navigate('/yeni-oyun')} />
        </div>
      ) : (
        <>
          <p className={styles.subtitle}>
            {live ? 'Bu odadaki oyuncuların skorları.' : 'Son oynadığın odanın skorları.'} Sekme kapanınca silinir.
          </p>
          <div className={styles.tableWrapper}>
            <table className={styles.scoreTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Oyuncu</th>
                  <th>Galibiyet</th>
                  <th>Oyun</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}>
                    <td>{i + 1}</td>
                    <td>
                      <span className={styles.player}>
                        <Avatar name={row.name} src={row.avatar} size={28} />
                        {row.name}
                        {row.id === scores.meId && <span className={styles.me}>Sen</span>}
                      </span>
                    </td>
                    <td>{row.wins}</td>
                    <td>{row.games}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {live && (
            <div className={styles.back}>
              <Button value="Odaya Dön" onClick={() => navigate(`/oda/${live.roomId}`)} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ScoreBoard;
