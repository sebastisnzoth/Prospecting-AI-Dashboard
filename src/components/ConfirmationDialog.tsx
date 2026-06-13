import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0e1422] border border-[#1e2d44] p-6 rounded-2xl w-full max-w-sm shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-display font-bold text-white">¿Confirmar Acción?</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">{message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className="px-4 py-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
