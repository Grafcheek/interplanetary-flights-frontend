import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import PlanetsPage from "./pages/PlanetsPage/PlanetsPage";
import PlanetPage from "./pages/PlanetPage/PlanetPage";
import { ROUTES } from "./routePaths";
import "bootstrap/dist/css/bootstrap.min.css";
import "./cosmos-styles.css";

function RedirectLegacyStrategyToPlanet() {
  const { id } = useParams();
  if (!id) return <Navigate to="/" replace />;
  return <Navigate to={`/planet/${id}`} replace />;
}

function RedirectLegacySystemLoadToHome() {
  return <Navigate to={ROUTES.PLANETS} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.PLANETS} element={<PlanetsPage />} />
          <Route path="/strategies" element={<Navigate to="/" replace />} />
          <Route path="/strategy/:id" element={<RedirectLegacyStrategyToPlanet />} />
          <Route path={ROUTES.PLANET} element={<PlanetPage />} />
          <Route path="/system_load/:id" element={<RedirectLegacySystemLoadToHome />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
