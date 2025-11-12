'use client';

import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';

export default function CtaSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-left md:max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Revolutionize Your Pharmacy with AI?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              Experience the future of pharmacy management with AI-powered prescription processing, drug interaction checking, and smart inventory management.
            </p>
          </div>
          
          <div className="mt-8 md:mt-0 flex flex-col sm:flex-row gap-4 justify-center md:justify-end">
            <Link href="/auth/login" target="_blank">
              <button className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl">
                Try Admin Demo
              </button>
            </Link>
            <Link href="#features">
              <button className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md text-white bg-transparent border border-white hover:bg-white/10 transition-all flex items-center justify-center">
                Learn More
                <FaArrowRight className="ml-2" />
              </button>
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-white text-4xl font-bold mb-2">AI</div>
            <h3 className="text-xl font-semibold text-white mb-2">Powered Features</h3>
            <p className="text-blue-100">
              Experience cutting-edge AI technology for prescription processing and drug safety.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-white text-4xl font-bold mb-2">Smart</div>
            <h3 className="text-xl font-semibold text-white mb-2">Inventory Management</h3>
            <p className="text-blue-100">
              AI-powered predictions and automated reordering for optimal stock management.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-white text-4xl font-bold mb-2">Safe</div>
            <h3 className="text-xl font-semibold text-white mb-2">Drug Interactions</h3>
            <p className="text-blue-100">
              Automatic drug interaction checking to ensure patient safety and compliance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 