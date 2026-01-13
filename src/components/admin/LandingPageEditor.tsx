import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Save, Plus, X, Upload, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface PlanData {
  name: string;
  price: number;
  promotional_price: number | null;
  description: string;
  features: string[];
  popular: boolean;
  bg_image?: string;
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
  bg_image?: string;
  mockup_image?: string;
}

interface VideoContent {
  video_url: string;
  title: string;
  subtitle: string;
}

interface ContactInfo {
  whatsapp: string;
  email: string;
  instagram: string;
}

export const LandingPageEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlans | null>(null);
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [videoContent, setVideoContent] = useState<VideoContent | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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
        } else if (item.key === "video_content") {
          setVideoContent(item.value as unknown as VideoContent);
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

  const saveContent = async (key: string, value: PricingPlans | HeroContent | VideoContent | ContactInfo | null) => {
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

  const handleImageUpload = async (planKey: keyof PricingPlans, file: File) => {
    if (!file) return;
    
    setUploading(planKey);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `plan-${planKey}-${Date.now()}.${fileExt}`;
      const filePath = `plans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("landing-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("landing-images")
        .getPublicUrl(filePath);

      updatePlan(planKey, "bg_image", publicUrl.publicUrl);
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(null);
    }
  };

  const removeImage = (planKey: keyof PricingPlans) => {
    updatePlan(planKey, "bg_image", "");
    toast.success("Imagem removida");
  };

  const handleHeroImageUpload = async (imageType: "bg_image" | "mockup_image", file: File) => {
    if (!file || !heroContent) return;
    
    setUploading(`hero_${imageType}`);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${imageType}-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("landing-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("landing-images")
        .getPublicUrl(filePath);

      setHeroContent({ ...heroContent, [imageType]: publicUrl.publicUrl });
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Error uploading hero image:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(null);
    }
  };

  const removeHeroImage = (imageType: "bg_image" | "mockup_image") => {
    if (!heroContent) return;
    setHeroContent({ ...heroContent, [imageType]: "" });
    toast.success("Imagem removida");
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
      <TabsList className="grid w-full grid-cols-4 max-w-2xl">
        <TabsTrigger value="pricing">Planos e Preços</TabsTrigger>
        <TabsTrigger value="hero">Hero Section</TabsTrigger>
        <TabsTrigger value="video">Vídeo</TabsTrigger>
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

              {/* Image Upload Section */}
              <div>
                <Label className="mb-2 block">Imagem de Fundo</Label>
                <div className="flex items-start gap-4">
                  {plan.bg_image ? (
                    <div className="relative group">
                      <img 
                        src={plan.bg_image} 
                        alt={`Background ${plan.name}`}
                        className="w-32 h-24 object-cover rounded-lg border border-border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(planKey as keyof PricingPlans)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-24 bg-secondary rounded-lg border border-dashed border-border flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[planKey] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(planKey as keyof PricingPlans, file);
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRefs.current[planKey]?.click()}
                      disabled={uploading === planKey}
                    >
                      {uploading === planKey ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {plan.bg_image ? "Trocar imagem" : "Enviar imagem"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recomendado: 800x600px, JPG ou PNG
                    </p>
                  </div>
                </div>
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
          <CardContent className="space-y-6">
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

                {/* Hero Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                  {/* Background Image */}
                  <div>
                    <Label className="mb-2 block">Imagem de Fundo (opcional)</Label>
                    <div className="flex items-start gap-4">
                      {heroContent.bg_image ? (
                        <div className="relative group">
                          <img 
                            src={heroContent.bg_image} 
                            alt="Hero Background"
                            className="w-32 h-24 object-cover rounded-lg border border-border"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeHeroImage("bg_image")}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-24 bg-secondary rounded-lg border border-dashed border-border flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => { fileInputRefs.current["hero_bg"] = el; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleHeroImageUpload("bg_image", file);
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRefs.current["hero_bg"]?.click()}
                          disabled={uploading === "hero_bg_image"}
                        >
                          {uploading === "hero_bg_image" ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {heroContent.bg_image ? "Trocar" : "Enviar"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mockup Image */}
                  <div>
                    <Label className="mb-2 block">Imagem do Mockup</Label>
                    <div className="flex items-start gap-4">
                      {heroContent.mockup_image ? (
                        <div className="relative group">
                          <img 
                            src={heroContent.mockup_image} 
                            alt="Hero Mockup"
                            className="w-32 h-24 object-cover rounded-lg border border-border"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeHeroImage("mockup_image")}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-24 bg-secondary rounded-lg border border-dashed border-border flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => { fileInputRefs.current["hero_mockup"] = el; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleHeroImageUpload("mockup_image", file);
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRefs.current["hero_mockup"]?.click()}
                          disabled={uploading === "hero_mockup_image"}
                        >
                          {uploading === "hero_mockup_image" ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {heroContent.mockup_image ? "Trocar" : "Enviar"}
                        </Button>
                      </div>
                    </div>
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

      <TabsContent value="video" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seção de Vídeo</CardTitle>
            <CardDescription>Configure o vídeo de demonstração</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {videoContent ? (
              <>
                <div>
                  <Label>URL do Vídeo (YouTube ou Vimeo)</Label>
                  <Input
                    value={videoContent.video_url}
                    placeholder="https://www.youtube.com/watch?v=..."
                    onChange={(e) => setVideoContent({ ...videoContent, video_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: YouTube (youtube.com/watch?v=...) ou Vimeo (vimeo.com/...)
                  </p>
                </div>
                <div>
                  <Label>Título da Seção</Label>
                  <Input
                    value={videoContent.title}
                    onChange={(e) => setVideoContent({ ...videoContent, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Subtítulo da Seção</Label>
                  <Textarea
                    value={videoContent.subtitle}
                    onChange={(e) => setVideoContent({ ...videoContent, subtitle: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Configuração de vídeo não encontrada</p>
                <Button 
                  onClick={() => setVideoContent({ video_url: "", title: "Veja o AgendaAÍ Pro em ação", subtitle: "Assista uma demonstração rápida" })}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar configuração de vídeo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Button 
          onClick={() => saveContent("video_content", videoContent)} 
          disabled={saving || !videoContent}
          className="w-full md:w-auto"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Vídeo
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