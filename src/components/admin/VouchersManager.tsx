import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, RefreshCw, Gift, DollarSign, Percent, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Voucher {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  applies_to: string;
  starts_at: string;
  expires_at: string | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  current_uses: number;
  status: string;
  commerce_enabled: boolean;
  discount_months: number;
  created_at: string;
}

interface VoucherUse {
  id: string;
  voucher_id: string;
  user_email: string;
  user_name: string | null;
  plan_type: string | null;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  used_at: string;
}

export const VouchersManager = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherUses, setVoucherUses] = useState<VoucherUse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    commerce_enabled: false,
    discount_months: 1,
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    applies_to: "first_payment",
    starts_at: new Date().toISOString().split("T")[0],
    expires_at: "",
    validity_period: "" as "" | "1" | "3" | "6" | "12" | "custom",
    max_uses: "",
    max_uses_per_user: "1",
  });

  // Helper to calculate expiration date from validity period
  const calculateExpirationDate = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split("T")[0];
  };

  const handleValidityPeriodChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, validity_period: value as typeof prev.validity_period };
      if (value && value !== "custom") {
        newData.expires_at = calculateExpirationDate(parseInt(value));
      } else if (value === "custom") {
        // Keep existing expires_at for custom
      } else {
        newData.expires_at = "";
      }
      return newData;
    });
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVouchers((data as Voucher[]) || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      toast.error("Erro ao carregar vouchers");
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherUses = async () => {
    try {
      const { data, error } = await supabase
        .from("voucher_uses")
        .select("*")
        .order("used_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setVoucherUses((data as VoucherUse[]) || []);
    } catch (error) {
      console.error("Error fetching voucher uses:", error);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchVoucherUses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.discount_value) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Determine validity_months from validity_period
      let validityMonths = 1;
      if (formData.validity_period && formData.validity_period !== "custom") {
        validityMonths = parseInt(formData.validity_period);
      } else if (formData.expires_at && formData.starts_at) {
        // Calculate months from dates
        const start = new Date(formData.starts_at);
        const end = new Date(formData.expires_at);
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        validityMonths = Math.max(1, diffMonths);
      }

      const voucherData = {
        commerce_enabled: formData.commerce_enabled,
        discount_months: formData.discount_months,
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        applies_to: formData.applies_to,
        starts_at: new Date(formData.starts_at).toISOString(),
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        max_uses: formData.max_uses ? Number(formData.max_uses) : null,
        max_uses_per_user: formData.max_uses_per_user ? Number(formData.max_uses_per_user) : 1,
        validity_months: validityMonths,
      };

      if (editingVoucher) {
        const { error } = await supabase
          .from("vouchers")
          .update(voucherData)
          .eq("id", editingVoucher.id);

        if (error) throw error;
        toast.success("Voucher atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("vouchers").insert(voucherData);

        if (error) throw error;
        toast.success("Voucher criado com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchVouchers();
    } catch (error: any) {
      console.error("Error saving voucher:", error);
      toast.error(error.message || "Erro ao salvar voucher");
    }
  };

  const resetForm = () => {
    setFormData({
      commerce_enabled: false,
    discount_months: 1,
    code: "",
      discount_type: "percentage",
      discount_value: 0,
      applies_to: "first_payment",
      starts_at: new Date().toISOString().split("T")[0],
      expires_at: "",
      validity_period: "",
      max_uses: "",
      max_uses_per_user: "1",
    });
    setEditingVoucher(null);
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      commerce_enabled: voucher.commerce_enabled ?? false,
      discount_months: voucher.discount_months ?? 1,
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      applies_to: voucher.applies_to,
      starts_at: voucher.starts_at.split("T")[0],
      expires_at: voucher.expires_at ? voucher.expires_at.split("T")[0] : "",
      validity_period: "custom",
      max_uses: voucher.max_uses?.toString() || "",
      max_uses_per_user: voucher.max_uses_per_user?.toString() || "1",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este voucher?")) return;

    try {
      const { error } = await supabase.from("vouchers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Voucher excluído com sucesso!");
      fetchVouchers();
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error("Erro ao excluir voucher");
    }
  };

  const toggleStatus = async (voucher: Voucher) => {
    const newStatus = voucher.status === "active" ? "disabled" : "active";
    try {
      const { error } = await supabase
        .from("vouchers")
        .update({ status: newStatus })
        .eq("id", voucher.id);

      if (error) throw error;
      toast.success(`Voucher ${newStatus === "active" ? "ativado" : "desativado"}!`);
      fetchVouchers();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Ativo" },
      expired: { variant: "secondary", label: "Expirado" },
      exhausted: { variant: "outline", label: "Esgotado" },
      disabled: { variant: "destructive", label: "Desativado" },
    };
    const config = variants[status] || variants.disabled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stats = {
    total: vouchers.length,
    active: vouchers.filter((v) => v.status === "active").length,
    totalUses: voucherUses.length,
    totalDiscount: voucherUses.reduce((acc, u) => acc + u.discount_amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Vouchers</CardTitle>
            <Gift className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Gift className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Usos</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUses}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Desconto Total</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalDiscount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vouchers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="uses">Histórico de Uso</TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciar Vouchers</CardTitle>
                <CardDescription>Crie e gerencie códigos promocionais</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchVouchers} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Voucher
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingVoucher ? "Editar Voucher" : "Criar Novo Voucher"}</DialogTitle>
                      <DialogDescription>Configure os detalhes do código promocional</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Código *</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          placeholder="Ex: LANCAMENTO50"
                          className="uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Desconto</Label>
                          <Select
                            value={formData.discount_type}
                            onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, discount_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentual (%)</SelectItem>
                              <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="discount_value">Valor *</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {formData.discount_type === "percentage" ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                            </span>
                            <Input
                              id="discount_value"
                              type="number"
                              value={formData.discount_value}
                              onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                              className="pl-10"
                              min={0}
                              max={formData.discount_type === "percentage" ? 100 : undefined}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex gap-2 text-sm"><Switch checked={formData.commerce_enabled} onCheckedChange={v=>setFormData({...formData,commerce_enabled:v})}/>Revisei as regras e autorizo o uso no novo checkout</label>
                        <p className="text-xs text-muted-foreground">Implementação e mensalidade contam como resgates separados nos limites de uso. Não altera assinaturas existentes.</p>
                        <Label>Meses com desconto na mensalidade (opção Mensalidade)</Label><Input type="number" min={1} max={12} value={formData.discount_months} onChange={e=>setFormData({...formData,discount_months:Number(e.target.value)})}/>
                        <Label>Aplica-se a</Label>
                        <Select
                          value={formData.applies_to}
                          onValueChange={(value) => setFormData({ ...formData, applies_to: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="first_payment">Primeira mensalidade (1 mês)</SelectItem>
                            <SelectItem value="monthly">Mensalidade (duração acima)</SelectItem>
                            <SelectItem value="setup">Implementação única</SelectItem>
                            <SelectItem value="setup_and_first">Setup + 1ª Mensalidade (duração acima)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Prazo para resgatar o código</Label>
                        <Select
                          value={formData.validity_period}
                          onValueChange={handleValidityPeriodChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 mês</SelectItem>
                            <SelectItem value="3">3 meses</SelectItem>
                            <SelectItem value="6">6 meses</SelectItem>
                            <SelectItem value="12">12 meses (1 ano)</SelectItem>
                            <SelectItem value="custom">Data personalizada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="starts_at">Data de Início</Label>
                          <Input
                            id="starts_at"
                            type="date"
                            value={formData.starts_at}
                            onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                            className="[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200 [&::-webkit-calendar-picker-indicator]:opacity-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expires_at">Data de Expiração</Label>
                          <Input
                            id="expires_at"
                            type="date"
                            value={formData.expires_at}
                            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value, validity_period: "custom" })}
                            disabled={formData.validity_period !== "custom" && formData.validity_period !== ""}
                            className="[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-200 [&::-webkit-calendar-picker-indicator]:opacity-100"
                          />
                          {formData.validity_period && formData.validity_period !== "custom" && (
                            <p className="text-xs text-muted-foreground">
                              Calculada automaticamente
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="max_uses">Limite Total de Usos</Label>
                          <Input
                            id="max_uses"
                            type="number"
                            value={formData.max_uses}
                            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                            placeholder="Ilimitado"
                            min={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="max_uses_per_user">Limite por Usuário</Label>
                          <Input
                            id="max_uses_per_user"
                            type="number"
                            value={formData.max_uses_per_user}
                            onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                            min={1}
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full">
                        {editingVoucher ? "Salvar Alterações" : "Criar Voucher"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : vouchers.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum voucher criado</h3>
                  <p className="text-muted-foreground">Crie seu primeiro código promocional</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Desconto</TableHead>
                        <TableHead>Usos</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.map((voucher) => (
                        <TableRow key={voucher.id}>
                          <TableCell className="font-mono font-semibold">{voucher.code}</TableCell>
                          <TableCell>
                            {voucher.discount_type === "percentage"
                              ? `${voucher.discount_value}%`
                              : `R$ ${voucher.discount_value.toFixed(2)}`}
                          </TableCell>
                          <TableCell>
                            {voucher.current_uses}
                            {voucher.max_uses && ` / ${voucher.max_uses}`}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {voucher.expires_at
                              ? format(new Date(voucher.expires_at), "dd/MM/yyyy", { locale: ptBR })
                              : "Sem limite"}
                          </TableCell>
                          <TableCell>{getStatusBadge(voucher.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Switch
                                checked={voucher.status === "active"}
                                onCheckedChange={() => toggleStatus(voucher)}
                              />
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(voucher)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(voucher.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uses" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Histórico de Uso</CardTitle>
              <CardDescription>Veja quem utilizou os vouchers</CardDescription>
            </CardHeader>
            <CardContent>
              {voucherUses.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum uso registrado</h3>
                  <p className="text-muted-foreground">Os usos aparecerão aqui quando clientes utilizarem vouchers</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Desconto</TableHead>
                        <TableHead>Valor Final</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voucherUses.map((use) => (
                        <TableRow key={use.id}>
                          <TableCell className="font-medium">{use.user_name || "-"}</TableCell>
                          <TableCell>{use.user_email}</TableCell>
                          <TableCell>{use.plan_type || "-"}</TableCell>
                          <TableCell className="text-green-500">-R$ {use.discount_amount.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">R$ {use.final_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(use.used_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
