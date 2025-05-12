import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, description, actions }) => {
  const [location] = useLocation();

  // Map the current location to a title if not provided
  const getDefaultTitle = () => {
    const pathSegments = location.split('/').filter(Boolean);
    if (pathSegments.length === 0) return 'Dashboard';
    
    // Handle first segment
    const mainSegment = pathSegments[0];
    const capitalizedSegment = mainSegment.charAt(0).toUpperCase() + mainSegment.slice(1);
    
    // Handle detail pages like /leads/1 or /leads/1/edit
    if (pathSegments.length > 1) {
      const secondSegment = pathSegments[1];
      if (secondSegment === 'new') {
        return `New ${capitalizedSegment.slice(0, -1)}`;
      } else if (!isNaN(Number(secondSegment))) {
        return pathSegments.length > 2 && pathSegments[2] === 'edit'
          ? `Edit ${capitalizedSegment.slice(0, -1)}`
          : `${capitalizedSegment.slice(0, -1)} Details`;
      }
    }
    
    return capitalizedSegment;
  };

  // Use the provided title or a default based on location
  const displayTitle = title || getDefaultTitle();

  return (
    <div className="bg-white shadow-sm z-10">
      <div className="py-4 px-4 sm:px-6 lg:px-8 md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight">
            {displayTitle}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {actions && (
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
