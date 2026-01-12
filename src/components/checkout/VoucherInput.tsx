import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Check, X, Loader2 } from "lucide-react";

interface VoucherInputProps {
  email: string;
  planType: string;
  originalAmount: number;
  onVoucherApplied: (voucherData: {
    code: string;
    discountAmount: number;
    finalAmount: number;
    voucherId: string;
  } | null) => void;
}

export const VoucherInput = ({ email, planType, originalAmount, onVoucherApplied }: VoucherInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);

  const validateVoucher = async () => {
    if (!code.trim()) {
      setError("Digite um código promocional");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("validate-voucher", {
        body: {
          code: code.trim().toUpperCase(),
          email,
          planType,
          originalAmount,
        },
      });

      if (fnError) throw fnError;

      if (data.valid) {
        setSuccess(data.message);
        setAppliedVoucher({
          code: data.voucher.code,
          discountAmount: data.discount_amount,
          finalAmount: data.final_amount,
        });
        onVoucherApplied({
          code: data.voucher.code,
          discountAmount: data.discount_amount,
          finalAmount: data.final_amount,
          voucherId: data.voucher.id,
        });
      } else {
        setError(data.message);
        onVoucherApplied(null);
      }
    } catch (err: any) {
      console.error("Error validating voucher:", err);
      setError("Erro ao validar código. Tente novamente.");
      onVoucherApplied(null);
    } finally {
      setLoading(false);
    }
  };

  const removeVoucher = () => {
    setCode("");
    setAppliedVoucher(null);
    setSuccess(null);
    setError(null);
    onVoucherApplied(null);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-primary" />
        Possui um código promocional?
      </Label>

      <AnimatePresence mode="wait">
        {!appliedVoucher ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2"
          >
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="Digite o código"
              className="uppercase font-mono"
              disabled={loading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={validateVoucher}
              disabled={loading || !code.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30"
          >
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-mono font-semibold text-green-500">{appliedVoucher.code}</p>
                <p className="text-sm text-muted-foreground">
                  Desconto de R$ {appliedVoucher.discountAmount.toFixed(2)} aplicado
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeVoucher}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-destructive flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
