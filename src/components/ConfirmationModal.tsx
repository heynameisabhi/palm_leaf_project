import React from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  isLoading = false,
  variant = "danger"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-red-400",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          border: "border-red-900"
        };
      case "warning":
        return {
          icon: "text-yellow-400",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
          border: "border-yellow-900"
        };
      case "info":
        return {
          icon: "text-blue-400",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
          border: "border-blue-900"
        };
      default:
        return {
          icon: "text-red-400",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          border: "border-red-900"
        };
    }
  };

  const styles = getVariantStyles();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={`
        relative w-full max-w-md mx-4 bg-zinc-900 border ${styles.border} 
        rounded-lg shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200
      `}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-300 transition-colors"
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`rounded-full p-2 bg-zinc-800 ${styles.icon}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200">
              {title}
            </h3>
          </div>

          {/* Message */}
          <p className="text-zinc-400 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-200"
            >
              {cancelButtonText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={`${styles.confirmButton} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                confirmButtonText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}