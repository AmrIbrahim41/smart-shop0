import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Paginate = ({ pages, page, keyword = '', isAdmin = false }) => {
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const currentKeyword = sp.get('keyword') || keyword;

  const getUrl = (pageNumber) => {
    if (isAdmin) {
      return `/admin/productlist/${pageNumber}`;
    } else {
      return currentKeyword 
        ? `/?keyword=${currentKeyword}&page=${pageNumber}` 
        : `/?page=${pageNumber}`;
    }
  };

  if (pages <= 1) return null;

  return (
    <div className="flex justify-center items-center mt-10 gap-2">
      
      <Link
        to={getUrl(page > 1 ? page - 1 : 1)}
        className={`p-2 rounded-lg border ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}
      >
        <FaChevronLeft />
      </Link> 
     

      {/* pages number*/}
      {Array.from({ length: pages }, (_, i) => i + 1).map((x) => (
        <Link
          key={x}
          to={getUrl(x)}
          className={`
            px-4 py-2 rounded-lg font-bold transition-all duration-300 flex items-center justify-center
            ${
              x === page
                ? 'bg-primary text-white shadow-lg transform scale-105' // Active State
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700' // Inactive State
            }
          `}
        >
          {x}
        </Link>
      ))}

      <Link
        to={getUrl(page < pages ? page + 1 : pages)}
        className={`p-2 rounded-lg border ${page === pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}
      >
        <FaChevronRight />
      </Link> 
     
      
    </div>
  );
};

export default Paginate;