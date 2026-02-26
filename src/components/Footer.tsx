'use client'; 
import { Container, Row, Col } from 'react-bootstrap';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto py-3 bg-dark text-white">
      <Container>
        <Row>
          <Col md={3} className="text-center text-md-left">
            &copy; {new Date().getFullYear()} LLLMS
          </Col>
          <Col md={6} className="text-center">
            <Link href="/about" className="text-white mx-2">О нас</Link>
            <Link href="/contact" className="text-white mx-2">Свяжись с нами</Link>
            <Link href="/terms_and_conditions" className="text-white mx-2">Пользовательское соглашение</Link>
            <Link href="/privacy_policy" className="text-white mx-2">Политика конфиденциальности</Link>
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
