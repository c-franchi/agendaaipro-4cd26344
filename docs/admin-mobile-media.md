# ADM mobile e mídia da página inicial

Abas principais com altura automática, ícone e nome; edição da página com abas em duas linhas no mobile. Cabeçalho compacto com ações nomeadas, cartões com menos espaçamento e gráficos com somente um ResponsiveContainer, largura limitada e altura proporcional. Gráficos de quantidade usam valores inteiros; legenda de segmentos quebra linhas fora da pizza.

Imagem principal padrão nova: src/assets/hero-agenda-platform.webp, criada para representar agenda em computador/celular. Fotos já configuradas pelo operador continuam prioritárias. Na aba Capa, remover a imagem personalizada e salvar restaura a nova imagem padrão. Upload da imagem principal e do fundo disponível; JPG/PNG/WebP até 5 MB. Mídia pública de marketing: não enviar arquivos privados.

Vídeo: upload MP4/WebM até 100 MB ou link YouTube/Vimeo/arquivo HTTPS. Upload não publica sozinho: revisar e clicar Salvar Vídeo. O player nativo preserva a proporção, usa controles e não carrega o vídeo antes da reprodução. Upload de arquivos e salvamento ficam bloqueados durante o envio para evitar gravações incompletas. Arquivos já enviados não são excluídos automaticamente quando a URL é substituída, preservando referências existentes.

## Atualização sem chamadas ao Lovable

Aplicar 20261029150000_landing_media.sql antes de publicar frontend; cria bucket landing-videos e restringe escrita das mídias ao operador. O limite efetivo de upload também depende do limite global de Storage do projeto; para vídeos maiores, usar YouTube/Vimeo. Não altera segredos, domínio, cobranças ou dados existentes. Não foi feita publicação no ambiente hospedado.

Validação: teste local de MIME/tamanho e parsing de URLs; typecheck e build. Upload autenticado e reprodução de arquivo real devem ser validados após migração no ambiente hospedado.
