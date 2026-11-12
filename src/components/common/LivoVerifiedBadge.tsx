import React from 'react';

interface LivoVerifiedBadgeProps {
  size?: number;
  className?: string;
  title?: string;
}

export const LivoVerifiedBadge: React.FC<LivoVerifiedBadgeProps> = ({
  size = 16,
  className = '',
  title = 'حساب موثق رسمياً بالعلامة الزرقاء'
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none align-middle ${className}`}
      title={title}
      style={{ width: size, height: size }}
    >
      {/* Exact 14-pointed blue rosette star with white checkmark matching 8898bb0a44138258857b75686a98d9f5.jpg */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Blue Rosette Star */}
        <path
          d="M12 1L14.39 3.16L17.58 2.82L18.89 5.75L21.93 6.78L21.94 10L23.95 12L21.94 14L21.93 17.22L18.89 18.25L17.58 21.18L14.39 20.84L12 23L9.61 20.84L6.42 21.18L5.11 18.25L2.07 17.22L2.06 14L0.05 12L2.06 10L2.07 6.78L5.11 5.75L6.42 2.82L9.61 3.16L12 1Z"
          fill="#1D9BF0"
        />
        {/* Inner White Checkmark */}
        <path
          d="M9.8 16.2L6.3 12.7L7.7 11.3L9.8 13.4L16.3 6.9L17.7 8.3L9.8 16.2Z"
          fill="white"
        />
      </svg>
    </span>
  );
};
