'use client'; 
import { Container, Row, Col } from 'react-bootstrap';

export default function Footer() {
  return (
    <footer className="mt-auto py-3 bg-dark text-white">
      <Container>
        <Row>
          <Col md={3} className="text-center text-md-left">
            &copy; {new Date().getFullYear()} LLLMS
          </Col>
          <Col md={6} className="text-center">
            <a href="/about" className="text-white mx-2">About Us</a>
            <a href="/contact" className="text-white mx-2">Contact Us</a>
            <a href="/terms_and_conditions" className="text-white mx-2">Terms and Conditions</a>
            <a href="/privacy_policy" className="text-white mx-2">Privacy Policy</a>
          </Col>
          <Col md={3} className="text-center text-md-right">
            {/* Add social media icons here (e.g., using react-icons) */}
            <span className="mx-2">Social Links</span>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};
