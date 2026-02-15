// Génère un code aléatoire de 5 chiffres
export const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};