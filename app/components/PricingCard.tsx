import React from 'react';

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
}

export default function PricingCard({ 
  title, 
  price, 
  period, 
  description, 
  features, 
  isPopular = false, 
  buttonText, 
  buttonVariant 
}: PricingCardProps) {
  return (
    <div className={`relative bg-white rounded-2xl shadow-lg p-8 ${isPopular ? 'ring-2 ring-blue-600 scale-105' : ''} hover:shadow-xl transition-all duration-300`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            最受欢迎
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">{price}</span>
          <span className="text-gray-600 ml-2">{period}</span>
        </div>
        
        <button 
          className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
            buttonVariant === 'primary' 
              ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-lg btn-primary' 
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {buttonText}
        </button>
      </div>
      
      <div className="mt-8">
        <h4 className="font-semibold text-gray-900 mb-4">功能包含：</h4>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 