'use client';

import { useState } from 'react';
import { DiagnosisStyle } from '@/lib/diagnosis-engine-unified';

interface StyleOption {
  value: DiagnosisStyle;
  label: string;
  icon: string;
  description: string;
}

interface MultiStyleSelectorProps {
  onStylesChange: (styles: DiagnosisStyle[]) => void;
  selectedStyles: DiagnosisStyle[];
}

export function MultiStyleSelector({ onStylesChange, selectedStyles }: MultiStyleSelectorProps) {
  const styleOptions: StyleOption[] = [
    {
      value: 'creative',
      label: 'クリエイティブ',
      icon: '🎨',
      description: '予想外の化学反応'
    },
    {
      value: 'astrological',
      label: '占星術',
      icon: '⭐',
      description: '星が導く運命'
    },
    {
      value: 'fortune',
      label: '点取り占い',
      icon: '🔮',
      description: '運勢を診断'
    },
    {
      value: 'technical',
      label: '技術分析',
      icon: '📊',
      description: 'データドリブン'
    }
  ];

  const toggleStyle = (style: DiagnosisStyle) => {
    if (selectedStyles.includes(style)) {
      onStylesChange(selectedStyles.filter(s => s !== style));
    } else {
      onStylesChange([...selectedStyles, style]);
    }
  };

  const selectAll = () => {
    onStylesChange(styleOptions.map(s => s.value));
  };

  const clearAll = () => {
    onStylesChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">診断スタイルを選択</h3>
        <div className="space-x-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            すべて選択
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            クリア
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {styleOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => toggleStyle(option.value)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200
              ${selectedStyles.includes(option.value)
                ? 'bg-purple-900/50 border-purple-500 shadow-lg shadow-purple-500/20'
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{option.icon}</span>
              <div className="text-left flex-1">
                <div className="font-bold text-white">
                  {option.label}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {option.description}
                </div>
              </div>
              {selectedStyles.includes(option.value) && (
                <div className="text-purple-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedStyles.length === 0 && (
        <p className="text-yellow-400 text-sm text-center mt-2">
          少なくとも1つのスタイルを選択してください
        </p>
      )}

      {selectedStyles.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-sm text-gray-300">
            選択中: <span className="font-bold text-purple-400">{selectedStyles.length}</span>スタイル
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {selectedStyles.length === 4 
              ? '全スタイルで診断します（約2-3秒）'
              : `${selectedStyles.length}つのスタイルで診断します`
            }
          </p>
        </div>
      )}
    </div>
  );
}