import { motion } from "framer-motion";
import { AlertCircle, Clock, AlertTriangle, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SubscriptionExpirationWarningProps {
  endDate: string | null;
  planPrice: number;
  planName: string;
}

export const SubscriptionExpirationWarning = ({
  endDate,
  planPrice,
  planName,
}: SubscriptionExpirationWarningProps) => {
  if (!endDate) return null;

  const now = new Date();
  const end = new Date(endDate);
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Don't show warning if more than 30 days remaining or already expired
  if (daysRemaining > 30 || daysRemaining < 0) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Determine warning level
  let variant: "info" | "warning" | "urgent" = "info";
  let icon = Clock;
  let bgColor = "bg-blue-500/10 border-blue-500/30";
  let textColor = "text-blue-500";
  let title = "Período promocional";

  if (daysRemaining <= 3) {
    variant = "urgent";
    icon = AlertTriangle;
    bgColor = "bg-orange-500/10 border-orange-500/30";
    textColor = "text-orange-500";
    title = "Atenção: Cobrança em breve!";
  } else if (daysRemaining <= 7) {
    variant = "warning";
    icon = AlertCircle;
    bgColor = "bg-yellow-500/10 border-yellow-500/30";
    textColor = "text-yellow-500";
    title = "Período promocional acabando";
  }

  const Icon = icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`${bgColor} border`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${bgColor}`}>
              <Icon className={`w-5 h-5 ${textColor}`} />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className={`font-semibold ${textColor}`}>{title}</h4>
              <p className="text-sm text-muted-foreground">
                {daysRemaining === 0 ? (
                  <>
                    Seu período promocional termina <strong>hoje</strong>! 
                    A cobrança de {formatCurrency(planPrice)}/mês será iniciada automaticamente.
                  </>
                ) : daysRemaining === 1 ? (
                  <>
                    Seu período promocional termina <strong>amanhã</strong>! 
                    A partir de {formatDate(endDate)}, será cobrado {formatCurrency(planPrice)}/mês no cartão cadastrado.
                  </>
                ) : (
                  <>
                    Restam <strong>{daysRemaining} dias</strong> do seu período promocional. 
                    A partir de {formatDate(endDate)}, será cobrado {formatCurrency(planPrice)}/mês automaticamente.
                  </>
                )}
              </p>
              {variant === "urgent" && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    A cobrança será feita no cartão usado na contratação
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
