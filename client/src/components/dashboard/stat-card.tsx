import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  linkUrl: string;
  linkText: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  linkUrl, 
  linkText 
}) => {
  return (
    <Card className="bg-white overflow-hidden shadow">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <Link href={linkUrl} className="font-medium text-primary-600 hover:text-primary-700">
            {linkText}
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
