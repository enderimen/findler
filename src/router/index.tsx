import Splash from '@/pages/Splash';
import ScoreBoard from '@/pages/ScoreBoard';
import GameRules from '@/pages/GameRules';
import GameRoom from '@/pages/GameRoom';
import NewGame from '@/pages/NewGame';
import NotFound from '@/pages/NotFound';

import { RouteConfig } from '@/types/route';

const routes: RouteConfig[] = [
  {
    path: '/',
    element: <Splash />
  },
  {
    path: '/oyun-kurallari',
    element: <GameRules />
  },
  {
    path: '/yeni-oyun',
    element: <NewGame />
  },
  {
    path: '/oda/:roomId',
    element: <GameRoom />
  },
  {
    path: '/skor-tablosu',
    element: <ScoreBoard />
  },
  {
    path: '*',
    element: <NotFound />
  }
];

export default routes;
