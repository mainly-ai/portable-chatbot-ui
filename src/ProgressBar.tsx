import React, { useState, useEffect } from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  id: string;
  progress: number;
  total: number;
  status: string;
}

const activeProgressBars = new Map<string, { progress: number; status: string }>();

const useProgressBar = (id: string, progress: number, total: number, status: string) => {
  useEffect(() => {
    if (progress < total) {
      activeProgressBars.set(id, { progress, status });
    } else {
      activeProgressBars.delete(id);
    }
  }, [id, progress, total, status]);

  return (progress / total) * 100;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ id, progress, total, status }) => {
  const percentage = useProgressBar(id, progress, total, status);

  return (
    <div className="progress-bar" id={id}>
      <div className="progress-bar__fill" style={{ width: `${percentage}%` }}></div>
      <div className="progress-bar__status">{status}</div>
    </div>
  );
};

export default ProgressBar;
