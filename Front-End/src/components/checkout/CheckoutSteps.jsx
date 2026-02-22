import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
  
  const steps = [
    { number: 1, label: 'Login', active: step1, path: '/login' },
    { number: 2, label: 'Shipping', active: step2, path: '/shipping' },
    { number: 3, label: 'Payment', active: step3, path: '/payment' },
    { number: 4, label: 'Place Order', active: step4, path: '/placeorder' },
  ];

  return (
    <nav className="mb-10" aria-label="Checkout Progress">
      {/* Desktop View */}
      <div className="hidden md:flex justify-center items-center gap-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step Item */}
            <div className="flex items-center gap-3">
              {step.active ? (
                <Link
                  to={step.path}
                  className="group flex items-center gap-3 transition-all"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      steps[index + 1]?.active
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                        : 'bg-primary text-white shadow-lg shadow-primary/30'
                    }`}
                  >
                    {steps[index + 1]?.active ? <FaCheck size={14} /> : step.number}
                  </motion.div>
                  <span
                    className={`font-bold text-sm transition-colors ${
                      steps[index + 1]?.active
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-primary group-hover:text-orange-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 opacity-40 cursor-not-allowed">
                  <div className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center font-bold text-gray-400 dark:text-gray-600">
                    {step.number}
                  </div>
                  <span className="font-bold text-sm text-gray-400 dark:text-gray-600">
                    {step.label}
                  </span>
                </div>
              )}
            </div>

            {/* Separator */}
            {index < steps.length - 1 && (
              <FaChevronRight
                className={`text-sm ${
                  step.active ? 'text-primary' : 'text-gray-300 dark:text-gray-700'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex-1 h-2 rounded-full transition-all ${
                step.active
                  ? steps[index + 1]?.active
                    ? 'bg-green-500'
                    : 'bg-primary'
                  : 'bg-gray-200 dark:bg-gray-700'
              } ${index !== steps.length - 1 ? 'mr-2' : ''}`}
            />
          ))}
        </div>
        
        <div className="flex justify-between text-xs">
          {steps.map((step) => (
            <span
              key={step.number}
              className={`font-bold ${
                step.active
                  ? 'text-primary dark:text-primary'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default CheckoutSteps;
