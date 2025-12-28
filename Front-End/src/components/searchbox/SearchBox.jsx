import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const SearchBox = () => {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/?keyword=${keyword}&page=1`);
    } else {
      navigate('/');
    }
  };

  return (
    <form onSubmit={submitHandler} className="relative flex items-center w-full">
      <input
        type="text"
        name="q"
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search products..."
        className="
          w-full 
          py-2 pl-5 pr-12 
          rounded-full 
          text-sm 
          outline-none 
          transition-all duration-300
          
          /* ☀️ Light Mode Styles */
          bg-gray-100 
          text-gray-800 
          placeholder-gray-500 
          focus:bg-white 
          focus:ring-2 
          focus:ring-primary/50
          border border-transparent

          /* 🌙 Dark Mode Styles */
          dark:bg-white/5 
          dark:text-white 
          dark:placeholder-gray-400 
          dark:focus:bg-black/20
          dark:focus:border-primary/50
        "
      />
      
      <button 
        type="submit" 
        className="
          absolute right-4 
          text-gray-400 
          hover:text-primary 
          dark:text-gray-400 
          dark:hover:text-primary 
          transition-colors duration-300
        "
        aria-label="Search"
      >
        <FaSearch />
      </button>
    </form>
  );
};

export default SearchBox;