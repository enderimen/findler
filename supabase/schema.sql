-- Flip Master — Supabase şeması
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştırıp "Run".
-- Tekrar çalıştırmak güvenlidir (var olanları bozmaz).

-- Skor tablosu: oyuncu adına göre (büyük/küçük harf duyarsız) galibiyet ve oyun sayısı.
-- Oyuncu hesapları yok; kullanıcı adı ve avatar sadece tarayıcıda tutulur.
create table if not exists public.leaderboard (
  name_key    text primary key,           -- adın küçük harfli hali (tr), ör. "ender"
  name        text        not null,       -- son kullanılan yazımı, ör. "Ender"
  wins        integer     not null default 0,
  games       integer     not null default 0,
  last_win_at timestamptz,
  updated_at  timestamptz not null default now()
);

-- Tabloya sadece oyun sunucusu (gizli anahtarla) erişir. Politika tanımlanmadığı için
-- tarayıcıdan herkese açık anahtarla okuma/yazma yapılamaz.
alter table public.leaderboard enable row level security;

-- Bir çok oyunculu oyun bittiğinde sunucu tek çağrıyla tüm oyuncuları günceller.
-- players: [{"key": "ender", "name": "Ender"}, ...]
create or replace function public.record_game(players jsonb, winner_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p jsonb;
  is_winner boolean;
begin
  for p in select * from jsonb_array_elements(players) loop
    is_winner := (p->>'key') = winner_key;
    insert into leaderboard (name_key, name, wins, games, last_win_at, updated_at)
    values (p->>'key', p->>'name', case when is_winner then 1 else 0 end, 1,
            case when is_winner then now() end, now())
    on conflict (name_key) do update set
      name        = excluded.name,
      games       = leaderboard.games + 1,
      wins        = leaderboard.wins + excluded.wins,
      last_win_at = coalesce(excluded.last_win_at, leaderboard.last_win_at),
      updated_at  = now();
  end loop;
end;
$$;

-- Fonksiyonu sadece sunucu (service_role / gizli anahtar) çağırabilsin
revoke execute on function public.record_game(jsonb, text) from public, anon, authenticated;
grant execute on function public.record_game(jsonb, text) to service_role;
