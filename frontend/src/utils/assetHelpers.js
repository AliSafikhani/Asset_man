// frontend/src/utils/assetHelpers.js
import React from 'react';
import { FaBolt, FaCogs, FaBox } from 'react-icons/fa';
import { MdTransform } from 'react-icons/md';
import { STATUS_BADGES } from '../constants/assetConstants';

// ---- Badge helper ----
export const getBadge = (type, status, statusCode) => {
  const badges = STATUS_BADGES[type];
  if (type === 'IEEE') {
    let mapped = status;
    if (status === 'Action Required' || statusCode === 3 || statusCode === 4) mapped = 'Action Required';
    else if (status === 'Normal' || statusCode === 1) mapped = 'Normal';
    else if (status === 'Investigate' || statusCode === 2) mapped = 'Investigate';
    else mapped = 'Unknown';
    return badges[mapped] || badges.Unknown;
  }
  return badges[status] || badges.Unknown;
};

// ---- Asset icon helpers (using React.createElement to avoid JSX) ----
export const getAssetIcon = (type) => {
  const icons = {
    generator: React.createElement(FaBolt, { size: 28, color: '#f59e0b' }),
    transformer: React.createElement(MdTransform, { size: 28, color: '#8b5cf6' }),
    motor: React.createElement(FaCogs, { size: 28, color: '#06b6d4' }),
  };
  return icons[type] || React.createElement(FaBox, { size: 28, color: '#64748b' });
};

export const getAssetTypeColor = (type) => {
  const colors = { generator: '#f59e0b', transformer: '#8b5cf6', motor: '#06b6d4' };
  return colors[type] || '#64748b';
};

// ---- Age helper ----
export const calculateAge = (date) => {
  if (!date) return 'N/A';
  const years = new Date().getFullYear() - new Date(date).getFullYear();
  return years >= 0 ? years : 'N/A';
};

// ---- Duplicate date helpers ----
export const getDuplicateDateInfo = (testDate, testResults) => {
  const duplicates = testResults.filter(r => r.test_date === testDate);
  if (duplicates.length > 1) {
    return {
      count: duplicates.length,
      isDuplicate: true,
      message: `This date has ${duplicates.length} test results`,
    };
  }
  return { isDuplicate: false, count: 0, message: '' };
};

export const getDuplicateDateStyle = (testDate, testResults, resultId) => {
  const duplicates = testResults.filter(r => r.test_date === testDate);
  if (duplicates.length > 1) {
    const duplicateIndex = duplicates.findIndex(r => r.id === resultId);
    const shades = ['#ebf5ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa'];
    const borderColors = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'];
    return {
      backgroundColor: shades[duplicateIndex % shades.length],
      borderLeft: `4px solid ${borderColors[duplicateIndex % borderColors.length]}`,
      transition: 'background-color 0.2s ease',
    };
  }
  return {};
};