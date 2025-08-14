import React from 'react';
import { BarChart3, Clock, Shield, AlertTriangle } from 'lucide-react';

interface DetectionStatsProps {
  total: number;
  byType: Record<string, number>;
  processingTime: number;
  confidenceThreshold: number;
}

export default function DetectionStats({ 
  total, 
  byType, 
  processingTime, 
  confidenceThreshold 
}: DetectionStatsProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      credit_card: 'bg-red-100 text-red-800 border-red-200',
      drivers_license: 'bg-blue-100 text-blue-800 border-blue-200',
      passport_number: 'bg-green-100 text-green-800 border-green-200',
      ssn: 'bg-purple-100 text-purple-800 border-purple-200',
      phone: 'bg-orange-100 text-orange-800 border-orange-200',
      email: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      address: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      name: 'bg-pink-100 text-pink-800 border-pink-200',
      medical_info: 'bg-teal-100 text-teal-800 border-teal-200',
      financial_data: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      credit_card: '💳',
      drivers_license: '🪪',
      passport_number: '📄',
      ssn: '🔒',
      phone: '📞',
      email: '📧',
      address: '📍',
      name: '👤',
      medical_info: '🏥',
      financial_data: '💰',
    };
    return icons[type] || '🔍';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Detection Statistics
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(processingTime)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span>{(confidenceThreshold * 100).toFixed(0)}% confidence</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary Stats */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Detections</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Speed</p>
                <p className="text-2xl font-bold text-gray-900">{formatTime(processingTime)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Detection Types */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Detection Types</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(byType).map(([type, count]) => (
              <div
                key={type}
                className={`flex items-center justify-between p-3 rounded-lg border ${getTypeColor(type)}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(type)}</span>
                  <span className="text-sm font-medium capitalize">
                    {type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-sm font-bold">{count}</span>
              </div>
            ))}
            {Object.keys(byType).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <Shield className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No detections found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Insights</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {processingTime < 1000 ? 'Fast' : processingTime < 3000 ? 'Good' : 'Slow'}
            </div>
            <div className="text-gray-600">Processing Speed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {total > 0 ? 'Protected' : 'Clean'}
            </div>
            <div className="text-gray-600">Privacy Status</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {Object.keys(byType).length}
            </div>
            <div className="text-gray-600">PII Types Found</div>
          </div>
        </div>
      </div>
    </div>
  );
}
