import { useState } from 'react';
import { Download, Settings } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface DownloadOptions {
  data_only: boolean;
  schema_only: boolean;
}

interface DownloadButtonProps {
  onDownload: (options: DownloadOptions) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

export function DownloadButton({ onDownload, disabled = false, loading = false }: DownloadButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<DownloadOptions>({
    data_only: false,
    schema_only: false
  });

  const handleDownload = async () => {
    try {
      await onDownload(options);
      setShowOptions(false);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={disabled || loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="border-white border-t-transparent" />
              Preparing dump...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Dump
            </>
          )}
        </button>
        
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={disabled || loading}
          className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          title="Download options"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {showOptions && (
        <div className="p-3 border rounded-md bg-gray-50 space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Download Options</h4>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.data_only}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  data_only: e.target.checked,
                  schema_only: e.target.checked ? false : prev.schema_only
                }))}
                className="rounded"
              />
              <span className="text-sm">Data only (no schema)</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.schema_only}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  schema_only: e.target.checked,
                  data_only: e.target.checked ? false : prev.data_only
                }))}
                className="rounded"
              />
              <span className="text-sm">Schema only (no data)</span>
            </label>
          </div>
          
          <p className="text-xs text-gray-600">
            Leave both unchecked for a complete dump (schema + data)
          </p>
        </div>
      )}
    </div>
  );
}
