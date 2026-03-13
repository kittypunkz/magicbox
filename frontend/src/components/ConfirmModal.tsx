import { AlertTriangle, X } from 'lucide-react';

// Dark mode colors
const c = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      iconBg: 'bg-red-500/10',
      button: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: 'text-yellow-500',
      iconBg: 'bg-yellow-500/10',
      button: 'bg-yellow-500 hover:bg-yellow-600',
    },
    info: {
      icon: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      button: 'bg-blue-500 hover:bg-blue-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md ${c.sidebar} border ${c.border} rounded-xl shadow-2xl`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 ${c.gray} ${c.hover} rounded-lg transition-colors`}
        >
          <X size={18} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-12 h-12 ${styles.iconBg} rounded-xl mb-4`}>
            <AlertTriangle size={24} className={styles.icon} />
          </div>

          {/* Title */}
          <h3 className={`text-xl font-semibold ${c.text} mb-2`}>
            {title}
          </h3>

          {/* Message */}
          <p className={`${c.gray} mb-6`}>
            {message}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 text-sm ${c.text} ${c.hover} rounded-lg transition-colors disabled:opacity-50`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 text-sm text-white ${styles.button} rounded-lg transition-colors disabled:opacity-50`}
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
