import React from 'react';

/**
 * Official LIVO Customer Launcher Icon
 * Using official asset extracted from user files: /assets/livo/customer_icon.jpg
 */
export const LivoCustomerAppIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 56,
  className = ''
}) => (
  <div
    style={{ width: size, height: size }}
    className={`relative rounded-2xl overflow-hidden shadow-lg shadow-purple-900/30 shrink-0 select-none ${className}`}
  >
    <img
      src="/assets/livo/customer_icon.jpg"
      alt="LIVO Customer"
      className="w-full h-full object-cover"
      onError={(e) => {
        // Fallback to SVG if image fails
        e.currentTarget.style.display = 'none';
      }}
    />
  </div>
);

/**
 * Official LIVO Admin Launcher Icon
 * Using official asset extracted from user files: /assets/livo/admin_icon.png
 * Features the golden crown on top and LIVO ADMIN badge with gear
 */
export const LivoAdminAppIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 56,
  className = ''
}) => (
  <div
    style={{ width: size, height: size }}
    className={`relative rounded-2xl overflow-hidden shadow-lg shadow-amber-500/20 shrink-0 select-none ${className}`}
  >
    <img
      src="/assets/livo/admin_icon.png"
      alt="LIVO Admin"
      className="w-full h-full object-cover"
      onError={(e) => {
        // Fallback to SVG if image fails
        e.currentTarget.style.display = 'none';
      }}
    />
  </div>
);
