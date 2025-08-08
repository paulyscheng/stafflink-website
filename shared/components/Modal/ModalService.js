import React, { useState, useCallback, createContext, useContext } from 'react';
import CustomModal, { MODAL_TYPES, MODAL_SEVERITY } from './CustomModal';

// Modal Context
const ModalContext = createContext(null);

// Modal Provider Component
export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    visible: false,
    type: MODAL_TYPES.ALERT,
    severity: MODAL_SEVERITY.INFO,
    title: '',
    message: '',
    buttons: [],
    showCloseButton: true,
    closeOnBackdrop: true,
    customContent: null,
  });

  const showModal = useCallback((config) => {
    setModalState({
      visible: true,
      ...config,
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, visible: false }));
  }, []);

  const alert = useCallback((title, message, severity = MODAL_SEVERITY.INFO, onClose) => {
    showModal({
      type: MODAL_TYPES.ALERT,
      severity,
      title,
      message,
      buttons: [
        {
          text: '确定',
          style: 'primary',
          onPress: () => {
            hideModal();
            onClose && onClose();
          },
        },
      ],
    });
  }, [showModal, hideModal]);

  const confirm = useCallback((title, message, onConfirm, onCancel) => {
    showModal({
      type: MODAL_TYPES.CONFIRM,
      severity: MODAL_SEVERITY.INFO,
      title,
      message,
      buttons: [
        {
          text: '取消',
          style: 'secondary',
          onPress: () => {
            hideModal();
            onCancel && onCancel();
          },
        },
        {
          text: '确定',
          style: 'primary',
          onPress: () => {
            hideModal();
            onConfirm && onConfirm();
          },
        },
      ],
    });
  }, [showModal, hideModal]);

  const success = useCallback((title, message, onClose) => {
    alert(title, message, MODAL_SEVERITY.SUCCESS, onClose);
  }, [alert]);

  const error = useCallback((title, message, onClose) => {
    alert(title, message, MODAL_SEVERITY.ERROR, onClose);
  }, [alert]);

  const warning = useCallback((title, message, onClose) => {
    alert(title, message, MODAL_SEVERITY.WARNING, onClose);
  }, [alert]);

  const info = useCallback((title, message, onClose) => {
    alert(title, message, MODAL_SEVERITY.INFO, onClose);
  }, [alert]);

  const custom = useCallback((config) => {
    showModal({
      type: MODAL_TYPES.CUSTOM,
      ...config,
    });
  }, [showModal]);

  const value = {
    showModal,
    hideModal,
    alert,
    confirm,
    success,
    error,
    warning,
    info,
    custom,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <CustomModal
        {...modalState}
        onClose={hideModal}
      >
        {modalState.customContent}
      </CustomModal>
    </ModalContext.Provider>
  );
};

// Hook to use modal
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

// Static methods for direct usage (requires ModalProvider to be set up)
let modalInstance = null;

export const setModalInstance = (instance) => {
  modalInstance = instance;
};

export const Modal = {
  alert: (title, message, onClose) => {
    if (modalInstance) {
      modalInstance.alert(title, message, MODAL_SEVERITY.INFO, onClose);
    }
  },
  confirm: (title, message, onConfirm, onCancel) => {
    if (modalInstance) {
      modalInstance.confirm(title, message, onConfirm, onCancel);
    }
  },
  success: (title, message, onClose) => {
    if (modalInstance) {
      modalInstance.success(title, message, onClose);
    }
  },
  error: (title, message, onClose) => {
    if (modalInstance) {
      modalInstance.error(title, message, onClose);
    }
  },
  warning: (title, message, onClose) => {
    if (modalInstance) {
      modalInstance.warning(title, message, onClose);
    }
  },
  info: (title, message, onClose) => {
    if (modalInstance) {
      modalInstance.info(title, message, onClose);
    }
  },
  custom: (config) => {
    if (modalInstance) {
      modalInstance.custom(config);
    }
  },
};

export default Modal;