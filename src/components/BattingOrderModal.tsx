import React, { useState, useEffect } from "react";
import { post } from "@/utils/request";
import { BattingOrderPlayer } from "../contexts/TeamConfigContext";
import { getConfigData } from "@/utils/JSONBlobUtils";

interface BattingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBattingOrder: BattingOrderPlayer[];
  onOrderUpdated: () => void;
}

const BattingOrderModal: React.FC<BattingOrderModalProps> = ({
  isOpen,
  onClose,
  initialBattingOrder,
  onOrderUpdated
}) => {
  const [battingOrder, setBattingOrder] = useState<BattingOrderPlayer[]>([]);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBattingOrder([...initialBattingOrder].sort((a, b) => a.battingOrder - b.battingOrder));
    }
  }, [isOpen, initialBattingOrder]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOrder = [...battingOrder];
    const draggedPlayer = newOrder[draggedIndex];
    
    // Remove dragged player
    newOrder.splice(draggedIndex, 1);
    
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedPlayer);
    
    // Update batting order numbers
    const updatedOrder = newOrder.map((player, index) => ({
      ...player,
      battingOrder: index + 1
    }));

    setBattingOrder(updatedOrder);
    setDraggedIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...battingOrder];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    
    const updatedOrder = newOrder.map((player, idx) => ({
      ...player,
      battingOrder: idx + 1
    }));
    setBattingOrder(updatedOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === battingOrder.length - 1) return;
    const newOrder = [...battingOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    
    const updatedOrder = newOrder.map((player, idx) => ({
      ...player,
      battingOrder: idx + 1
    }));
    setBattingOrder(updatedOrder);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get current config and update only the batting order
      const profileId = localStorage.getItem("cricheroes_profile_id");
      const response = await getConfigData();
      
      const updatedConfig = {
        ...response,
        battingOrder
      };

      await post("/api/update-team-config", updatedConfig, {
        headers: {
          "x-profile-id": profileId || ""
        }
      });

      alert("Batting order updated successfully!");
      onOrderUpdated();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to update batting order");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(battingOrder) !== JSON.stringify([...initialBattingOrder].sort((a, b) => a.battingOrder - b.battingOrder));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-teal-50 px-6 py-4 border-b border-teal-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
              🔄 Update Batting Order
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-teal-600 mt-1">
            Drag and drop players to reorder, or use the arrow buttons
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-3">
            {battingOrder.map((player, index) => (
              <div
                key={player.playerId}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center gap-4 p-4 border rounded-lg cursor-move transition-all ${
                  draggedIndex === index 
                    ? 'bg-teal-100 border-teal-300 shadow-lg' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {/* Batting Order Number */}
                <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {player.battingOrder}
                </div>

                {/* Player Name */}
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{player.playerName}</span>
                  <div className="text-xs text-gray-500">ID: {player.playerId}</div>
                </div>

                {/* Move Buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`p-2 rounded ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === battingOrder.length - 1}
                    className={`p-2 rounded ${
                      index === battingOrder.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>

                {/* Drag Handle */}
                <div className="text-gray-400 cursor-move">
                  ⋮⋮
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {battingOrder.length} players in batting order
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges()}
                className={`px-6 py-2 rounded font-medium ${
                  saving || !hasChanges()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattingOrderModal; 