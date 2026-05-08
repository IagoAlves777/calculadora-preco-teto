import { useCallback, useRef, useState } from 'react';

interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
}

const useConfirm = () => {
  const [state, setState] = useState<ConfirmState>({ isOpen: false, message: '' });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, isOpen: true });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  return {
    confirm,
    modalProps: {
      isOpen: state.isOpen,
      message: state.message,
      title: state.title,
      confirmLabel: state.confirmLabel,
      onConfirm: handleConfirm,
      onClose: handleClose,
    },
  };
};

export default useConfirm;
