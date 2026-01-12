// WhatsApp configuration
export const WHATSAPP_NUMBER = "5516997813038";

export const getWhatsAppLink = (message?: string) => {
  const baseUrl = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
};

export const getWhatsAppMessage = (context?: string) => {
  switch (context) {
    case "hero":
      return "Olá! Tenho interesse no AgendaAÍ Pro. Gostaria de saber mais sobre o sistema.";
    case "pricing":
      return "Olá! Gostaria de solicitar uma proposta personalizada para o AgendaAÍ Pro.";
    case "cta":
      return "Olá! Quero começar a usar o AgendaAÍ Pro no meu negócio.";
    default:
      return "Olá! Tenho interesse no AgendaAÍ Pro.";
  }
};
