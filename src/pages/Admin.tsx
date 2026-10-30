import ContractProviderEditor from "@/components/admin/ContractProviderEditor";
import {Dialog,DialogContent,DialogHeader,DialogTitle} from "@/components/ui/dialog";
import OrdersList from "@/components/checkout/OrdersList";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, Mail, Phone, Search, RefreshCw, ArrowLeft, Trash2, Building2, LogOut, BarChart3, Gift, Settings } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoSimple from "@/assets/logo-simple.png";
import type { User } from "@supabase/supabase-js";
import { LeadsDashboard } from "@/components/admin/LeadsDashboard";
import { VouchersManager } from "@/components/admin/VouchersManager";
import { LandingPageEditor } from "@/components/admin/LandingPageEditor";
import { UsersManager } from "@/components/admin/UsersManager";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_type: string | null;
  message: string | null;
  source: string | null;
  created_at: string;
}

const ADMIN_EMAIL = "neifranchi@gmail.com";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedLead,setSelectedLead]=useState<Lead|null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAuthorizedAdmin = (email: string | undefined) => {
    return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthLoading(false);
      
      if (!currentUser) {
        navigate("/auth");
      } else if (!isAuthorizedAdmin(currentUser.email)) {
        toast.error("Acesso não autorizado");
        supabase.auth.signOut();
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthLoading(false);
      
      if (!currentUser) {
        navigate("/auth");
      } else if (!isAuthorizedAdmin(currentUser.email)) {
        toast.error("Acesso não autorizado");
        supabase.auth.signOut();
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      setLeads(leads.filter(lead => lead.id !== id));
      toast.success("Lead removido com sucesso");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Erro ao remover lead");
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.phone && lead.phone.includes(searchTerm)) ||
    (lead.business_type && lead.business_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lead.message && lead.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lead.source && lead.source.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="admin-mobile min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 py-3 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <img src={logoSimple} alt="AgendaAÍ Pro" className="h-10" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button aria-label="Atualizar dados" onClick={fetchLeads} variant="outline" disabled={loading} size="sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Atualizar</span>
            </Button>
            <Button aria-label="Sair da conta" onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-6 py-4 sm:py-8 min-w-0">
        <Dialog open={Boolean(selectedLead)} onOpenChange={open=>{if(!open)setSelectedLead(null)}}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Detalhes da solicitação</DialogTitle></DialogHeader>{selectedLead&&<dl className="space-y-3 text-sm break-words">{[['Nome',selectedLead.name],['E-mail',selectedLead.email],['WhatsApp',selectedLead.phone],['Área de atuação',selectedLead.business_type],['Mensagem / plano solicitado',selectedLead.message],['Origem',selectedLead.source],['Recebido em',new Date(selectedLead.created_at).toLocaleString('pt-BR')]].map(([label,value])=><div key={label}><dt className="font-semibold">{label}</dt><dd className="whitespace-pre-wrap">{value||'Não informado'}</dd></div>)}</dl>}</DialogContent></Dialog>
      <Tabs defaultValue={['orders','contract'].includes(new URLSearchParams(window.location.search).get('tab')||'')?new URLSearchParams(window.location.search).get('tab')!:'dashboard'} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 p-1.5">
            <TabsTrigger value="dashboard" className="flex min-h-12 flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex min-h-12 flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm">
              <UserCheck className="w-4 h-4" />
              <span className="inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex min-h-12 flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="inline">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="flex min-h-12 flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm">
              <Gift className="w-4 h-4" />
              <span className="inline">Vouchers</span>
            </TabsTrigger>
            <TabsTrigger value="landing" className="flex min-h-12 flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm">
              <Settings className="w-4 h-4" />
              <span className="inline">Landing</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="min-h-12 text-xs sm:text-sm" aria-label="Pedidos e implementações">Pedidos</TabsTrigger>
          <TabsTrigger value="contract" className="min-h-12 text-xs sm:text-sm">Contrato</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <LeadsDashboard leads={leads} />
          </TabsContent>

          <TabsContent value="contract"><ContractProviderEditor/></TabsContent>
          <TabsContent value="orders"><OrdersList admin/></TabsContent>
          <TabsContent value="users">
            <UsersManager />
          </TabsContent>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>Leads Capturados</CardTitle>
                <CardDescription>Lista de todos os leads cadastrados</CardDescription>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum lead encontrado</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Negócio</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLeads.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.name}</TableCell>
                            <TableCell>
                              <a href={`mailto:${lead.email}`} className="text-primary hover:underline flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </a>
                            </TableCell>
                            <TableCell>
                              {lead.phone ? (
                                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-primary">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </a>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              {lead.business_type ? (
                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                  <Building2 className="w-3 h-3" />
                                  {lead.business_type}
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right"><Button variant="outline" size="sm" onClick={()=>setSelectedLead(lead)}>Ver detalhes</Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteLead(lead.id)}
                                disabled={deleting === lead.id}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className={`w-4 h-4 ${deleting === lead.id ? 'animate-spin' : ''}`} />
                              </Button>
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

          <TabsContent value="vouchers">
            <VouchersManager />
          </TabsContent>

          <TabsContent value="landing">
            <Card>
              <CardHeader>
                <CardTitle>Editar página inicial</CardTitle>
                <CardDescription>Atualize textos, imagens, vídeo e informações de contato</CardDescription>
              </CardHeader>
              <CardContent>
                <LandingPageEditor />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
