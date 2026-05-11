import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { Button } from './button';

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface ModalAlertProps {
  open: boolean;
  type?: AlertType;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const config: Record<AlertType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  success: {
    icon: <CheckCircle size={40} />,
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  error: {
    icon: <XCircle size={40} />,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  warning: {
    icon: <AlertTriangle size={40} />,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
  info: {
    icon: <Info size={40} />,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  confirm: {
    icon: <AlertTriangle size={40} />,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
};

export function ModalAlert({
  open,
  type = 'info',
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
}: ModalAlertProps) {
  const c = config[type];
  const isConfirm = type === 'confirm';

  const portalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-alert-wrapper fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          style={{ pointerEvents: 'auto' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`w-full max-w-sm rounded-2xl shadow-2xl border ${c.bg} ${c.border} p-6 relative`}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div className={`flex justify-center mb-4 ${c.color}`}>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              >
                {c.icon}
              </motion.div>
            </div>

            {/* Title */}
            {title && (
              <h2 className="text-center text-xl font-bold text-gray-800 mb-2">{title}</h2>
            )}

            {/* Message */}
            <p className="text-center text-gray-600 text-sm leading-relaxed">{message}</p>

            {/* Buttons */}
            <div className={`mt-6 flex gap-3 ${isConfirm ? '' : 'justify-center'}`}>
              {isConfirm && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  {cancelLabel}
                </Button>
              )}
              <Button
                className={`${isConfirm ? 'flex-1' : 'px-8'} ${
                  type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                  type === 'success' ? 'bg-green-500 hover:bg-green-600' :
                  type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  type === 'confirm' ? 'bg-orange-500 hover:bg-orange-600' :
                  'bg-blue-500 hover:bg-blue-600'
                } text-white`}
                onClick={() => {
                  if (isConfirm && onConfirm) onConfirm();
                  onClose();
                }}
              >
                {isConfirm ? confirmLabel : 'OK'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined' || !document.body) return null;
  return createPortal(portalContent, document.body);
}

// ============================================================
// Hook untuk pakai modal dengan mudah
// ============================================================

import { useState, useCallback } from 'react';

interface AlertState {
  open: boolean;
  type: AlertType;
  title?: string;
  message: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function useModalAlert() {
  const [state, setState] = useState<AlertState>({
    open: false,
    type: 'info',
    message: '',
  });

  const showAlert = useCallback((
    message: string,
    type: AlertType = 'info',
    title?: string
  ) => {
    setState({ open: true, type, message, title });
  }, []);

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    title?: string,
    confirmLabel?: string,
    cancelLabel?: string,
  ) => {
    setState({ open: true, type: 'confirm', message, title, onConfirm, confirmLabel, cancelLabel });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  const Modal = (
    <ModalAlert
      open={state.open}
      type={state.type}
      title={state.title}
      message={state.message}
      onClose={close}
      onConfirm={state.onConfirm}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
    />
  );

  return { showAlert, showConfirm, Modal };
}