import React from "react";

type AddMatchModalProps = {
  open: boolean;
  url: string;
  error: string;
  onClose: () => void;
  onChange: (value: string) => void;
  onSubmit: (matchDataJSONString: string) => void;
  setError: (value: string) => void;
  loading?: boolean;
};

const AddMatchModal: React.FC<AddMatchModalProps> = ({
  open,
  url,
  error,
  onClose,
  onChange,
  onSubmit,
  setError,
  loading = false,
}) => {
  if (!open) return null;

  // JSON validation
  const isValidJson = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onChange(value);
    if (value.trim() && !isValidJson(value)) {
      setError("Input is not valid JSON");
    } else {
      setError("");
    }
  };

  const handleButtonClick = () => {
    if (!url.trim()) {
      setError("Match summary JSON is required");
      return;
    }
    if (!isValidJson(url)) {
      setError("Input is not valid JSON");
      return;
    }
    onSubmit(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="fixed inset-0 sm:hidden flex items-end justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0" />
      </div>
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-lg shadow-lg p-6 mx-2 sm:mx-0
          sm:mt-0 sm:mb-0
          sm:animate-fadeIn
          sm:top-auto sm:left-auto
          flex flex-col gap-4
          sm:items-center
          transition-all
          rounded-t-2xl
          sm:rounded-lg
          mt-auto
          sm:mt-0
          "
        style={{
          maxWidth: "100vw",
          bottom: 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Add Match</h2>
        <label className="text-sm font-medium text-gray-700">Match summary JSON<span className="text-red-500">*</span></label>
        <textarea
          className="border border-gray-300 text-gray-900 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y min-h-[60px] placeholder-gray-400"
          placeholder="Enter match summary JSON"
          value={url}
          onChange={handleChange}
          required
          disabled={loading}
          rows={3}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="flex-1 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 font-semibold disabled:opacity-60"
            disabled={loading}
            onClick={handleButtonClick}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMatchModal; 