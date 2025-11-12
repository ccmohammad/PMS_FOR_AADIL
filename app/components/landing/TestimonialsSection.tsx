'use client';

import { useState } from 'react';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';

const testimonials = [
  {
    id: 1,
    content: "This pharmacy management system has transformed our operations. We've reduced inventory errors by 90% and increased our daily transaction speed significantly.",
    author: "Dr. Sarah Johnson",
    position: "Pharmacy Owner",
    rating: 5,
    avatar: "/avatars/avatar-1.jpg" // You can replace with actual avatar images
  },
  {
    id: 2,
    content: "The reporting features are incredible. I can track sales trends, inventory levels, and employee performance all from one dashboard. It's been a game-changer for our pharmacy.",
    author: "Michael Chen",
    position: "Pharmacy Manager",
    rating: 5,
    avatar: "/avatars/avatar-2.jpg"
  },
  {
    id: 3,
    content: "Customer service is exceptional. Whenever we've had questions or needed help, the support team has been responsive and knowledgeable. Highly recommend!",
    author: "Amina Patel",
    position: "Pharmacist",
    rating: 4,
    avatar: "/avatars/avatar-3.jpg"
  }
];

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };
  
  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Trusted by Pharmacies Worldwide
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Hear what our customers have to say about their experience
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out" 
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id} 
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 md:p-10">
                    <div className="flex items-center mb-6">
                      <div className="relative">
                        <div className="h-16 w-16 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                          {/* If you have actual avatars, you can use them here */}
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-white">
                            {testimonial.author.split(' ').map(name => name[0]).join('')}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{testimonial.author}</h4>
                        <p className="text-gray-600 dark:text-gray-400">{testimonial.position}</p>
                        <div className="flex mt-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i} 
                              className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <FaQuoteLeft className="absolute -top-2 -left-2 h-8 w-8 text-blue-100 dark:text-blue-900/30" />
                      <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed pl-6">
                        {testimonial.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-center mt-8 space-x-4">
            <button 
              onClick={prevTestimonial}
              className="p-2 rounded-full bg-white dark:bg-gray-700 shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              aria-label="Previous testimonial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={nextTestimonial}
              className="p-2 rounded-full bg-white dark:bg-gray-700 shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              aria-label="Next testimonial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  activeIndex === index 
                    ? 'w-8 bg-blue-500 dark:bg-blue-400' 
                    : 'w-2 bg-gray-300 dark:bg-gray-600'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 