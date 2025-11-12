'use client';

import { motion } from 'framer-motion';
import { FaMedkit, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-16 pb-24 md:pt-20 md:pb-32 lg:pt-24 lg:pb-40 flex flex-col md:flex-row items-center">
          {/* Left column - Text content */}
          <motion.div 
            className="text-center md:text-left md:w-1/2 mb-12 md:mb-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center mr-2">
                <FaMedkit className="h-3 w-3 text-white" />
              </div>
              <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                AI-Powered Smart Pharmacy System
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              <span className="block">AI-Powered Smart</span>
              <span className="block text-blue-600 dark:text-blue-400">Pharmacy Management</span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-md mx-auto md:mx-0">
              Revolutionize your pharmacy with AI-powered prescription processing, drug interaction checking, and smart inventory management.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/auth/login" target="_blank">
                <button className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl">
                  Try Admin Demo
                </button>
              </Link>
              <Link href="#features">
                <button className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 dark:text-blue-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-all flex items-center justify-center">
                  Explore Features
                  <FaArrowRight className="ml-2" />
                </button>
              </Link>
            </div>
          </motion.div>
          
          {/* Right column - Image/Illustration */}
          <motion.div 
            className="md:w-1/2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur-3xl opacity-20 dark:opacity-40"></div>
              <div className="relative rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
                <div className="h-6 bg-gray-100 dark:bg-gray-700 flex items-center px-4">
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="h-[300px] md:h-[350px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
                  <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">Dashboard Overview</h3>
                      <div className="flex space-x-2">
                        <div className="h-2 w-16 bg-blue-400 rounded-full"></div>
                        <div className="h-2 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 p-4 grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 flex flex-col">
                          <div className="h-2 w-12 bg-blue-200 dark:bg-blue-400 rounded-full mb-2"></div>
                          <div className="h-8 w-16 bg-blue-500 dark:bg-blue-600 rounded-md"></div>
                          <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                          <div className="mt-1 h-2 w-3/4 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 