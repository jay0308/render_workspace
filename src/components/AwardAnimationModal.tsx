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
        <div className="flex flex-row justify-center gap-4 mt-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`🎉 Congratulations to ${playerName} for being awarded as the Best Overall Performer! 🏏\nCheck out all the MVPs on Counterstrikers MVP's! ${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-base"
          >
            <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor"><path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.832 4.584 2.236 6.393L4 29l7.824-2.05C13.416 27.168 15.615 28 18 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-2.09 0-4.09-.545-5.824-1.55l-.416-.25-4.65 1.22 1.24-4.53-.27-.42C6.545 19.09 6 17.09 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.29-7.71c-.29-.145-1.71-.84-1.98-.935-.27-.1-.47-.145-.67.145-.2.29-.77.935-.94 1.125-.17.19-.35.21-.64.07-.29-.145-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.025-.51-.075-.145-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51-.17-.01-.36-.01-.56-.01-.19 0-.5.07-.76.36-.26.29-1 1-.99 2.43.01 1.43 1.03 2.81 1.18 3.01.14.19 2.03 3.1 4.92 4.22.69.3 1.23.48 1.65.61.69.22 1.32.19 1.81.12.55-.08 1.71-.7 1.95-1.38.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.55-.33z"/></svg>
            Share on WhatsApp
          </a>
          <button
            onClick={onClose}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AwardAnimationModal; 