import { ReactNode } from 'react';
import Header from './../components/Header';
import Toast from './../components/Toast';
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
      <main>
        { children }
      </main>
    </div>
  );
};

export default MainLayout;
