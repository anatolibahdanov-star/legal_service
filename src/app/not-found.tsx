import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>404 - Page Not Found</h1>
      <p>Oops! The page you are looking for does not exist.</p>
      <Link href="/">
        <button style={{ marginTop: '20px' }}>Go Back Home</button>
      </Link>
    </div>
  );
}