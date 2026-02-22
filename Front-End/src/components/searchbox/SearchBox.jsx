import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const SearchBox = () => {
  const [keyword, setKeyword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  // Populate search from URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlKeyword = searchParams.get('keyword');
    if (urlKeyword) {
      setKeyword(urlKeyword);
    }
  }, [location.search]);

  const submitHandler = useCallback((e) => {
    e.preventDefault();
    
    const trimmedKeyword = keyword.trim();
    
    if (trimmedKeyword) {
      navigate(`/?keyword=${encodeURIComponent(trimmedKeyword)}&page=1`);
      inputRef.current?.blur();
    } else {
      navigate('/');
    }
  }, [keyword, navigate]);

  const clearSearch = useCallback(() => {
    setKeyword('');
    navigate('/');
    inputRef.current?.focus();
  }, [navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
      setIsFocused(false);
    }
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={submitHandler} className="relative flex items-center">
        <motion.div
          animate={{
            boxShadow: isFocused
              ? '0 10px 40px -10px rgba(255, 107, 0, 0.2)'
              : '0 0 0 0 rgba(255, 107, 0, 0)',
          }}
          transition={{ duration: 0.2 }}
          className="relative w-full"
        >
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            <FaSearch size={16} />
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            name="q"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Search for products, brands, categories..."
            aria-label="Search products"
            className="
              w-full 
              py-3 md:py-3.5
              pl-12 pr-12
              rounded-full 
              text-sm md:text-base
              outline-none 
              transition-all duration-300
              
              bg-gray-100 dark:bg-white/5
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              
              border-2 border-transparent
              focus:border-primary/50 dark:focus:border-primary/50
              focus:bg-white dark:focus:bg-black/20
              
              hover:bg-white dark:hover:bg-white/10
            "
          />

          {/* Clear Button */}
          <AnimatePresence>
            {keyword && (
              <motion.button
                type="button"
                onClick={clearSearch}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Clear search"
              >
                <FaTimes size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Hidden Submit Button for Accessibility */}
        <button type="submit" className="sr-only" aria-label="Submit search">
          Search
        </button>
      </form>

      {/* Focus Indicator */}
      <AnimatePresence>
        {isFocused && !keyword && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Try searching for "laptop", "phone", or "headphones"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBox;