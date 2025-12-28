import React from 'react';
import { Link } from 'react-router-dom';

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
  
  const getStepStyle = (isCompleted, isActive) => {
    if (isCompleted) {
      return "text-green-600 font-bold border-b-2 border-green-600 pb-1 hover:text-green-800 transition duration-300"; 
    } else if (isActive) {
      return "text-blue-600 font-bold border-b-2 border-blue-600 pb-1 cursor-default"; 
    } else {
      return "text-gray-400 cursor-not-allowed"; 
    }
  };

  const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <nav className="flex justify-center items-center mb-8 mt-4" aria-label="Checkout Progress">
      
      {/* first step : Login*/}
      <div className="flex items-center">
        {step1 ? (
          <Link to='/login' className={getStepStyle(true, false)}>Login</Link>
        ) : (
          <span className={getStepStyle(false, true)}>Login</span>
        )}
      </div>

      <ArrowIcon />

      {/* step 2 : shiping */}
      <div className="flex items-center">
        {step2 ? (
          <Link to='/shipping' className={getStepStyle(step3, true)}>Shipping</Link>
        ) : (
          <span className={getStepStyle(false, false)}>Shipping</span>
        )}
      </div>

      <ArrowIcon />

      {/*  step 3 : payment */}
      <div className="flex items-center">
        {step3 ? (
          <Link to='/payment' className={getStepStyle(step4, true)}>Payment</Link>
        ) : (
          <span className={getStepStyle(false, false)}>Payment</span>
        )}
      </div>

      <ArrowIcon />

      {/* step 4 : order confirmation */}
      <div className="flex items-center">
        {step4 ? (
          <Link to='/placeorder' className={getStepStyle(true, true)}>Place Order</Link>
        ) : (
          <span className={getStepStyle(false, false)}>Place Order</span>
        )}
      </div>
      
    </nav>
  );
}

export default CheckoutSteps;