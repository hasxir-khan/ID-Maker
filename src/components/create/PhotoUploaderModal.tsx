import React, { useState } from 'react';
import {
  X,
  Upload,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  Check,
  User,
  Trash2,
} from 'lucide-react';

interface PhotoUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string;
  onSavePhoto: (photoDataUrl: string) => void;
}

const SAMPLE_PORTRAITS = [
  {
    name: 'Female 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Male 1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Female 2',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Male 2',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  },
];

export const PhotoUploaderModal: React.FC<PhotoUploaderModalProps> = ({
  isOpen,
  onClose,
  currentPhotoUrl,
  onSavePhoto,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(currentPhotoUrl || '');
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size should be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
          setZoom(1);
          setRotation(0);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSavePhoto(photoUrl);
    onClose();
  };

  const handleRemove = () => {
    setPhotoUrl('');
    onSavePhoto('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-heading">
                Passport Photo Studio & Crop
              </h3>
              <p className="text-xs text-slate-500">
                Adjust position, zoom, and framing with automatic aspect ratio lock.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Visual Crop Box */}
            <div className="flex flex-col items-center">
              <div className="w-44 h-56 rounded-xl border-2 border-dashed border-blue-500 bg-slate-100 relative overflow-hidden flex items-center justify-center shadow-inner">
                {photoUrl ? (
                  <div
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    }}
                    className="w-full h-full transition-transform duration-100 flex items-center justify-center"
                  >
                    <img
                      src={photoUrl}
                      alt="Crop preview"
                      className="w-full h-full object-cover select-none"
                    />
                  </div>
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <User className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">No photo chosen</p>
                  </div>
                )}

                {/* Framing crosshair guide */}
                <div className="absolute inset-0 pointer-events-none border border-white/40 grid grid-cols-3 grid-rows-3 opacity-30" />
              </div>
              <span className="text-[11px] text-slate-400 mt-2 font-mono">
                Standard CR80 Ratio (3:4 Portrait)
              </span>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* File upload button */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Upload From Computer
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Choose JPG / PNG image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Sample portraits for 1-click test */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Or select sample headshot:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SAMPLE_PORTRAITS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setPhotoUrl(p.url);
                        setZoom(1);
                        setRotation(0);
                      }}
                      className="h-12 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                      <img
                        src={p.url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom slider */}
              {photoUrl && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                      <span className="flex items-center gap-1">
                        <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
                        Scale / Zoom
                      </span>
                      <span className="font-mono">{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="2.5"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotate 90°</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setRotation(0);
                        setBrightness(100);
                        setContrast(100);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Reset adjustments
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {currentPhotoUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!photoUrl}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Apply Photo to Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
