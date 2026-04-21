import React, { useState, useEffect } from 'react';
import { debounce } from 'lodash';

const HtmlPreview = ({ rawHtml, onClose }) => {
  const [htmlContent, setHtmlContent] = useState(rawHtml);

  const debouncedUpdate = debounce((newHtml) => {
    setHtmlContent(newHtml);
  }, 500);

  useEffect(() => {
    debouncedUpdate(rawHtml);
    return () => debouncedUpdate.cancel();
  }, [rawHtml]);

  const openInNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const handleRefresh = () => {
    setHtmlContent(rawHtml);
  };

  return (
    <div className="relative w-full h-full border-t border-gray-600 bg-white">
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={handleRefresh}
          className="text-white text-sm px-2 py-1 rounded hover:bg-green-600 bg-[#3D415A] transition-all"
        >
          Refresh Preview
        </button>
        <button
          onClick={openInNewTab}
          className="text-white text-sm px-2 py-1 rounded hover:bg-blue-600 bg-[#3D415A] transition-all"
        >
          Open in New Tab
        </button>
        <button
          onClick={onClose}
          className="text-white text-sm px-2 py-1 rounded hover:bg-red-600 bg-[#3D415A] transition-all"
        >
          ✕
        </button>
      </div>
      <iframe
        title="Live HTML Preview"
        srcDoc={htmlContent}
        className="w-full h-full border-0"
      />
    </div>
  );
};

export default HtmlPreview;
