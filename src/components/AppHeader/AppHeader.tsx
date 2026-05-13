import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutUser } from "../../store/slices/userSlice";
import { interplanetaryFlightPath, ROUTES } from "../../routePaths";
import "./AppHeader.css";

export default function AppHeader() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, username } = useAppSelector((s) => s.user);
  const cart = useAppSelector((s) => s.flightRequest.cart);

  const handleLogout = () => {
    void dispatch(logoutUser());
  };

  const draftActive =
    Boolean(cart?.has_draft && cart.planets_count > 0 && cart.id != null);

  return (
    <Navbar
      expand="lg"
      collapseOnSelect
      variant="dark"
      className="cosmos-navbar py-0"
      data-bs-theme="dark"
    >
      <Container fluid className="cosmos-navbar-inner cosmos-navbar__inner px-3">
        <Navbar.Brand as={Link} to={ROUTES.PLANETS} className="header-home cosmos-navbar__brand mb-0 py-2">
          <img src="/logo.png" alt="Cosmos" className="header-home__icon" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="cosmos-main-nav" className="cosmos-navbar__toggle" />
        <Navbar.Collapse id="cosmos-main-nav" className="justify-content-end">
          <Nav className="ms-lg-0 mb-2 mb-lg-0 cosmos-navbar__nav align-items-lg-center" navbar>
            <Nav.Link as={Link} to={ROUTES.PLANETS} className="cosmos-nav-link" eventKey="catalog">
              Каталог планет
            </Nav.Link>
            {isAuthenticated ? (
              <>
                <Nav.Link
                  as={Link}
                  to={ROUTES.INTERPLANETARY_FLIGHTS}
                  className="cosmos-nav-link"
                  eventKey="missions"
                >
                  Заявки
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to={ROUTES.PROFILE}
                  className="cosmos-nav-link"
                  eventKey="profile"
                >
                  Личный кабинет
                </Nav.Link>
              </>
            ) : null}
            {draftActive && cart?.id != null ? (
              <Nav.Link
                as={Link}
                to={interplanetaryFlightPath(cart.id)}
                className="cosmos-nav-link"
                eventKey="draft"
              >
                Текущая заявка
              </Nav.Link>
            ) : (
              <Nav.Link
                className="cosmos-nav-link cosmos-nav-link--muted"
                eventKey="draft-off"
                disabled
              >
                Текущая заявка
              </Nav.Link>
            )}
            {isAuthenticated ? (
              <>
                <Nav.Link
                  as={Link}
                  to={ROUTES.PLANETS}
                  className="cosmos-nav-link"
                  eventKey="logout"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  Выход
                </Nav.Link>
                <span className="cosmos-navbar__username d-none d-lg-inline">{username}</span>
              </>
            ) : (
              <>
                <Nav.Link
                  as={Link}
                  to={ROUTES.SIGN_IN}
                  className="cosmos-nav-link"
                  eventKey="signin"
                >
                  Вход
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to={ROUTES.SIGN_UP}
                  className="cosmos-nav-link"
                  eventKey="signup"
                >
                  Регистрация
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
