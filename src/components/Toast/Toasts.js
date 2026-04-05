export const showToast = (message) => {
  window.dispatchEvent(
    new CustomEvent('fluent-show-toast', {
      detail: message,
    })
  );
};
