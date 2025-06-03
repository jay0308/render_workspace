import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface AwardAnimationModalProps {
  open: boolean;
  onClose: () => void;
  playerName: string;
}

const AwardAnimationModal: React.FC<AwardAnimationModalProps> = ({ open, onClose, playerName }) => {
  useEffect(() => {
    if (open) {
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Cleanup
      return () => clearInterval(interval);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center relative overflow-hidden">
        <div className="animate-bounce mb-6">
          <svg 
            className="w-24 h-24 mx-auto text-yellow-500" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Congratulations!</h2>
        <p className="text-lg text-gray-600 mb-6">
          {playerName} has been awarded as the Best Overall Performer!
        </p>
        <button
          onClick={onClose}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AwardAnimationModal; 