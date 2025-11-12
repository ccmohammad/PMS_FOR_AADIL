'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaMedkit, FaBars, FaTimes } from 'react-icons/fa';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed w-full z-30 transition-all duration-300 ${
        scrolled 
          ? 'bg-white dark:bg-gray-900 shadow-md py-2' 
          : 'bg-transparent py-4 backdrop-blur-sm bg-black/5 dark:bg-black/20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <div className={`h-9 w-9 rounded-md flex items-center justify-center ${scrolled ? 'bg-blue-600' : 'bg-blue-600'}`}>
                <FaMedkit className="h-5 w-5 text-white" />
              </div>
              <span className={`ml-2 text-xl font-bold ${scrolled ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                PharmacyNext AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link 
              href="#features" 
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white' : 'text-gray-800 hover:text-blue-600 dark:text-gray-100 dark:hover:text-white'
              }`}
            >
              AI Features
            </Link>
            <Link 
              href="#testimonials" 
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white' : 'text-gray-800 hover:text-blue-600 dark:text-gray-100 dark:hover:text-white'
              }`}
            >
              Testimonials
            </Link>
            <Link 
              href="#" 
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white' : 'text-gray-800 hover:text-blue-600 dark:text-gray-100 dark:hover:text-white'
              }`}
            >
              Pricing
            </Link>
            <Link 
              href="#" 
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white' : 'text-gray-800 hover:text-blue-600 dark:text-gray-100 dark:hover:text-white'
              }`}
            >
              Contact
            </Link>
          </div>

          {/* Demo Button */}
          <div className="hidden md:flex md:items-center">
            <Link href="/auth/login" target="_blank">
              <button 
                className={`ml-8 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  scrolled 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Try Admin Demo
              </button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-md focus:outline-none ${
                scrolled 
                  ? 'text-gray-700 dark:text-gray-300' 
                  : 'text-gray-800 dark:text-gray-100'
              }`}
            >
              {isOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 shadow-lg">
          <Link 
            href="#features" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
            onClick={() => setIsOpen(false)}
          >
            AI Features
          </Link>
          <Link 
            href="#testimonials" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
            onClick={() => setIsOpen(false)}
          >
            Testimonials
          </Link>
          <Link 
            href="#" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
            onClick={() => setIsOpen(false)}
          >
            Pricing
          </Link>
          <Link 
            href="#" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
            onClick={() => setIsOpen(false)}
          >
            Contact
          </Link>
          <Link 
            href="/auth/login" 
            target="_blank"
            className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsOpen(false)}
          >
            Try Admin Demo
          </Link>
        </div>
      </div>
    </nav>
  );
} 