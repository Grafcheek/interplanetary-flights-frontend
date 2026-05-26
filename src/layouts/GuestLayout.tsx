import { Link, Outlet } from "react-router-dom";
import { ROUTES } from "../routePaths";
import { publicUrl } from "../utils/publicUrl";

export default function GuestLayout() {
  return (
    <div className="cosmos-main-layout">
      <header className="site-header guest-header">
        <div className="site-header-main guest-header__inner">
          <Link to={ROUTES.PLANETS} className="header-home">
            <img src={publicUrl("/logo.png")} alt="Cosmos" className="header-home__icon" />
          </Link>
          <nav className="guest-header__nav" aria-label="Навигация гостя">
            <Link to={ROUTES.PLANETS}>Каталог</Link>
            <Link to={ROUTES.GUEST_INFO}>О приложении</Link>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
