import React from 'react';
import { Settings, Eye, EyeOff, Zap, Shield, Brain } from 'lucide-react';

interface AdvancedOptionsProps {
  useLLM: boolean;
  setUseLLM: (value: boolean) => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (value: number) => void;
  showAdvancedOptions: boolean;
  setShowAdvancedOptions: (value: boolean) => void;
}

export default function AdvancedOptions({
  useLLM,
  setUseLLM,
  confidenceThreshold,
  setConfidenceThreshold,
  showAdvancedOptions,
  setShowAdvancedOptions,
}: AdvancedOptionsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Advanced Detection Options
        </h3>
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {showAdvancedOptions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showAdvancedOptions ? 'Hide' : 'Show'} Options
        </button>
      </div>

      {showAdvancedOptions && (
        <div className="space-y-6">
          {/* Detection Methods */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Detection Methods</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pattern Matching */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Pattern Matching</span>
                  </div>
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Fast regex-based detection for common PII patterns
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                  <span>✓ Always enabled</span>
                  <span>• High speed</span>
                </div>
              </div>

              {/* LLM Verification */}
              <div className={`rounded-lg p-4 border transition-all ${
                useLLM 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">LLM Verification</span>
                  </div>
                  <button
                    onClick={() => setUseLLM(!useLLM)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      useLLM ? 'bg-green-600' : 'bg-gray-400'
                    }`}
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  AI-powered verification for enhanced accuracy
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                  <span>✓ Higher accuracy</span>
                  <span>• Slower processing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Confidence Threshold</h4>
              <span className="text-sm font-medium text-blue-600">
                {(confidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="space-y-3">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Low (10%)</span>
                <span>Medium (50%)</span>
                <span>High (90%)</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Confidence Level Guide:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Low (10-30%):</strong> More detections, higher false positives</li>
                    <li>• <strong>Medium (40-70%):</strong> Balanced accuracy and coverage</li>
                    <li>• <strong>High (80-100%):</strong> Fewer detections, higher accuracy</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Detection Layers Info */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              Multi-Layer Detection System
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                <span>Computer Vision: Identifies regions of interest</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600">2</div>
                <span>Pattern Matching: Fast regex-based detection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">3</div>
                <span>LLM Verification: AI-powered accuracy enhancement</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
