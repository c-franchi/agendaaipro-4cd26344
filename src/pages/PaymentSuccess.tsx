import {Link} from 'react-router-dom';
import MyOrders from './MyOrders';
export default function PaymentSuccess(){return <><div className="container max-w-3xl pt-8 space-y-3"><h1 className="text-2xl font-bold">Acompanhe a confirmação do pagamento</h1><p>A volta do checkout não confirma a cobrança. A situação abaixo será atualizada após a confirmação segura da Stripe. Use “Atualizar” caso o pagamento ainda esteja em processamento.</p><Link className="text-primary underline" to="/meus-pedidos">Abrir Meus pedidos</Link></div><MyOrders/></>}
