import { Link } from "react-router-dom";
import { ArrowLeft, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const AffiliateTerms = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Header />
    <main className="container py-20">
      <div className="max-w-4xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-8"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <Handshake className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold">TERMOS DO PROGRAMA DE AFILIADOS – AGENDAAÍ PRO</h1>
        </div>
        <p className="text-muted-foreground mb-8">Última atualização: 25 de novembro de 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <p className="text-lg">Estes Termos regem a participação no Programa de Afiliados do AgendaAÍ Pro. Ao aceitar o cadastro ou divulgar seu link de indicação, o afiliado concorda com estas condições, que complementam os <Link to="/termos" className="text-primary">Termos de Uso</Link>.</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. CADASTRO E PARTICIPAÇÃO</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>A participação depende de aprovação e cadastro feitos pelo AgendaAÍ Pro.</li>
              <li>O afiliado deve informar dados verdadeiros: nome, e-mail de acesso, WhatsApp e chave Pix de sua titularidade.</li>
              <li>O afiliado é um parceiro independente. Não existe vínculo empregatício, societário ou de representação comercial exclusiva.</li>
              <li>O afiliado não pode assumir obrigações nem fazer promessas em nome do AgendaAÍ Pro.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. COMISSÕES</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>15%</strong> do valor efetivamente pago pela implementação.</li>
              <li><strong>5%</strong> de cada mensalidade efetivamente paga, enquanto o cliente indicado mantiver a assinatura ativa e em dia.</li>
              <li>A comissão é calculada sobre o valor pago após descontos e vouchers, sem incluir taxas, tributos ou estornos.</li>
              <li>A venda é atribuída ao afiliado quando o cliente compra pelo link de indicação. Cada pedido pertence a um só afiliado, e essa atribuição não muda depois.</li>
              <li>Não há comissão sobre pagamentos não concluídos, recusados, cancelados ou estornados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. PAGAMENTO</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>As comissões aprovadas são pagas por Pix, de forma manual, na chave cadastrada.</li>
              <li>O afiliado acompanha valores a receber e recebidos na <Link to="/afiliado" className="text-primary">Área do Afiliado</Link>.</li>
              <li>O AgendaAÍ Pro pode reter o pagamento de uma comissão durante o prazo de reembolso ou contestação da venda.</li>
              <li>O afiliado é responsável por tributos e obrigações fiscais sobre os valores recebidos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. REEMBOLSOS E CANCELAMENTOS</h2>
            <p>Se uma venda for reembolsada, contestada ou cancelada, a comissão dela será cancelada. Se já tiver sido paga, o valor poderá ser descontado de comissões futuras.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. PRÁTICAS PROIBIDAS</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Enviar spam ou mensagens em massa sem autorização.</li>
              <li>Fazer publicidade enganosa ou prometer preços, prazos e funções que não existem.</li>
              <li>Comprar pelo próprio link ou criar indicações falsas.</li>
              <li>Usar a marca AgendaAÍ Pro em anúncios pagos com o nome da marca, ou se passar pela empresa, sem autorização.</li>
              <li>Divulgar o programa em conteúdo ilegal, ofensivo ou que viole direitos de terceiros.</li>
            </ul>
            <p className="mt-4">Se alguma dessas práticas for comprovada, o AgendaAÍ Pro poderá cancelar comissões relacionadas e encerrar a participação.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. DADOS PESSOAIS</h2>
            <p>Guardamos nome, e-mail, WhatsApp, chave Pix, código de indicação e histórico de comissões. Esses dados servem para identificar indicações, calcular e pagar comissões e cumprir obrigações legais. O afiliado vê somente os próprios dados. Ele não recebe dados pessoais dos clientes indicados, apenas as informações necessárias para conferir suas comissões. Mais detalhes estão na <Link to="/privacidade" className="text-primary">Política de Privacidade</Link>.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. ENCERRAMENTO E ALTERAÇÕES</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Qualquer das partes pode encerrar a participação a qualquer momento.</li>
              <li>Comissões de vendas válidas feitas antes do encerramento sem violação destes Termos continuam devidas. Mensalidades pagas depois do encerramento não geram comissão, salvo acordo por escrito.</li>
              <li>Mudanças nos percentuais valem só para vendas futuras e serão comunicadas com antecedência.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. CONTATO</h2>
            <p className="text-primary">📧 contato@agendaaipro.com.br</p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default AffiliateTerms;
