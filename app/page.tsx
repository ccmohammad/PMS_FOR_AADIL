'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { FaMedkit, FaUserMd, FaChartLine, FaShieldAlt, FaBook, FaRobot, FaCamera, FaExclamationTriangle, FaSearch, FaBrain } from 'react-icons/fa';
import Link from 'next/link';

const features = [
  {
    icon: <FaCamera className="h-6 w-6 text-blue-500" />,
    title: 'AI Prescription Processing',
    description: 'Scan prescriptions with AI-powered handwriting recognition',
  },
  {
    icon: <FaExclamationTriangle className="h-6 w-6 text-blue-500" />,
    title: 'Drug Interaction Checker',
    description: 'Automatically detect dangerous drug interactions',
  },
  {
    icon: <FaMedkit className="h-6 w-6 text-blue-500" />,
    title: 'Inventory Management',
    description: 'Track and manage your pharmacy inventory efficiently',
  },
  {
    icon: <FaUserMd className="h-6 w-6 text-blue-500" />,
    title: 'Sales & Billing',
    description: 'Process sales and generate professional invoices',
  },
];

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (status === 'authenticated' && session) {
      router.replace('/dashboard');
    }
  }, [session, status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Connecting to PharmacyNext AI...</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't render the login form (redirect will happen)
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to AI Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Left side - Login Form */}
        <div className="flex w-full lg:w-1/2 justify-center items-center">
          <div className="w-full max-w-md space-y-8 px-4 sm:px-6">
            <div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
                    <FaMedkit className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-purple-500 rounded-full flex items-center justify-center">
                    <FaRobot className="h-2 w-2 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                 PharmacyNext AI
              </h1>
              <p className="mt-2 text-center text-sm text-gray-600">
                Sign in to your AI-powered smart pharmacy 
              </p>
            </div>
            
            <LoginForm />

           

            {/* Documentation Link */}
            <div className="mt-4 text-center">
              <Link 
                href="/docs/index.html" 
                target="_blank"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <FaBook className="mr-2" />
                View Documentation
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Features */}
        <div className="hidden lg:flex w-1/2 bg-blue-600 p-12 items-center">
          <div className="max-w-lg mx-auto">
            <h2 className="text-4xl font-bold text-white mb-8">
              Revolutionize Your Pharmacy with AI
            </h2>
            
            <div className="grid grid-cols-1 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm"
                >
                  <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-blue-100">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 