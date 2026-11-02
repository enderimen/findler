import { ReactNode } from 'react';
import Header from './../components/Header';
import Toast from './../components/Toast';
import IncomingInvite from './../components/IncomingInvite';
import { useGameSync } from '@/hooks/useGameSync';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps ) => {
  useGameSync();

  return (
    <div className="app-layout">
      <Header />
      <Toast />
      {/* Başka oyunculardan gelen oyun davetleri her sayfada görünür */}
      <IncomingInvite />
      <main>
        { children }
      </main>
    </div>
  );
};

export default MainLayout;
