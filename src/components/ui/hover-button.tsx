import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  glowColor?: string;
  backgroundColor?: string;
  textColor?: string;
  hoverTextColor?: string;
  href?: string;
}

const HoverButton: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
  backgroundColor = '#d04231',
  textColor = '#fff8e7',
  href,
}) => {
  const commonClassName = `
    inline-flex items-center justify-center px-6 py-3 border-2 border-[#101820]
    cursor-pointer overflow-hidden transition-all duration-200 text-xs font-bold uppercase
    tracking-[0.14em] rounded-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 active:translate-y-[2px]'} ${className}
  `;

  const commonStyle = {
    backgroundColor,
    color: textColor,
  };

  if (href) {
    return (
      <a className={commonClassName} style={commonStyle} href={href}>
        <span>{children}</span>
      </a>
    );
  }

  return (
    <button className={commonClassName} style={commonStyle} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
    </button>
  );
};

export { HoverButton };
