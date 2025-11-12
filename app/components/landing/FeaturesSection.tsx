'use client';

import { motion } from 'framer-motion';
import { 
  FaMedkit, 
  FaUserMd, 
  FaChartLine, 
  FaShieldAlt, 
  FaMobileAlt, 
  FaRegClock,
  FaRobot,
  FaCamera,
  FaExclamationTriangle,
  FaSearch,
  FaBrain,
  FaCogs
} from 'react-icons/fa';

const features = [
  {
    icon: <FaCamera className="h-6 w-6 text-purple-500" />,
    title: 'AI Prescription Processing',
    description: 'Scan prescriptions with AI-powered handwriting recognition and automatically extract medication details.'
  },
  {
    icon: <FaExclamationTriangle className="h-6 w-6 text-red-500" />,
    title: 'Drug Interaction Checker',
    description: 'Automatically detect dangerous drug interactions and provide safety alerts for patient protection.'
  },
  {
    icon: <FaSearch className="h-6 w-6 text-blue-500" />,
    title: 'AI Product Search',
    description: 'Search products using natural language queries like "headache medicine" or "blood pressure medication".'
  },
  {
    icon: <FaBrain className="h-6 w-6 text-green-500" />,
    title: 'Smart Inventory Predictions',
    description: 'Get AI-powered demand forecasting and intelligent reorder recommendations for optimal stock management.'
  },
  {
    icon: <FaMedkit className="h-6 w-6 text-blue-500" />,
    title: 'Advanced Inventory Management',
    description: 'Track medications, manage stock levels, and automate reordering with our comprehensive inventory system.'
  },
  {
    icon: <FaUserMd className="h-6 w-6 text-blue-500" />,
    title: 'Smart Sales & Billing',
    description: 'Process sales quickly with AI assistance, generate professional invoices, and manage customer accounts.'
  },
  {
    icon: <FaChartLine className="h-6 w-6 text-blue-500" />,
    title: 'AI Analytics Dashboard',
    description: 'Gain valuable insights with AI-powered reports on sales trends, inventory predictions, and business performance.'
  },
  {
    icon: <FaCogs className="h-6 w-6 text-orange-500" />,
    title: 'Smart Expiry Management',
    description: 'AI-powered alerts for expiring medications with intelligent disposal recommendations and cost optimization.'
  },
  {
    icon: <FaShieldAlt className="h-6 w-6 text-blue-500" />,
    title: 'Secure Access Control',
    description: 'Protect your data with role-based access control and secure authentication for your team.'
  }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            AI-Powered Features for Smart Pharmacies
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Revolutionize your pharmacy with cutting-edge AI technology that automates processes and enhances patient safety
          </p>
        </div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
              variants={itemVariants}
            >
              <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
} 