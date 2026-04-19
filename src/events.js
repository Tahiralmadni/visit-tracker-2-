const dataChangeEvent = new Event('visitDataChanged');

export const notifyDataChange = () => {
  // Create an event with a timestamp to ensure uniqueness
  const event = new CustomEvent('visitDataChanged', {
    detail: { timestamp: Date.now() }
  });
  window.dispatchEvent(event);
};

export const onDataChange = (callback) => {
  const handler = () => {
    callback();
  };
  
  window.addEventListener('visitDataChanged', handler);
  return () => window.removeEventListener('visitDataChanged', handler);
};