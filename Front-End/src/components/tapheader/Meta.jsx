import React, { memo } from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const Meta = ({ 
  title = 'Welcome To SmartShop', 
  description = 'We sell the best products for cheap', 
  keywords = 'electronics, buy electronics, cheap electronics' 
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
};


Meta.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
};

export default memo(Meta);