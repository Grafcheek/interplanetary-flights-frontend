import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import PlanetsPage from "./pages/PlanetsPage/PlanetsPage";
import PlanetPage from "./pages/PlanetPage/PlanetPage";
import InterplanetaryFlightRequestPage from "./pages/InterplanetaryFlightRequestPage/InterplanetaryFlightRequestPage";
import { ROUTES } from "./routePaths";
import "bootstrap/dist/css/bootstrap.min.css";
import "./cosmos-styles.css";

function RedirectLegacyStrategyToPlanet() {
  const { id } = useParams();
  if (!id) return <Navigate to="/" replace />;
  return <Navigate to={`/planet/${id}`} replace />;
}

function RedirectLegacySystemLoadToFlight() {
  const { id } = useParams();
  return <Navigate to={`/interplanetary-flight/${id ?? "1"}`} replace />;
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
          <Route path={ROUTES.INTERPLANETARY_FLIGHT} element={<InterplanetaryFlightRequestPage />} />
          <Route path="/system_load/:id" element={<RedirectLegacySystemLoadToFlight />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
