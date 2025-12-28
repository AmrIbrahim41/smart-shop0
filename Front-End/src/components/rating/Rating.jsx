import React, { memo } from 'react';
import PropTypes from 'prop-types'; 
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const Rating = ({ value, text, color = '#f8e825' }) => {
  return (
    <div className="flex items-center gap-1 mb-2" aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((rate) => (
        <span key={rate} style={{ color }} className="text-sm">
          {value >= rate ? (
            <FaStar />
          ) : value >= rate - 0.5 ? (
            <FaStarHalfAlt />
          ) : (
            <FaRegStar />
          )}
        </span>
      ))}
      {text && (
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-2">
          {text}
        </span>
      )}
    </div>
  );
};

Rating.propTypes = {
  value: PropTypes.number.isRequired,
  text: PropTypes.string,
  color: PropTypes.string,
};

export default memo(Rating);