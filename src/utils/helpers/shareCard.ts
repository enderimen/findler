import leaderImage from '@/assets/images/leader.png';
import { levelColor } from '@/utils/constants/gameSettings';

// Sosyal medyada paylaşılacak sonuç görseli (1080x1080). Ekran görüntüsü yerine
// her cihazda aynı ve temiz görünen, tuvalde çizilmiş bir kart üretir.

export interface ShareCardData {
  name: string;
  solo: boolean;
  cardCount: number;
  moves: number;
  mistakes: number;
  durationMs: number | null;
  playerCount: number;
  challenge: string;
  site: string;
}

const SIZE = 1080;
const GOLD = '#ddb474';

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const formatDuration = (ms: number) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// Metni verilen genişliğe sığana kadar küçültür
const fitFont = (ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, size: number, maxWidth: number) => {
  let current = size;
  ctx.font = font(current);
  while (ctx.measureText(text).width > maxWidth && current > 12) {
    current -= 2;
    ctx.font = font(current);
  }
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const createShareCard = async (data: ShareCardData): Promise<Blob> => {
  // Tuvale çizmeden önce sayfanın fontları yüklenmiş olmalı
  await Promise.all([
    document.fonts.load('700 64px Raleway'),
    document.fonts.load('400 32px Raleway'),
    document.fonts.load('96px "Rock 3D"'),
  ]).catch(() => {});
  const leader = await loadImage(leaderImage);

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const center = SIZE / 2;

  // Seviyenin masa rengi, kenarlara doğru kararır
  const bg = ctx.createRadialGradient(center, center * 0.9, 0, center, center, SIZE * 0.75);
  bg.addColorStop(0, levelColor(data.cardCount));
  bg.addColorStop(1, '#010101');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Oyunun adı
  ctx.fillStyle = GOLD;
  fitFont(ctx, 'FLIP MASTER', (s) => `${s}px "Rock 3D", Raleway, sans-serif`, 112, SIZE - 160);
  ctx.fillText('FLIP MASTER', center, 170);

  // Başlık
  const title = data.solo ? 'Tebrikler, bitirdim!' : 'Birinci oldum!';
  ctx.fillStyle = '#fff';
  fitFont(ctx, title, (s) => `700 ${s}px Raleway, sans-serif`, 76, SIZE - 160);
  ctx.fillText(title, center, 275);

  // Kazanan rozeti ve adı (sonuç ekranındaki gibi)
  const badgeH = 380;
  const badgeW = (leader.width / leader.height) * badgeH;
  const badgeY = 310;
  ctx.drawImage(leader, center - badgeW / 2, badgeY, badgeW, badgeH);
  ctx.fillStyle = '#fff';
  fitFont(ctx, data.name, (s) => `700 ${s}px Raleway, sans-serif`, 40, badgeW * 0.62);
  ctx.fillText(data.name, center, badgeY + badgeH - (65 / 214) * badgeH);

  // İstatistikler
  const stats = [
    `${data.cardCount} kart`,
    `${data.moves} hamle`,
    `${data.mistakes} hata`,
    data.durationMs !== null ? formatDuration(data.durationMs) : null,
    !data.solo ? `${data.playerCount} oyuncu` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');
  ctx.fillStyle = GOLD;
  fitFont(ctx, stats, (s) => `700 ${s}px Raleway, sans-serif`, 40, SIZE - 160);
  ctx.fillText(stats, center, 770);

  // Rekabetçi davet
  fitFont(ctx, data.challenge, (s) => `700 ${s}px Raleway, sans-serif`, 44, SIZE - 260);
  const pillW = Math.min(SIZE - 160, ctx.measureText(data.challenge).width + 100);
  roundRect(ctx, center - pillW / 2, 815, pillW, 96, 48);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.fillStyle = '#030303';
  ctx.fillText(data.challenge, center, 878);

  // Site adresi
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '400 34px Raleway, sans-serif';
  ctx.fillText(data.site, center, 1000);

  // JPEG, PNG'nin yaklaşık onda biri boyutunda; mesajlaşma uygulamaları büyük dosyaları sıkıştırıyor
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Görsel oluşturulamadı'))), 'image/jpeg', 0.9)
  );
};
