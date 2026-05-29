# Obras Gestor - Admin + Portal Público

Inclui:
- Portal público sem login para cidadão reportar demandas
- Consulta por protocolo
- Área administrativa com login
- Gestão de usuários/perfis
- Gestão de equipes
- Gestão de materiais/estoque
- Gestão de demandas
- Gestão de ordens de serviço
- Fotos em demandas e OS
- Relatórios e exportação CSV

Antes de publicar, rode no Supabase o arquivo:
supabase-complemento-admin-publico.sql

Administração:
adicione #admin ao final da URL ou clique em Área administrativa.

Publicar:
git add .
git commit -m "Implanta admin completo e portal publico"
git push


## Recurso de rotas

Na tela Demandas, use o botão "Gerar rota por categoria".
Exemplo: digite "Entulho" para abrir uma rota no Google Maps com as demandas de entulho que possuem latitude/longitude.

Observação: para a rota funcionar, o cidadão deve clicar em "Usar minha localização" ao enviar a demanda.


## Tema vermelho
Tema vermelho/branco/cinza implantado conforme mockup aprovado.
