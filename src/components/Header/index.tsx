import styles from './styles.module.css';
import logo from '@/assets/images/logo.png';
import Button from '@/components/Button';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Popup from '@/components/Popup';
import SoundToggle from '@/components/SoundToggle';
import { useRoom } from '@/hooks/useRoom';
import { useLeaveRoom } from '@/hooks/useLeaveRoom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeInvite, openInvite } from '@/store/slices/game';

const TheHeader = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const inviteOpen = useAppSelector((state) => state.game.inviteOpen);
  const { room } = useRoom();
  const { requestLeave, leaveDialog } = useLeaveRoom();
  // Mobilde açılır menü
  const [menuOpen, setMenuOpen] = useState(false);

  const onRoomPage = !!room && pathname === `/oda/${room.roomId}`;

  // Sayfa değişince menüyü kapat
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const invite = () => {
    setMenuOpen(false);
    dispatch(openInvite());
  };

  let action = <Button value='Hemen Oyna' onClick={() => navigate('/yeni-oyun')} />;
  if (room) {
    action = onRoomPage
      ? <Button value='Oyundan Çık' onClick={() => requestLeave('/')} />
      : <Button value='Odaya Dön' onClick={() => navigate(`/oda/${room.roomId}`)} />;
  }

  const links = (
    <>
      <li><Link to="/skor-tablosu">Skor Tablosu</Link></li>
      <li><Link to="/oyun-kurallari">Oyun Kuralları</Link></li>
      {room && !room.solo && <li><button type="button" onClick={invite}>Davet</button></li>}
      {!room && <li><Link to="/yeni-oyun">Yeni Oyun</Link></li>}
    </>
  );

  return (
    <header className={`${styles.header} container`}>
      <div className={styles.content}>
        <Link to="/" className={styles.logo}><img src={logo} alt="Flip Master" /></Link>

        <div className={styles.other}>
          <nav className={styles.desktopNav}>
            <ul className={styles.menu}>{links}</ul>
          </nav>
          <div className={styles.actions}>
            <SoundToggle />
            {action}
          </div>
          <button
            type="button"
            className={styles.burger}
            aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={menuOpen ? styles.burgerOpen : ''} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className={styles.backdrop}
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.nav
              className={styles.mobileNav}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ul className={styles.mobileMenu}>{links}</ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {leaveDialog}
      {room && inviteOpen && <Popup roomId={room.roomId} onClose={() => dispatch(closeInvite())} />}
    </header>
  )
}

export default TheHeader;
