# Exemplos e identificação do prestador

## Onde editar o contrato

ADM → Contrato (`/admin?tab=contract`): nome completo/razão social, nome fantasia, CPF/CNPJ, endereço comercial completo e e-mail. O formulário informa que esses dados aparecem no contrato dos clientes. Validação dos dígitos de CPF/CNPJ e campos obrigatórios no servidor; só o administrador autorizado pode salvar.

As cláusulas-base permanecem na versão 2026-10-30-v1. Os dados do prestador recebem uma revisão separada. Novos aceites guardam uma cópia integral da identificação vigente; contratos já aceitos não são alterados. Se os dados mudarem entre a leitura e a contratação, o cliente precisa atualizar o resumo e conferir novamente.

Sem acesso anônimo aos RPCs de configuração e leitura do contrato. A configuração é guardada no banco, não em código ou repositório. Não inserir CPF/CNPJ real em migrações ou fixtures de teste.

## Carrossel

Um projeto real (Eric Zambonini) e quatro conceitos visuais ilustrativos, identificados como demonstração. Não representam clientes entregues nem novos sistemas hospedados. Setas, seleção por segmento, gesto de arrastar no celular e ampliação de imagem. Sem reprodução automática. Os recursos finais seguem o plano e o escopo da contratação.

## Imagens e prompts

Modo: ferramenta integrada image_gen; quatro gerações independentes. Os originais foram preservados. As imagens finais WebP mantêm 1536×1024 e foram codificadas com qualidade 88 para publicação, sem recortes ou mudanças de composição.

Arquivos finais no projeto:
- src/assets/examples/barbearia-conceito.webp
- src/assets/examples/estetica-conceito.webp
- src/assets/examples/pilates-conceito.webp
- src/assets/examples/pet-conceito.webp

Prompt base usado em todas as gerações:

> Use case: ui-mockup. Create a high-quality landscape 1536x1024 marketing image for a Brazilian booking SaaS portfolio carousel. Show a realistic browser interface front-on, plus a small mobile booking interface on its right, filling most of the frame, sharp typography, elegant premium UI. Preserve the core product logic: services, choose day, available time, confirmation; admin agenda and simple appointments. This is a fictional design concept, not a real customer. No huge advertising copy, no promises, no extra business tools, no charts pretending real data, no watermarks. Screen text in Portuguese, minimal legible labels. Include small label 'Conceito visual'. A tasteful dark studio backdrop, crisp borders, no exaggerated perspective.

Complemento barbearia:

> Barbearia. Charcoal black and warm copper highlights, premium editorial dark theme similar to an elegant luxury hair salon. Browser shows a weekly agenda with 3 weekday columns and compact appointment cards, subtle barber photograph in a narrow header, fictional heading 'BARBEARIA · AGENDA', service 'Corte e barba'. Smartphone shows a simple 4-step booking form. Balanced design.

Complemento estética:

> Estética e depilação. Warm ivory, blush and muted rose gold, refined light premium theme. Main screen shows a monthly calendar with understated rose selected day and a right sidebar of available times; subtle professional skincare photograph in a narrow hero. Heading 'ESTÉTICA · AGENDAMENTO'. Smartphone shows service cards. Same simple logic as salon booking.

Complemento pilates:

> Estúdio de pilates. Sage green, deep forest and off-white, premium wellness visual with calm airy layout. Browser shows a daily agenda timeline from 08:00 to 18:00 with two or three appointments; a small tasteful photograph of an empty pilates studio in header. Heading 'PILATES · AGENDA'. Smartphone has a monthly date picker and available times. Only single-professional scheduling, no class capacity or multi-staff features.

Complemento banho e tosa:

> Banho e tosa. Deep navy and soft sky blue, warm clean premium styling, not childish. Main browser screen has a split view calendar and clean list of appointments for the selected day. A restrained photo of a groomed dog in a narrow hero banner. Heading 'BANHO E TOSA · AGENDA'. Smartphone shows service selection cards and booking confirmation. Do not add animal records or veterinary capabilities. Same single agenda logic.
