import React, { useEffect } from 'react';

const TickAnimationModal = ({ open, onClose, message }: { open: boolean; onClose: () => void; message?: string }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => onClose(), 1200);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center animate-fade-in">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="38" fill="#f0fdf4" stroke="#4ade80" strokeWidth="4" />
          <path d="M24 42L36 54L56 32" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dasharray" from="0,100" to="40,60" dur="0.5s" fill="freeze" />
            <animate attributeName="stroke-dashoffset" from="40" to="0" dur="0.5s" fill="freeze" />
          </path>
        </svg>
        <div className="mt-4 text-green-700 text-lg font-semibold transition-opacity duration-500 opacity-100">
          {message || 'Settled Up!'}
        </div>
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default TickAnimationModal; 