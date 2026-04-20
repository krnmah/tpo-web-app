import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { X } from "./Icons";

const ConfirmDialogContext = createContext(null);

export const useConfirm = () => {
  return useContext(ConfirmDialogContext);
};

export const ConfirmDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((message, title = "Confirm Action") => {
    return new Promise((resolve) => {
      setDialog({ title, message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && dialog) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [dialog]);

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={handleCancel}
          />
          {/* Modal */}
          <div
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm animate-zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900">{dialog.title}</h3>
                <button
                  onClick={handleCancel}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-lg hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message */}
              <p className="text-sm text-zinc-600">{dialog.message}</p>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
};

// Add simple animations to tailwind if not present
// You can add these to your tailwind.config.js or index.css:
// animate-in: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
// fade-in: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
// zoom-in-95: { "0%": { opacity: 0, transform: "scale(.95)" }, "100%": { opacity: 1, transform: "scale(1)" } }
