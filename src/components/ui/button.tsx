import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-[0.12em] rounded-none transition-transform duration-200 whitespace-nowrap cursor-pointer border-2 border-[#101820] active:translate-y-[2px]';

    const variants = {
      primary: 'bg-[#d04231] hover:bg-[#b83629] text-[#fff8e7]',
      secondary: 'bg-[#46499a] hover:bg-[#353878] text-[#fff8e7]',
      success: 'bg-[#2f8f46] hover:bg-[#257239] text-[#fff8e7]',
      danger: 'bg-[#101820] hover:bg-[#000000] text-[#fff8e7]',
      outline: 'bg-transparent hover:bg-[#101820] text-[#101820] hover:text-[#fff8e7]',
    };

    const sizes = {
      sm: 'py-2 px-3 text-[11px]',
      md: 'py-3 px-5 text-xs',
      lg: 'py-4 px-7 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
