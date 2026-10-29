import heroPlatform from "@/assets/hero-agenda-platform.webp";
import {
  PLANS,
  PLAN_KEYS,
  formatCurrency,
  PREMIUM_CONTENT_NOTE,
  DEFAULT_HERO,
  PlanKey,
} from "@/lib/constants";
import {validateMedia,videoSource} from "@/lib/landing-media";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Save,
  Plus,
  X,
  Upload,
  ImageIcon,
  Trash2,
  Scissors,
  Sparkles,
  Heart,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

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

interface TargetAudienceItem {
  icon: string;
  title: string;
  description: string;
  backgroundImage?: string;
  opacity?: number;
}

export const LandingPageEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [pricingImages, setPricingImages] = useState<Record<string, string>>(
    {},
  );
  const [heroContent, setHeroContent] = useState<HeroContent | null>(
    DEFAULT_HERO,
  );
  const [videoContent, setVideoContent] = useState<VideoContent | null>({video_url:"",title:"Veja a plataforma em ação",subtitle:"Conheça o agendamento online e o painel do profissional."});
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [targetAudiences, setTargetAudiences] = useState<
    TargetAudienceItem[] | null
  >(null);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("landing_content")
        .select("key, value");

      if (error) throw error;

      const legacyPlans = data?.find((item) => item.key === "pricing_plans")
        ?.value as Record<string, { bg_image?: string }> | undefined;
      const savedImages = data?.find((item) => item.key === "pricing_images_v2")
        ?.value as Record<string, string> | undefined;
      setPricingImages(
        Object.fromEntries(
          PLAN_KEYS.map((key) => [
            key,
            savedImages?.[key] ?? legacyPlans?.[key]?.bg_image ?? "",
          ]),
        ),
      );
      const previousHero = data?.find((item) => item.key === "hero_content")
        ?.value as unknown as HeroContent | undefined;
      const currentHero = data?.find((item) => item.key === "hero_content_v2")
        ?.value as unknown as HeroContent | undefined;
      setHeroContent({
        ...DEFAULT_HERO,
        bg_image: previousHero?.bg_image,
        mockup_image: previousHero?.mockup_image,
        ...currentHero,
      });
      data?.forEach((item) => {
        if (item.key === "video_content") {
          setVideoContent(current=>({...current,...(item.value as unknown as VideoContent)}));
        } else if (item.key === "contact_info") {
          setContactInfo(item.value as unknown as ContactInfo);
        } else if (item.key === "target_audiences_v2") {
          setTargetAudiences(item.value as unknown as TargetAudienceItem[]);
        }
      });

      const legacyAudiences = data?.find(
        (item) => item.key === "target_audiences",
      )?.value as unknown as TargetAudienceItem[] | undefined;
      // Preserve existing images while replacing the outdated commercial copy.
      // Set default target audiences if not found
      if (!data?.find((item) => item.key === "target_audiences_v2")) {
        setTargetAudiences(
          [
            {
              icon: "Scissors",
              title: "Barbeiros e Barbearias",
              description:
                "Organize serviços, horários e clientes em um site com a sua marca",
              opacity: 40,
            },
            {
              icon: "Sparkles",
              title: "Cabeleireiros e Salões",
              description:
                "Apresente seus serviços e escolha as ferramentas para sua operação",
              opacity: 40,
            },
            {
              icon: "HandMetal",
              title: "Manicures e Esteticistas",
              description:
                "Facilite a escolha de serviços e horários pelos seus clientes",
              opacity: 40,
            },
            {
              icon: "Heart",
              title: "Profissionais Autônomos",
              description:
                "Profissionalize seu atendimento e aumente sua credibilidade no mercado",
              opacity: 40,
            },
          ].map((item, index) => ({
            ...item,
            backgroundImage: legacyAudiences?.[index]?.backgroundImage,
            opacity: legacyAudiences?.[index]?.opacity ?? item.opacity,
          })),
        );
      }
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

  const saveContent = async (
    key: string,
    value:
      | HeroContent
      | VideoContent
      | ContactInfo
      | TargetAudienceItem[]
      | Record<string, string>
      | null,
  ) => {
    if (!value) return;
    setSaving(true);
    try {
      // Try update first
      const { data: existingData } = await supabase
        .from("landing_content")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      if (existingData) {
        const { error } = await supabase
          .from("landing_content")
          .update({
            value: JSON.parse(JSON.stringify(value)) as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("key", key);

        if (error) throw error;
      } else {
        // Insert if not exists
        const { error } = await supabase.from("landing_content").insert({
          key,
          value: JSON.parse(JSON.stringify(value)) as Json,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      toast.success("Conteúdo salvo com sucesso!");
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Erro ao salvar conteúdo");
    } finally {
      setSaving(false);
    }
  };

  const updateTargetAudience = (
    index: number,
    field: keyof TargetAudienceItem,
    value: string | number,
  ) => {
    if (!targetAudiences) return;
    const updated = [...targetAudiences];
    updated[index] = { ...updated[index], [field]: value };
    setTargetAudiences(updated);
  };

  const handleAudienceImageUpload = async (index: number, file: File) => {
    if (!file || !targetAudiences) return;

    setUploading(`audience_${index}`);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `audience-${index}-${Date.now()}.${fileExt}`;
      const filePath = `audience/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("landing-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("landing-images")
        .getPublicUrl(filePath);

      updateTargetAudience(index, "backgroundImage", publicUrl.publicUrl);
      toast.success("Imagem enviada. Toque em Salvar capa para aplicar.");
    } catch (error) {
      console.error("Error uploading audience image:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(null);
    }
  };

  const removeAudienceImage = (index: number) => {
    updateTargetAudience(index, "backgroundImage", "");
    toast.success("Imagem personalizada removida. Salve a seção para aplicar o padrão.");
  };

  const handlePlanImageUpload = async (key: PlanKey, file: File) => {
    setUploading(key);
    try {
      const path = `plans/${key}-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage
        .from("landing-images")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage
        .from("landing-images")
        .getPublicUrl(path);
      setPricingImages((previous) => ({ ...previous, [key]: data.publicUrl }));
      toast.success(
        "Imagem enviada. Salve as imagens dos planos para aplicar.",
      );
    } catch {
      toast.error("Não foi possível enviar a imagem.");
    } finally {
      setUploading(null);
    }
  };

  const handleHeroImageUpload = async (
    imageType: "bg_image" | "mockup_image",
    file: File,
  ) => {
    if (!file || !heroContent) return;
    const validation=validateMedia(file,'image');if(validation){toast.error(validation);return;}

    setUploading(`hero_${imageType}`);
    try {
      const fileExt = file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp';
      const fileName = `hero-${imageType}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("landing-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("landing-images")
        .getPublicUrl(filePath);

      setHeroContent(current=>current?{...current,[imageType]:publicUrl.publicUrl}:current);
      toast.success("Imagem enviada. Toque em Salvar capa para aplicar.");
    } catch (error) {
      console.error("Error uploading hero image:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(null);
    }
  };

  const handleVideoUpload=async(file:File)=>{
    const validation=validateMedia(file,'video');if(validation){toast.error(validation);return;}
    setUploading('video');
    try{const path=`videos/${crypto.randomUUID()}.${file.type==='video/mp4'?'mp4':'webm'}`;
      const {error}=await supabase.storage.from('landing-videos').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;
      const {data}=supabase.storage.from('landing-videos').getPublicUrl(path);
      setVideoContent(current=>({...current,video_url:data.publicUrl,title:current?.title||'Veja a plataforma em ação',subtitle:current?.subtitle||'Conheça o agendamento e o painel do profissional.'}));
      toast.success('Vídeo enviado. Toque em Salvar Vídeo para publicar.');
    }catch{toast.error('Não foi possível enviar. Confira sua conexão e a configuração de mídia do projeto.')}finally{setUploading(null)}
  };

  const removeHeroImage = (imageType: "bg_image" | "mockup_image") => {
    if (!heroContent) return;
    setHeroContent({ ...heroContent, [imageType]: "" });
    toast.success("Imagem personalizada removida. Salve a seção para aplicar o padrão.");
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
      <TabsList className="grid h-auto w-full grid-cols-3 sm:grid-cols-5 gap-1 p-1.5">
        <TabsTrigger className="min-h-11 text-xs sm:text-sm" value="pricing">Planos</TabsTrigger>
        <TabsTrigger className="min-h-11 text-xs sm:text-sm" value="hero">Capa</TabsTrigger>
        <TabsTrigger className="min-h-11 text-xs sm:text-sm" value="audience">Público</TabsTrigger>
        <TabsTrigger className="min-h-11 text-xs sm:text-sm" value="video">Vídeo</TabsTrigger>
        <TabsTrigger className="min-h-11 text-xs sm:text-sm" value="contact">Contato</TabsTrigger>
      </TabsList>

      <TabsContent value="pricing" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Oferta comercial vigente</CardTitle>
            <CardDescription>
              Valores e escopo da nova oferta são centralizados no catálogo do
              código. Os preços e promoções antigos do banco não são usados na
              nova contratação. Assinaturas existentes mantêm suas condições.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PLAN_KEYS.map((key) => (
              <div key={key} className="rounded-lg border p-4">
                <h3 className="font-semibold">{PLANS[key].name}</h3>
                <p>
                  {formatCurrency(PLANS[key].price)}/mês +{" "}
                  {formatCurrency(PLANS[key].setupPrice)} de implementação única
                </p>
                <p className="text-sm text-muted-foreground">
                  {PLANS[key].description}
                </p>
                <Label className="mt-4 block" htmlFor={`plan-image-${key}`}>
                  Imagem de fundo do plano
                </Label>
                {pricingImages[key] && (
                  <img
                    src={pricingImages[key]}
                    alt={`Fundo do plano ${PLANS[key].name}`}
                    className="h-24 rounded-lg my-2"
                  />
                )}
                <Input
                  id={`plan-image-${key}`}
                  type="file"
                  accept="image/*"
                  disabled={uploading !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handlePlanImageUpload(key, file);
                  }}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPricingImages((previous) => ({ ...previous, [key]: "" }))
                  }
                >
                  Usar imagem padrão
                </Button>
              </div>
            ))}
            <Button
              onClick={() => saveContent("pricing_images_v2", pricingImages)}
              disabled={saving || uploading !== null}
            >
              Salvar imagens dos planos
            </Button>
            <p className="text-sm">{PREMIUM_CONTENT_NOTE}</p>
            <p className="text-sm text-muted-foreground">
              Contratação assistida, sem cobrança automática. Estoque e gestão
              ampliada aguardam implementação e validação no sistema entregue. A
              edição de preços neste painel será reativada junto da nova
              cobrança, para manter oferta e pagamento sincronizados.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="hero" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seção Hero</CardTitle>
            <CardDescription>
              Edite o conteúdo principal da página inicial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {heroContent && (
              <>
                <div>
                  <Label>Título Principal</Label>
                  <Input
                    value={heroContent.title}
                    onChange={(e) =>
                      setHeroContent({ ...heroContent, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Subtítulo</Label>
                  <Textarea
                    value={heroContent.subtitle}
                    onChange={(e) =>
                      setHeroContent({
                        ...heroContent,
                        subtitle: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Botão Principal (CTA)</Label>
                    <Input
                      value={heroContent.cta_primary}
                      onChange={(e) =>
                        setHeroContent({
                          ...heroContent,
                          cta_primary: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Botão Secundário</Label>
                    <Input
                      value={heroContent.cta_secondary}
                      onChange={(e) =>
                        setHeroContent({
                          ...heroContent,
                          cta_secondary: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Hero Images with Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                  {/* Background Image */}
                  <div>
                    <Label className="mb-2 block">
                      Imagem de Fundo (opcional)
                    </Label>
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      {heroContent.bg_image ? (
                        <div className="relative group">
                          <img
                            src={heroContent.bg_image}
                            alt="Hero Background"
                            className="w-40 h-32 object-cover rounded-lg border border-border shadow-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            onClick={() => removeHeroImage("bg_image")}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg text-center">
                            Preview
                          </div>
                        </div>
                      ) : (
                        <div className="w-40 h-32 bg-secondary rounded-lg border border-dashed border-border flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => {
                            fileInputRefs.current["hero_bg"] = el;
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleHeroImageUpload("bg_image", file);
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() =>
                            fileInputRefs.current["hero_bg"]?.click()
                          }
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

                  {/* Mockup Image with Preview */}
                  <div>
                    <Label className="mb-2 block">Imagem do Mockup</Label>
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      {(heroContent.mockup_image || heroPlatform) ? (
                        <div className="relative group">
                          <img
                            src={heroContent.mockup_image || heroPlatform}
                            alt="Hero Mockup"
                            className="w-40 h-32 object-contain rounded-lg border border-border shadow-lg bg-card"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            onClick={() => removeHeroImage("mockup_image")}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg text-center">
                            Preview
                          </div>
                        </div>
                      ) : (
                        <div className="w-40 h-32 bg-secondary rounded-lg border border-dashed border-border flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => {
                            fileInputRefs.current["hero_mockup"] = el;
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                              handleHeroImageUpload("mockup_image", file);
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() =>
                            fileInputRefs.current["hero_mockup"]?.click()
                          }
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
          onClick={() => saveContent("hero_content_v2", heroContent)}
          disabled={saving || uploading !== null}
          className="w-full md:w-auto"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar capa
        </Button>
      </TabsContent>

      <TabsContent value="audience" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Público-Alvo</CardTitle>
            <CardDescription>
              Edite os cards de público-alvo da seção "Para quem é o AgendaAÍ
              Pro"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {targetAudiences &&
              targetAudiences.map((audience, index) => (
                <div
                  key={index}
                  className="p-4 border border-border rounded-lg space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Card {index + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Ícone</Label>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={audience.icon}
                        onChange={(e) =>
                          updateTargetAudience(index, "icon", e.target.value)
                        }
                      >
                        <option value="Scissors">Tesoura (Barbeiros)</option>
                        <option value="Sparkles">
                          Brilhos (Cabeleireiros)
                        </option>
                        <option value="HandMetal">Mão (Manicures)</option>
                        <option value="Heart">Coração (Autônomos)</option>
                      </select>
                    </div>
                    <div>
                      <Label>Título</Label>
                      <Input
                        value={audience.title}
                        onChange={(e) =>
                          updateTargetAudience(index, "title", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={audience.description}
                      onChange={(e) =>
                        updateTargetAudience(
                          index,
                          "description",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <Label className="mb-2 block">Imagem de Fundo</Label>
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      {audience.backgroundImage ? (
                        <div className="relative group">
                          <img
                            src={audience.backgroundImage}
                            alt={`Background ${audience.title}`}
                            className="w-32 h-24 object-cover rounded-lg border border-border shadow-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            onClick={() => removeAudienceImage(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-24 bg-secondary rounded-lg border border-dashed border-border flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => {
                            fileInputRefs.current[`audience_${index}`] = el;
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAudienceImageUpload(index, file);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            fileInputRefs.current[`audience_${index}`]?.click()
                          }
                          disabled={uploading === `audience_${index}`}
                        >
                          {uploading === `audience_${index}` ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {audience.backgroundImage ? "Trocar" : "Enviar"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recomendado: 400x300px
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Opacity Control */}
                  <div>
                    <Label className="mb-2 block">
                      Transparência da Imagem: {audience.opacity || 40}%
                    </Label>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">0%</span>
                      <Slider
                        value={[audience.opacity || 40]}
                        onValueChange={(value) =>
                          updateTargetAudience(index, "opacity", value[0])
                        }
                        min={0}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground">
                        100%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quanto maior o valor, mais visível a imagem ficará
                    </p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Button
          onClick={() => saveContent("target_audiences_v2", targetAudiences)}
          disabled={saving || uploading !== null}
          className="w-full md:w-auto"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Público-Alvo
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
                  <Label htmlFor="demo-video-upload">Enviar vídeo do dispositivo</Label>
                  <Input id="demo-video-upload" type="file" accept="video/mp4,video/webm" disabled={uploading!==null||saving} onChange={e=>{const file=e.target.files?.[0];if(file)void handleVideoUpload(file);e.target.value=''}}/>
                  <p className="text-xs text-muted-foreground mt-1">MP4 ou WebM, até 100 MB. {uploading==='video'?'Enviando… mantenha esta tela aberta.':'O envio não publica sozinho; salve a seção depois.'}</p>
                  <Label className="block mt-4">Ou cole um link de vídeo</Label>
                  <Input
                    value={videoContent.video_url}
                    placeholder="https://www.youtube.com/watch?v=..."
                    onChange={(e) =>
                      setVideoContent({
                        ...videoContent,
                        video_url: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Links aceitos: YouTube, Vimeo ou arquivo MP4/WebM em HTTPS.
                  </p>
                </div>
                <div>
                  {videoSource(videoContent.video_url)?.kind==='file'&&<video src={videoContent.video_url} controls playsInline preload="metadata" className="my-3 max-h-72 w-full rounded-lg bg-black object-contain" aria-label="Prévia do vídeo enviado"/>}
                  <Label>Título da Seção</Label>
                  <Input
                    value={videoContent.title}
                    onChange={(e) =>
                      setVideoContent({
                        ...videoContent,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Subtítulo da Seção</Label>
                  <Textarea
                    value={videoContent.subtitle}
                    onChange={(e) =>
                      setVideoContent({
                        ...videoContent,
                        subtitle: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Configuração de vídeo não encontrada
                </p>
                <Button
                  onClick={() =>
                    setVideoContent({
                      video_url: "",
                      title: "Veja o AgendaAÍ Pro em ação",
                      subtitle: "Assista uma demonstração rápida",
                    })
                  }
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
          disabled={saving || uploading !== null || !videoContent}
          className="w-full md:w-auto"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Vídeo
        </Button>
      </TabsContent>

      <TabsContent value="contact" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
            <CardDescription>
              Atualize os dados de contato exibidos no site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactInfo && (
              <>
                <div>
                  <Label>WhatsApp (com código do país)</Label>
                  <Input
                    value={contactInfo.whatsapp}
                    placeholder="5511999999999"
                    onChange={(e) =>
                      setContactInfo({
                        ...contactInfo,
                        whatsapp: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={contactInfo.instagram}
                    placeholder="@agendaaipro"
                    onChange={(e) =>
                      setContactInfo({
                        ...contactInfo,
                        instagram: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={() => saveContent("contact_info", contactInfo)}
          disabled={saving || uploading !== null}
          className="w-full md:w-auto"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Contato
        </Button>
      </TabsContent>
    </Tabs>
  );
};
