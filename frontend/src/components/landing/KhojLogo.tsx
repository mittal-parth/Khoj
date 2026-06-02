import { cn } from '@/lib/utils';

const LOGO_SRC = '/khoj-logo-no-bg.png';

interface KhojLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-20 md:h-24',
  xl: 'h-28 md:h-36',
};

export function KhojLogo({ className, size, ...props }: KhojLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="Khoj — treasure hunt app"
      className={cn('object-contain w-auto', size ? sizeClasses[size] : undefined, className)}
      {...props}
    />
  );
}
