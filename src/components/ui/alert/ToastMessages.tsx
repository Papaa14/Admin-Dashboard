import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const toastConfig: ToastOptions = {
  position: "top-center",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

export const showSuccessToast = (message: string) => {
  toast.success(message, toastConfig);
};

export const showErrorToast = (message: string) => {
  toast.error(message, toastConfig);
};

export const confirmDelete = (itemName: string, onConfirm: () => void): boolean => {
  if (window.confirm(`Are you sure you want to delete ${itemName}? This action cannot be undone.`)) {
    onConfirm();
    return true;
  }
  return false;
};
