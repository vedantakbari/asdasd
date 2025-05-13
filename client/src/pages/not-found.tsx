import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import LandingLayout from '../components/landing/landing-layout';

export default function NotFound() {
  return (
    <LandingLayout>
      <div className="w-full flex items-center justify-center py-20 bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2 items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 - Page Not Found</h1>
            </div>

            <p className="mt-4 text-gray-600 mb-6">
              We couldn't find the page you're looking for. It might have been moved or deleted.
            </p>
            
            <Link href="/">
              <Button className="w-full">Return to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </LandingLayout>
  );
}
