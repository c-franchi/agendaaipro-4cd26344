import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, 
  RefreshCw, 
  User, 
  Mail, 
  Calendar, 
  Crown, 
  CheckCircle2, 
  XCircle,
  Ticket,
  Smartphone
} from "lucide-react";

interface VoucherUsed {
  code: string;
  used_at: string;
  validity_months: number;
  end_date: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  plan_type: string | null;
  subscription_status: string | null;
  app_access_enabled: boolean;
  voucher_used: VoucherUsed | null;
}

export const UsersManager = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingUser, setTogglingUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        return;
      }

      const { data, error } = await supabase.functions.invoke("list-users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAccess = async (userId: string, currentEnabled: boolean) => {
    setTogglingUser(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        return;
      }

      const { error } = await supabase.functions.invoke("toggle-user-access", {
        body: { userId, enabled: !currentEnabled },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, app_access_enabled: !currentEnabled, subscription_status: !currentEnabled ? "active" : "inactive" }
          : user
      ));

      toast.success(!currentEnabled ? "Acesso liberado" : "Acesso bloqueado");
    } catch (error: any) {
      console.error("Error toggling access:", error);
      toast.error(error.message || "Erro ao alterar acesso");
    } finally {
      setTogglingUser(null);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.plan_type?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const isSubscriptionActive = (user: UserProfile) => {
    if (!user.voucher_used?.end_date) return false;
    return new Date(user.voucher_used.end_date) > new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Usuários Cadastrados
            </CardTitle>
            <CardDescription>
              Gerencie os usuários e libere acesso ao aplicativo
            </CardDescription>
          </div>
          <Button onClick={fetchUsers} variant="outline" disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Acesso App</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const subscriptionActive = isSubscriptionActive(user);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-medium">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {user.full_name || "Sem nome"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            Cadastro: {formatDate(user.created_at)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.plan_type ? (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <Crown className="w-3 h-3" />
                            {user.plan_type.charAt(0).toUpperCase() + user.plan_type.slice(1)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.voucher_used ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Ticket className="w-3 h-3" />
                              {user.voucher_used.code}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              Usado: {formatShortDate(user.voucher_used.used_at)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.voucher_used?.end_date ? (
                          <div className="space-y-1">
                            <span className="text-sm">{formatShortDate(user.voucher_used.end_date)}</span>
                            {subscriptionActive ? (
                              <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                Válido
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                Expirado
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.subscription_status === "active" || user.app_access_enabled ? (
                          <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-3">
                          <Smartphone className={`w-4 h-4 ${user.app_access_enabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <Switch
                            checked={user.app_access_enabled}
                            onCheckedChange={() => toggleAccess(user.id, user.app_access_enabled)}
                            disabled={togglingUser === user.id}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            Total: {users.length} usuários
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            Com acesso: {users.filter(u => u.app_access_enabled).length}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            Sem acesso: {users.filter(u => !u.app_access_enabled).length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};