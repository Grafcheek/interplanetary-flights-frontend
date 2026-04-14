import { Outlet } from "react-router-dom";
import AppHeader from "../components/AppHeader/AppHeader";
import BreadCrumbs from "../components/BreadCrumbs/BreadCrumbs";

export default function MainLayout() {
  return (
    <div className="cosmos-main-layout">
      <AppHeader />
      <BreadCrumbs />
      <Outlet />
    </div>
  );
}
