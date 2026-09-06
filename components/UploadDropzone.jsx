import { useRef, useState } from 'react';

export default function UploadDropzone({ file, onFileSelect, disabled }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  function chooseFile() {
    if (!disabled) inputRef.current?.click();
  }

  function handleFiles(files) {
    const selectedFile = files?.[0];
    if (selectedFile) onFileSelect(selectedFile);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={chooseFile}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(event.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span className="mb-3 text-3xl" aria-hidden="true">📄</span>
        <span className="font-semibold text-slate-800">Drop your PDF here, or click to browse</span>
        <span className="mt-2 text-sm text-slate-500">PDF only · Maximum file size: 5 MB</span>
        {file && (
          <span className="mt-4 max-w-full truncate rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
            Selected: {file.name}
          </span>
        )}
      </button>
    </div>
  );
}
