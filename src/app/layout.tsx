'use client'; 

// import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";
// import Header from "@/src/components/Header";
import { Header } from "@/src/app/components/header";
// import Footer from "@/src/components/Footer";
import { Footer } from "@/src/app/components/footer";
import {NextAuthProvider} from "@/src/app/providers/NextAuthProvider"
import '@/src/styles/index.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body style={{"margin":"0px"}}>
        <div className="min-h-screen bg-[#fefdf9]">
          <NextAuthProvider>
            <Header />
            {children}
            <Footer />
          </NextAuthProvider>
        </div>
      </body>
    </html>
  );
}
