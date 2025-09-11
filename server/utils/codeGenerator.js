// utils/codeGenerator.js

export const generateCustomerCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `CUST-${randomPart}`;
};

export const isValidCustomerCode = (code) => {
  if (!code) return false;
  const regex = /^CUST-[A-Z0-9]{6}$/;
  return regex.test(code.toUpperCase());
};