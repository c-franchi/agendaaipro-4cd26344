import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface PlanData {
  name: string;
  price: number;
  promotional_price: number | null;
  description: string;
  features: string[];
  popular: boolean;
}

interface PricingPlans {
  essencial: PlanData;
  pro: PlanData;
  premium: PlanData;
}

interface HeroContent {
  title: string;
  subtitle: string;
  cta_primary: string;
  cta_secondary: string;
}

interface ContactInfo {
  whatsapp: string;
  email: string;
  instagram: string;
}

export const LandingPageEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlans | null>(null);
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("landing_content")
        .select("key, value");

      if (error) throw error;

      data?.forEach((item) => {
        if (item.key === "pricing_plans") {
          setPricingPlans(item.value as unknown as PricingPlans);
        } else if (item.key === "hero_content") {
          setHeroContent(item.value as unknown as HeroContent);
        } else if (item.key === "contact_info") {
          setContactInfo(item.value as unknown as ContactInfo);
        }
      });
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Erro ao carregar conteúdo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const saveContent = async (key: string, value: PricingPlans | HeroContent | ContactInfo | null) => {
    if (!value) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("landing_content")
        .update({ 
          value: JSON.parse(JSON.stringify(value)) as Json, 
          updated_at: new Date().toISOString() 
        })
        .eq("key", key);

      if (error) throw error;
      toast.success("Conteúdo salvo com sucesso!");
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Erro ao salvar conteúdo");
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = (planKey: keyof PricingPlans, field: keyof PlanData, value: unknown) => {
    if (!pricingPlans) return;
    setPricingPlans({
      ...pricingPlans,
      [planKey]: {
        ...pricingPlans[planKey],
        [field]: value,
      },
    });
  };

  const addFeature = (planKey: keyof PricingPlans) => {
    if (!pricingPlans) return;
    const newFeatures = [...pricingPlans[planKey].features, "Nova funcionalidade"];
    updatePlan(planKey, "features", newFeatures);
  };

  const removeFeature = (planKey: keyof PricingPlans, index: number) => {
    if (!pricingPlans) return;
    const newFeatures = pricingPlans[planKey].features.filter((_, i) => i !== index);
    updatePlan(planKey, "features", newFeatures);
  };

  const updateFeature = (planKey: keyof PricingPlans, index: number, value: string) => {
    if (!pricingPlans) return;
    const newFeatures = [...pricingPlans[planKey].features];
    newFeatures[index] = value;
    updatePlan(planKey, "features", newFeatures);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="pricing" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 max-w-lg">
        <TabsTrigger value="pricing">Planos e Preços</TabsTrigger>
        <TabsTrigger value="hero">Hero Section</TabsTrigger>
        <TabsTrigger value="contact">Contato</TabsTrigger>
      </TabsList>

      <TabsContent value="pricing" className="space-y-6">
        {pricingPlans && Object.entries(pricingPlans).map(([planKey, plan]) => (
          <Card key={planKey}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Plano {plan.name}
                {plan.popular && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Mais Popular
                  </span>
                )}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nome do Plano</Label>
                  <Input
                    value={plan.name}
                    onChange={(e) => updatePlan(planKey as keyof PricingPlans, "name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Preço Original (R$)</Label>
                  <Input
                    type="number"
                    value={plan.price}
                    onChange={(e) => updatePlan(planKey as keyof PricingPlans, "price", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Preço Promocional (R$)</Label>
                  <Input
                    type="number"
                    value={plan.promotional_price || ""}
                    placeholder="Deixe vazio se não houver promoção"
                    onChange={(e) => updatePlan(
                      planKey as keyof PricingPlans, 
                      "promotional_price", 
                      e.target.value ? Number(e.target.value) : null
                    )}
                  />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={plan.description}
                  onChange={(e) => updatePlan(planKey as keyof PricingPlans, "description", e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={plan.popular}
                  onCheckedChange={(checked) => updatePlan(planKey as keyof PricingPlans, "popular", checked)}
                />
                <Label>Marcar como mais popular</Label>
              </div>

              <div>
                <Label className="mb-2 block">Funcionalidades</Label>
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(planKey as keyof PricingPlans, index, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(planKey as keyof PricingPlans, index)}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addFeature(planKey as keyof PricingPlans)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar funcionalidade
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button 
          onClick={() => saveContent("pricing_plans", pricingPlans)} 
          disabled={saving}
          className="w-full md:w-auto"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Planos
        </Button>
      </TabsContent>

      <TabsContent value="hero" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seção Hero</CardTitle>
            <CardDescription>Edite o conteúdo principal da página inicial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {heroContent && (
              <>
                <div>
                  <Label>Título Principal</Label>
                  <Input
                    value={heroContent.title}
                    onChange={(e) => setHeroContent({ ...heroContent, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Subtítulo</Label>
                  <Textarea
                    value={heroContent.subtitle}
                    onChange={(e) => setHeroContent({ ...heroContent, subtitle: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Botão Principal (CTA)</Label>
                    <Input
                      value={heroContent.cta_primary}
                      onChange={(e) => setHeroContent({ ...heroContent, cta_primary: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Botão Secundário</Label>
                    <Input
                      value={heroContent.cta_secondary}
                      onChange={(e) => setHeroContent({ ...heroContent, cta_secondary: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Button 
          onClick={() => saveContent("hero_content", heroContent)} 
          disabled={saving}
          className="w-full md:w-auto"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Hero
        </Button>
      </TabsContent>

      <TabsContent value="contact" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
            <CardDescription>Atualize os dados de contato exibidos no site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactInfo && (
              <>
                <div>
                  <Label>WhatsApp (com código do país)</Label>
                  <Input
                    value={contactInfo.whatsapp}
                    placeholder="5511999999999"
                    onChange={(e) => setContactInfo({ ...contactInfo, whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={contactInfo.instagram}
                    placeholder="@agendaaipro"
                    onChange={(e) => setContactInfo({ ...contactInfo, instagram: e.target.value })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Button 
          onClick={() => saveContent("contact_info", contactInfo)} 
          disabled={saving}
          className="w-full md:w-auto"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Contato
        </Button>
      </TabsContent>
    </Tabs>
  );
};
