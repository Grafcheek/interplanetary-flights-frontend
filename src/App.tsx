import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import PlanetsPage from "./pages/PlanetsPage/PlanetsPage";
import PlanetPage from "./pages/PlanetPage/PlanetPage";
import MissionPage from "./pages/MissionPage/MissionPage";
import { ROUTES } from "./routePaths";
import "bootstrap/dist/css/bootstrap.min.css";
import "./cosmos-styles.css";

function RedirectLegacyStrategyToPlanet() {
  const { id } = useParams();
  if (!id) return <Navigate to="/" replace />;
  return <Navigate to={`/planet/${id}`} replace />;
}

function RedirectLegacySystemLoadToMission() {
  const { id } = useParams();
  if (!id) return <Navigate to={ROUTES.PLANETS} replace />;
  return <Navigate to={`/mission/${id}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Как во второй лабе: отдельная полноценная страница заявки без общего SPA-хедера */}
        <Route path={ROUTES.MISSION} element={<MissionPage />} />
        <Route path="/system_load/:id" element={<RedirectLegacySystemLoadToMission />} />
        <Route element={<MainLayout />}>
          <Route path={ROUTES.PLANETS} element={<PlanetsPage />} />
          <Route path="/strategies" element={<Navigate to="/" replace />} />
          <Route path="/strategy/:id" element={<RedirectLegacyStrategyToPlanet />} />
          <Route path={ROUTES.PLANET} element={<PlanetPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
