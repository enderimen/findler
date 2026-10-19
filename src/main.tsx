import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import { store } from '@/store';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.tsx';
import './styles/index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(  
  <BrowserRouter>
    <Provider store={store}>
      <MainLayout>
        <App />
      </MainLayout>
    </Provider>
  </BrowserRouter>
);