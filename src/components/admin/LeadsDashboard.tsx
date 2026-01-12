import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Calendar, Target } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface LeadsDashboardProps {
  leads: Lead[];
}

const COLORS = ["hsl(180, 85%, 50%)", "hsl(200, 85%, 55%)", "hsl(220, 85%, 55%)", "hsl(160, 85%, 50%)", "hsl(280, 85%, 55%)"];

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(180, 85%, 50%)",
  },
  conversao: {
    label: "Conversão",
    color: "hsl(200, 85%, 55%)",
  },
};

export const LeadsDashboard = ({ leads }: LeadsDashboardProps) => {
  // Last 7 days data
  const last7DaysData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });

    return days.map((day) => {
      const dayLeads = leads.filter((lead) => {
        const leadDate = startOfDay(new Date(lead.created_at));
        return leadDate.getTime() === day.getTime();
      });

      return {
        date: format(day, "dd/MM", { locale: ptBR }),
        name: format(day, "EEE", { locale: ptBR }),
        leads: dayLeads.length,
      };
    });
  }, [leads]);

  // Business type distribution
  const businessTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    leads.forEach((lead) => {
      const type = lead.business_type || "Não informado";
      types[type] = (types[type] || 0) + 1;
    });

    return Object.entries(types)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [leads]);

  // Source distribution
  const sourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    leads.forEach((lead) => {
      const source = lead.source || "landing_page";
      sources[source] = (sources[source] || 0) + 1;
    });

    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Stats
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    const lastWeek = subDays(today, 7);

    const todayLeads = leads.filter((l) => startOfDay(new Date(l.created_at)).getTime() === today.getTime()).length;
    const yesterdayLeads = leads.filter((l) => startOfDay(new Date(l.created_at)).getTime() === yesterday.getTime()).length;
    const weekLeads = leads.filter((l) => new Date(l.created_at) >= lastWeek).length;

    const growthRate = yesterdayLeads > 0 ? ((todayLeads - yesterdayLeads) / yesterdayLeads) * 100 : todayLeads > 0 ? 100 : 0;

    return {
      total: leads.length,
      today: todayLeads,
      week: weekLeads,
      growth: growthRate,
    };
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">todos os leads</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.today}</div>
              <p className="text-xs text-muted-foreground">novos leads</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Target className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.week}</div>
              <p className="text-xs text-muted-foreground">últimos 7 dias</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              <TrendingUp className={`w-4 h-4 ${stats.growth >= 0 ? "text-green-500" : "text-red-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                {stats.growth >= 0 ? "+" : ""}
                {stats.growth.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">vs ontem</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads por dia */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Leads por Dia (Últimos 7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7DaysData}>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="leads" fill="hsl(180, 85%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tendência */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Tendência de Captação</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last7DaysData}>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="leads" stroke="hsl(180, 85%, 50%)" strokeWidth={2} dot={{ fill: "hsl(180, 85%, 50%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tipo de Negócio */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Leads por Tipo de Negócio</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={businessTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {businessTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Origem */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Leads por Origem</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="vertical">
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(200, 85%, 55%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
