import { ReactNode, MouseEventHandler } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-gray-800/50 border border-gray-700/50 rounded-xl shadow-lg backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
