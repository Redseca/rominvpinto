
import React, { useState } from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

interface PayPalButtonProps {
  amount: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, onSuccess }) => {
  const [clickedLink, setClickedLink] = useState(false);
  
  // Construye el enlace directo con el monto y la moneda
  const paypalMeUrl = `https://www.paypal.com/paypalme/Rominvpinto/${amount}EUR`;

  const handleOpenPaypal = () => {
    window.open(paypalMeUrl, '_blank');
    setClickedLink(true);
  };

  return (
    <div className="w-full space-y-4">
      <button
        onClick={handleOpenPaypal}
        className="w-full py-4 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
      >
        <span>Pagar {amount} € con PayPal.me</span>
        <ExternalLink size={18} />
      </button>

      {clickedLink && (
        <div className="pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-500">
          <p className="text-[11px] text-white/40 text-center mb-4 uppercase tracking-widest font-medium">
            ¿Ya completaste el envío de dinero?
          </p>
          <button
            onClick={onSuccess}
            className="w-full py-3 bg-white/5 hover:bg-green-500/10 text-green-400 border border-green-500/30 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle2 size={18} />
            <span>Confirmar Pago y Desbloquear</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PayPalButton;
