import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const HomePage = lazy(() => import("../pages/home/page"));
const GamePage = lazy(() => import("../pages/game/page"));
const ElevationPage = lazy(() => import("../pages/elevation/page"));
const CompassPage = lazy(() => import("../pages/compass/page"));
const BorderDominoPage = lazy(() => import("../pages/border-domino/page"));
const CapitalClashPage = lazy(() => import("../pages/daily-quiz/page"));
const WorldOrderPage = lazy(() => import("../pages/world-order/page"));
const CountryDetectivePage = lazy(() => import("../pages/country-detective/page"));
const BlindRankingPage = lazy(() => import("../pages/blind-ranking/page"));
const StatBluffPage = lazy(() => import("../pages/stat-bluff/page"));
const CompassQuestPage = lazy(() => import("../pages/CompassQuest/CompassQuestPage"));
const LatitudeLadderPage = lazy(() => import("../pages/latitude-ladder/page"));
const BorderlinePage = lazy(() => import("../pages/borderline/page"));
const NotFound = lazy(() => import("../pages/NotFound"));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/game',
    element: <GamePage />,
  },
  {
    path: '/elevation',
    element: <ElevationPage />,
  },
  {
    path: '/compass',
    element: <CompassPage />,
  },
  {
    path: '/border-domino',
    element: <BorderDominoPage />,
  },
  {
    path: '/daily-quiz',
    element: <CapitalClashPage />,
  },
  {
    path: '/world-order',
    element: <WorldOrderPage />,
  },
  {
    path: '/country-detective',
    element: <CountryDetectivePage />,
  },
  {
    path: '/blind-ranking',
    element: <BlindRankingPage />,
  },
  {
    path: '/stat-bluff',
    element: <StatBluffPage />,
  },
  {
    path: '/compass-quest',
    element: <CompassQuestPage />,
  },
  {
    path: '/latitude-ladder',
    element: <LatitudeLadderPage />,
  },
  {
    path: '/borderline',
    element: <BorderlinePage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
