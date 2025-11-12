'use client';

import Link from 'next/link';
import { FaMedkit, FaTwitter, FaFacebook, FaLinkedin, FaGithub } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center">
                <FaMedkit className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">PharmacyNext AI</span>
            </div>
            <p className="text-gray-400 mb-4">
              AI-powered smart pharmacy management system. Revolutionize operations with prescription processing, drug interaction checking, and intelligent inventory management.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaTwitter />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaFacebook />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaLinkedin />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaGithub />
              </a>
            </div>
          </div>
          
          {/* Links columns */}
          <div className="col-span-1">
            <h3 className="text-white text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-gray-400 hover:text-gray-300 transition-colors">AI Features</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Pricing</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Release Notes</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-white text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Contact</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Partners</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-white text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Community</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Status</Link></li>
              <li><Link href="/auth/login" target="_blank" className="text-gray-400 hover:text-gray-300 transition-colors">Admin Demo</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">
            &copy; {currentYear} PharmacyNext AI. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors text-sm">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-400 hover:text-gray-300 transition-colors text-sm">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 