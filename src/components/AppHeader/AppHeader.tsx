import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { MOCK_CART } from "../../modules/mock";

export default function AppHeader() {
  return (
    <Navbar expand="lg" variant="dark" className="cosmos-navbar py-0" collapseOnSelect>
      <Container fluid className="cosmos-navbar-inner px-3">
        <div className="cosmos-navbar__spacer" aria-hidden />
        <Navbar.Brand
          as={Link}
          to="/"
          className="header-home cosmos-navbar__brand m-0 py-2 d-flex align-items-center"
        >
          <img src="/logo.png" alt="Cosmos" className="header-home__icon" />
        </Navbar.Brand>
        <div className="cosmos-navbar__side">
          <Navbar.Toggle aria-controls="cosmos-main-nav" className="border-secondary" />
          <Navbar.Collapse id="cosmos-main-nav" className="justify-content-end">
            <Nav navbar className="ms-lg-0 align-items-lg-center">
              <Nav.Link as={Link} to="/" eventKey="catalog">
                Каталог планет
              </Nav.Link>
              {MOCK_CART.has_draft && MOCK_CART.id != null ? (
                <Nav.Link as={Link} to={`/interplanetary-flight/${MOCK_CART.id}`} eventKey="flight">
                  Межпланетная заявка
                </Nav.Link>
              ) : null}
            </Nav>
          </Navbar.Collapse>
        </div>
      </Container>
    </Navbar>
  );
}
