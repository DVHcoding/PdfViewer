import React, { useState, useEffect, useRef } from 'react';
import './Toast.scss';

const Toast = () => {
  const [toast, setToast] = useState({ show: false, message: '' });
  const timerRef = useRef(null);

  useEffect(() => {
    const handleShowToast = (e) => {
      setToast({ show: true, message: e.detail });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 3000);
    };

    window.addEventListener('fluent-show-toast', handleShowToast);
    return () => {
      window.removeEventListener('fluent-show-toast', handleShowToast);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!toast.show) {
    return null;
  }

  return (
    <div className="fluent-toast-global" onMouseDown={(e) => e.stopPropagation()}>
      {toast.message}
    </div>
  );
};

export default Toast;
