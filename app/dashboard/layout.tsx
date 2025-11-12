'use client';

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/layout/Sidebar';
import { Bell } from "lucide-react";

const sidebarNavItems = [
  {
    title: "Stock Alerts",
    href: "/dashboard/stock-alerts",
    icon: <Bell className="h-4 w-4" />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  // If the user is not authenticated, redirect to the login page
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
          <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-4 border-b-4 border-blue-200 animate-ping"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-auto p-3 md:p-6 pt-16 md:pt-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
} 