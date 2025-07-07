import React from "react";

interface AddExpenseModalProps {
  initialData?: { description: string; amount: number } | null;
  onSave: (data: { description: string; amount: number }) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ initialData, onSave, onCancel, isEdit }) => {
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [amount, setAmount] = React.useState(initialData?.amount?.toString() || "");
  const [error, setError] = React.useState("");

  const handleSave = () => {
    setError("");
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    onSave({ description: description.trim(), amount: Number(amount) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-4">{isEdit ? 'Modify Expense' : 'Add Expense'}</h2>
          <div className="mb-4">
            <label className="mb-1 font-medium text-gray-700 block">Description</label>
            <input
              className="p-2 border border-gray-300 rounded text-gray-900 bg-white w-full"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this expense for?"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 font-medium text-gray-700 block">Amount (₹)</label>
            <input
              className="p-2 border border-gray-300 rounded text-gray-900 bg-white w-full"
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        </div>
        <div className="border-t bg-white px-6 py-4 flex justify-end gap-2 pb-32 md:pb-6" style={{ paddingBottom: 'max(3.5rem, env(safe-area-inset-bottom, 0px))', zIndex: 60 }}>
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal; 