import { useEffect, useState } from 'react';
import styles from '@/styles/pages/score.module.css';
import { SERVER_URL } from '@/services/socket/game';
import { ApiResponse } from '@/types/api';
import { LeaderboardEntry } from '@/types/game';
import { Error as ErrorMessage } from '@/utils/constants';

function ScoreBoard() {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${SERVER_URL}/api/leaderboard`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<ApiResponse<LeaderboardEntry[]>>;
      })
      .then((res) => setRows(res.data))
      .catch(() => setError(ErrorMessage.server));
  }, []);

  return (
    <section className={styles.score}>
      <h1 className={styles.title}>Skor Tablosu</h1>

      {error && <p>{error}</p>}
      {!error && !rows && <p>Yükleniyor...</p>}
      {rows && rows.length === 0 && <p>Henüz tamamlanmış oyun yok. İlk kazanan sen ol!</p>}

      {rows && rows.length > 0 && (
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
                <tr key={row.name}>
                  <td>{i + 1}</td>
                  <td>{row.name}</td>
                  <td>{row.wins}</td>
                  <td>{row.games}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ScoreBoard;
