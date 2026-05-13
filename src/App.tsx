import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import PlanetsPage from "./pages/PlanetsPage/PlanetsPage";
import PlanetPage from "./pages/PlanetPage/PlanetPage";
import MissionPage from "./pages/MissionPage/MissionPage";
import MissionsPage from "./pages/MissionsPage/MissionsPage";
import SignInPage from "./pages/SignInPage/SignInPage";
import SignUpPage from "./pages/SignUpPage/SignUpPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import { interplanetaryFlightPath, planetPath, ROUTES } from "./routePaths";
import "bootstrap/dist/css/bootstrap.min.css";
import "./cosmos-styles.css";

function RedirectLegacyStrategyToPlanet() {
  const { id } = useParams();
  if (!id) return <Navigate to={ROUTES.PLANETS} replace />;
  return <Navigate to={planetPath(id)} replace />;
}

function RedirectLegacyPlanetRoute() {
  const { id } = useParams();
  if (!id) return <Navigate to={ROUTES.PLANETS} replace />;
  return <Navigate to={planetPath(id)} replace />;
}

function RedirectLegacyMissionRoute() {
  const { id } = useParams();
  if (!id) return <Navigate to={ROUTES.PLANETS} replace />;
  return <Navigate to={interplanetaryFlightPath(id)} replace />;
}

function RedirectLegacySystemLoadToMission() {
  const { id } = useParams();
  if (!id) return <Navigate to={ROUTES.PLANETS} replace />;
  return <Navigate to={interplanetaryFlightPath(id)} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.PLANETS} replace />} />
        <Route path="/strategies" element={<Navigate to={ROUTES.PLANETS} replace />} />
        <Route path="/strategy/:id" element={<RedirectLegacyStrategyToPlanet />} />
        <Route path="/planet/:id" element={<RedirectLegacyPlanetRoute />} />
        <Route path="/mission/:id" element={<RedirectLegacyMissionRoute />} />
        <Route path="/missions" element={<Navigate to={ROUTES.INTERPLANETARY_FLIGHTS} replace />} />
        <Route path="/system_load/:id" element={<RedirectLegacySystemLoadToMission />} />
        <Route element={<MainLayout />}>
          <Route path={ROUTES.PLANETS} element={<PlanetsPage />} />
          <Route path={ROUTES.PLANET} element={<PlanetPage />} />
          <Route path={ROUTES.INTERPLANETARY_FLIGHT} element={<MissionPage />} />
          <Route path={ROUTES.INTERPLANETARY_FLIGHTS} element={<MissionsPage />} />
          <Route path={ROUTES.SIGN_IN} element={<SignInPage />} />
          <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
