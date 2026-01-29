'use client'; 
import {Container, Nav, Navbar} from 'react-bootstrap';
import Image from 'next/image'
import SignInComponent from './login-btn';

export default function Header() {
  return (
    <Navbar expand="lg" fixed="top" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand href="/">
          <Image
              src="/site/lllms-logo.png"
              width="50"
              height="50"
              className="d-inline-block align-top logo-img"
              alt="LLLMS logo"
            />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/">Home</Nav.Link>
            <Nav.Link href="/about">About us</Nav.Link>
            <Nav.Link href="/contact">Contact us</Nav.Link>
            

          </Nav>
          <Nav className="justify-content-end">
            <Navbar.Collapse className="justify-content-end">
              <Navbar.Text>
                <SignInComponent />
              </Navbar.Text>
            </Navbar.Collapse>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}