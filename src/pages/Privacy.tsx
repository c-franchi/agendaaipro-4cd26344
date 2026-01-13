import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const Privacy = () => {
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

          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">POLÍTICA DE PRIVACIDADE – AGENDAAÍ PRO</h1>
          </div>
          <p className="text-muted-foreground mb-8">Última atualização: 13 de janeiro de 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <p className="text-lg">
              A sua privacidade é importante para nós.<br />
              Esta Política descreve como coletamos, usamos e protegemos seus dados, conforme a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).
            </p>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. DADOS COLETADOS</h2>
              <p className="mb-4">Podemos coletar:</p>
              
              <p className="font-semibold mt-4">Dados do usuário:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nome</li>
                <li>E-mail</li>
                <li>Telefone</li>
                <li>Dados de login</li>
              </ul>

              <p className="font-semibold mt-4">Dados operacionais:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Agendamentos</li>
                <li>Serviços</li>
                <li>Produtos</li>
                <li>Pagamentos</li>
                <li>Relatórios financeiros</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. FINALIDADE DO USO DOS DADOS</h2>
              <p className="mb-4">Utilizamos os dados para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Operar o sistema</li>
                <li>Processar pagamentos</li>
                <li>Enviar notificações por e-mail</li>
                <li>Comunicação via WhatsApp</li>
                <li>Cumprimento de obrigações legais</li>
                <li>Melhoria do serviço</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. COMPARTILHAMENTO DE DADOS</h2>
              <p className="mb-4">Os dados podem ser compartilhados com:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Stripe (pagamentos)</li>
                <li>Resend (envio de e-mails)</li>
                <li>Serviços de hospedagem e infraestrutura</li>
              </ul>
              <p className="mt-4 font-semibold text-primary">Nunca vendemos dados pessoais.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. ARMAZENAMENTO E SEGURANÇA</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dados são armazenados em ambiente seguro</li>
                <li>Utilizamos medidas técnicas e organizacionais para proteção</li>
                <li>O acesso é restrito e controlado</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. DIREITOS DO TITULAR (LGPD)</h2>
              <p className="mb-4">Você pode solicitar:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Confirmação de tratamento</li>
                <li>Acesso aos dados</li>
                <li>Correção de dados</li>
                <li>Exclusão de dados</li>
                <li>Portabilidade</li>
                <li>Revogação de consentimento</li>
              </ul>
              <p className="mt-4">Solicitações devem ser feitas pelo e-mail:</p>
              <p className="text-primary">📧 contato@agendaaipro.com.br</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. COOKIES</h2>
              <p className="mb-4">Podemos utilizar cookies para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Melhorar a experiência</li>
                <li>Análises de uso</li>
                <li>Funcionalidades essenciais</li>
              </ul>
              <p className="mt-4">Você pode gerenciar cookies no seu navegador.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. RETENÇÃO DE DADOS</h2>
              <p className="mb-4">Os dados são mantidos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Enquanto durar a relação contratual</li>
                <li>Pelo tempo exigido por lei</li>
                <li>Ou até solicitação de exclusão (quando aplicável)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. ALTERAÇÕES NA POLÍTICA</h2>
              <p>Esta política pode ser atualizada a qualquer momento.</p>
              <p className="mt-2">Recomendamos revisão periódica.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. CONTATO</h2>
              <p>Em caso de dúvidas:</p>
              <p className="mt-2 text-primary">📧 contato@agendaaipro.com.br</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
