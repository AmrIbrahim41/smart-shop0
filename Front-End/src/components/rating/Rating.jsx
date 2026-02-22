import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Rating = ({ value = 0, text, color = '#FBBF24', size = 'md', showValue = false, interactive = false, onChange }) => {
  // 1. تحويل القيمة لرقم آمن عشان نتفادى خطأ toFixed
  const safeValue = Number(value) || 0;

  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  const renderStar = (rate, index) => {
    let StarIcon;
    // استخدم safeValue بدل value
    if (safeValue >= rate) {
      StarIcon = FaStar;
    } else if (safeValue >= rate - 0.5) {
      StarIcon = FaStarHalfAlt;
    } else {
      StarIcon = FaRegStar;
    }

    const starElement = (
      <motion.span
        key={rate}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        style={{ color }}
        className={`${sizes[size]} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        onClick={() => interactive && onChange && onChange(rate)}
        onKeyPress={(e) => {
          if (interactive && onChange && (e.key === 'Enter' || e.key === ' ')) {
            onChange(rate);
          }
        }}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? `Rate ${rate} stars` : undefined}
      >
        <StarIcon />
      </motion.span>
    );

    return starElement;
  };

  return (
    <div
      className="flex items-center gap-1"
      role="img"
      // استخدم safeValue.toFixed
      aria-label={`Rating: ${safeValue.toFixed(1)} out of 5 stars${text ? `, ${text}` : ''}`}
    >
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((rate, index) => renderStar(rate, index))}
      </div>

      {/* Rating Value (Optional) */}
      {showValue && (
        <span className={`${textSizes[size]} font-bold text-gray-700 dark:text-gray-300 ml-1`}>
          {/* استخدم safeValue.toFixed */}
          {safeValue.toFixed(1)}
        </span>
      )}

      {/* Review Text (Optional) */}
      {text && (
        <span className={`${textSizes[size]} font-semibold text-gray-500 dark:text-gray-400 ml-2`}>
          {text}
        </span>
      )}
    </div>
  );
};

// 2. تعديل الـ PropTypes عشان يقبل String أو Number
Rating.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  text: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  showValue: PropTypes.bool,
  interactive: PropTypes.bool,
  onChange: PropTypes.func,
};

export default memo(Rating);