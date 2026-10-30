import {
  PLANS,
  PLAN_KEYS,
  formatCurrency,
  PREMIUM_CONTENT_NOTE,
  DELIVERY_NOTE,
} from "@/lib/constants";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container py-20">
        <div className="max-w-4xl mx-auto">
          <Link to="/">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            TERMOS DE USO – AGENDAAÍ PRO
          </h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: 28 de outubro de 2026
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            <p className="text-lg">
              Bem-vindo ao AgendaAÍ Pro.
              <br />
              Ao acessar ou utilizar nosso site, aplicativo ou sistema, você
              concorda integralmente com estes Termos de Uso. Caso não concorde,
              não utilize nossos serviços.
            </p>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                1. SOBRE O AGENDAAÍ PRO
              </h2>
              <p className="mb-4">
                O AgendaAÍ Pro é um sistema digital de gestão profissional que
                oferece:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Agendamento online</li>
                <li>
                  Ferramentas conforme o plano e integrações confirmadas na
                  contratação
                </li>
                <li>
                  Vendas e estoque de produtos previstos no Gestão e Premium,
                  sujeitos à implementação e validação
                </li>
                <li>
                  Financeiro previsto no Gestão e Premium; insumos e margem
                  estimada previstos no Premium
                </li>
                <li>
                  Site com logo, cores e informações do cliente em todos os
                  planos
                </li>
              </ul>
              <p className="mt-4">
                O sistema não é um marketplace. Cada profissional possui seu
                próprio ambiente de uso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                2. CADASTRO E ACESSO
              </h2>
              <p className="mb-4">Para utilizar o sistema, o usuário deve:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Ser maior de 18 anos</li>
                <li>Manter a confidencialidade de suas credenciais</li>
              </ul>
              <p className="mt-4">
                O uso indevido da conta é de responsabilidade do usuário.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                3. PLANOS, PAGAMENTOS E VOUCHERS
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                {PLAN_KEYS.map((key) => (
                  <li key={key}>
                    {PLANS[key].name}: {formatCurrency(PLANS[key].price)}/mês e{" "}
                    {formatCurrency(PLANS[key].setupPrice)} de implementação
                    única.
                  </li>
                ))}
                <li>
                  A contratação padrão direciona ao checkout da implementação do plano escolhido, com o valor final e eventuais descontos apresentados no resumo. Após a confirmação do pagamento, o cliente envia os materiais e acompanha a preparação pela sua conta. O prazo de produção começa após o envio completo e a conferência dos materiais. Necessidades fora da estrutura e dos módulos do plano são avaliadas separadamente.
                </li>
                <li>
                  A implementação cobre a configuração inicial e o primeiro ano
                  de domínio .com.br, sujeito à disponibilidade. A renovação é
                  cobrada separadamente.
                </li>
                <li>
                  A mensalidade é contratada após a aprovação da entrega e inclui
                  ferramentas contratadas, hospedagem, manutenção técnica e
                  suporte de uso.
                </li>
                <li>{PREMIUM_CONTENT_NOTE}</li>
                <li>
                  No Premium, a entrega visual inicial contempla até 10 imagens
                  fornecidas pelo cliente, até 10 itens de portfólio, 1 vídeo
                  curto e 2 rodadas de revisão. Criação de logo e trabalhos
                  posteriores são orçados à parte.
                </li>
                <li>{DELIVERY_NOTE}</li>
                <li>
                  Taxas dos meios de pagamento, mensagens pagas e serviços
                  externos não estão incluídos na mensalidade.
                </li>
                <li>Pagamentos são processados via Stripe e/ou Pix</li>
                <li>
                  Vouchers promocionais podem ser oferecidos por tempo limitado
                </li>
              </ul>
              <p className="mt-4 font-semibold">Vouchers:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Um voucher por cobrança. A combinação com uma promoção só é permitida quando indicada nas regras da campanha.</li>
                <li>Podem ter validade e limite de uso</li>
                <li>Podem ser cancelados a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                4. RESPONSABILIDADES DO USUÁRIO
              </h2>
              <p className="mb-4">O usuário é responsável por:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Informações inseridas no sistema</li>
                <li>Cumprimento de obrigações fiscais</li>
                <li>Relação com seus clientes finais</li>
                <li>Produtos vendidos por meio do sistema</li>
              </ul>
              <p className="mt-4 font-semibold">
                O AgendaAÍ Pro não se responsabiliza por:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cancelamentos de clientes</li>
                <li>Faltas em atendimentos</li>
                <li>Problemas logísticos de produtos</li>
                <li>Obrigações legais do profissional com seus clientes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                5. DISPONIBILIDADE DO SERVIÇO
              </h2>
              <p className="mb-4">
                Buscamos manter o sistema disponível de forma contínua, porém:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Interrupções podem ocorrer para manutenção</li>
                <li>Não garantimos funcionamento ininterrupto</li>
                <li>
                  O serviço pode ser atualizado, modificado ou descontinuado
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                6. PROPRIEDADE INTELECTUAL
              </h2>
              <p>
                Todo o sistema, marca, layout, códigos, textos e funcionalidades
                são de propriedade do AgendaAÍ Pro.
              </p>
              <p className="mt-2">
                É proibida a cópia, reprodução ou uso não autorizado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                7. CANCELAMENTO E ENCERRAMENTO
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>O usuário pode cancelar a assinatura a qualquer momento</li>
                <li>
                  Não há reembolso de períodos já pagos, salvo disposição legal
                </li>
                <li>
                  O AgendaAÍ Pro pode suspender contas em caso de uso indevido
                  ou ilegal
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                8. LIMITAÇÃO DE RESPONSABILIDADE
              </h2>
              <p className="mb-4">O AgendaAÍ Pro não se responsabiliza por:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Perda de dados causada por uso indevido</li>
                <li>Danos indiretos ou lucros cessantes</li>
                <li>
                  Falhas externas de serviços integrados (Stripe, WhatsApp,
                  e-mail)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                9. ALTERAÇÕES DOS TERMOS
              </h2>
              <p>Os Termos podem ser alterados a qualquer momento.</p>
              <p className="mt-2">
                A continuidade do uso após alterações representa concordância.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. CONTATO</h2>
              <p>Dúvidas ou solicitações:</p>
              <p className="mt-2 text-primary">📧 contato@agendaaipro.com.br</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
