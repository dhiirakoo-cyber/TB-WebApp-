import React, { useState } from 'react';

const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
        isCopied ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
      }`}
    >
      {isCopied ? 'Copied! / Qabameera!' : 'Copy / Koppii godhi'}
    </button>
  );
};

export default CopyButton;
