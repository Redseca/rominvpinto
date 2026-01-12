
import React, { useState } from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

interface PayPalButtonProps {
  amount: number;
  onSuccess: () => void;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, onSuccess }) => {
  const [hasPaid, setHasPaid] = useState(false);
  const paypalMeUrl = `https://www.paypal.com/paypalme/Rominvpinto/${amount}EUR`;

  return (
    <div className="w-full space-y-4">
      <button
        onClick={() => { window.open(paypalMeUrl, '_blank'); setHasPaid(true); }}
        className="w-full py-5 bg-[#0070ba] text-white font-black rounded-3xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
      >
        <span>Pagar {amount} € vía PayPal</span>
        <ExternalLink size={20} />
      </button>

      {hasPaid && (
        <div className="pt-6 animate-in slide-in-from-top-4 duration-500">
          <p className="text-[10px] text-slate-400 text-center mb-4 uppercase font-black tracking-widest">
            ¿Ya realizaste el envío de dinero?
          </p>
          <button
            onClick={onSuccess}
            className="w-full py-4 bg-teal-50 text-teal-600 border-2 border-teal-200 font-black rounded-2xl flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} />
            <span>Confirmar y Desbloquear</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PayPalButton;
