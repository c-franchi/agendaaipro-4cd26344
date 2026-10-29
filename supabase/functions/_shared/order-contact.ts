export function orderContact(body:Record<string,unknown>){
 const text=(key:string,max:number)=>{const v=body[key];if(typeof v!=='string'||v.trim().length>max)throw Error('Confira os dados do negócio e a mensagem.');return v.trim()};
 const phone=text('phone',30).replace(/[^0-9]/g,'');
 if(!/^[0-9]{10,15}$/.test(phone))throw Error('Informe um WhatsApp com DDD válido.');
 const business_type=text('businessType',100);if(business_type.length<2)throw Error('Selecione ou escreva sua área de atuação.');
 return {phone,business_type,business_name:text('businessName',100),request_message:text('message',1000)};
}
