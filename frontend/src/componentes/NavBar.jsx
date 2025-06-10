import React, { useEffect } from 'react';
import { Navbar, Nav, Form, Container } from 'react-bootstrap';
import { Link, NavLink } from 'react-router-dom';
import { useStore } from '../estados/store';
import { BsLayoutTextWindowReverse, BsCloudUpload, BsCalendar3, BsSun, BsMoonStars } from 'react-icons/bs';

const NavBar = () => {
  const { theme, toggleTheme } = useStore(
    // Selector optimizado para NavBar
    (state) => ({ theme: state.theme, toggleTheme: state.toggleTheme })
  );

  // Hook scroll ya no es necesario si NavBar V12 siempre tiene el efecto
  /*
  const useScrollPosition = () => {
    const [scrollPosition, setScrollPosition] = React.useState(0);
    useEffect(() => {
      const updatePosition = () => setScrollPosition(window.pageYOffset);
      window.addEventListener('scroll', updatePosition);
      updatePosition(); // Inicial
      return () => window.removeEventListener('scroll', updatePosition);
    }, []);
    return scrollPosition;
  };
  const scrollPosition = useScrollPosition();
  */

  return (
    <Navbar
      fixed="top"
      expand="lg"
      // Aplicar clase V12
      className="navbar-v12"
    >
      {/* Aplicar clase V12 */}
      <Container fluid className="container-fluid">
        {/* Aplicar clase V12 */}
        <Navbar.Brand as={Link} to="/" className="navbar-brand">
          <BsLayoutTextWindowReverse className="icon" />
          <span>Control Refrigerios</span>
        </Navbar.Brand>
        {/* Aplicar clase V12 */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-toggler" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto mb-2 mb-lg-0">
            {/* Aplicar clase V12 */}
            <Nav.Link as={NavLink} to="/cargar" className="nav-link">
              <BsCloudUpload className="icon me-1" /> Cargar Archivo
            </Nav.Link>
             {/* Aplicar clase V12 */}
            <Nav.Link as={NavLink} to="/calendario" className="nav-link">
              <BsCalendar3 className="icon me-1" /> Vista Calendario
            </Nav.Link>
          </Nav>
          {/* Interruptor de Tema V12 */}
          <div
            className="theme-switch-v12 ms-lg-auto"
            onClick={toggleTheme} // Activar al hacer clic en todo el div
            title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
          >
            <div className="icon-wrapper">
              <BsSun className="icon sun" />
              <input
                type="checkbox"
                id="theme-switch-input"
                checked={theme === 'dark'}
                readOnly // El control lo lleva el div wrapper
              />
              <label htmlFor="theme-switch-input"></label>
              <BsMoonStars className="icon moon" />
            </div>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar; 