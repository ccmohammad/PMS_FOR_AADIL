import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { Toaster } from 'react-hot-toast';
import Providers from './providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PharmacyNext AI - Smart Pharmacy Management System",
  description: "AI-powered smart pharmacy management system with prescription processing, drug interaction checking, and intelligent inventory management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 to-gray-50 min-h-screen`}>
        <Providers>
          <AuthProvider>
            <ToastProvider>
              <div className="transition-all duration-300 ease-in-out">
                {children}
              </div>
            </ToastProvider>
          </AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
