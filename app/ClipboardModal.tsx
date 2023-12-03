import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ClipboardModal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  // After 1s, close the modal
  setTimeout(() => {
    onClose();
  }, 1000);
  

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={onClose}>
      <div className="relative bottom-0 mx-auto p-5 border w-96 shadow-lg rounded-md text-gray-800 bg-white" onClick={e => e.stopPropagation()}>
        {children}
        <div className="flex justify-end mt-4">
          
        </div>
      </div>
    </div>
  );
};

export default ClipboardModal;
