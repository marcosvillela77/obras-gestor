# Obras Gestor - versão completa

Itens implantados:
1. Login e usuários com Supabase Auth
2. Demandas completas: criar, editar, alterar status, filtros, anexar foto e gerar OS
3. Ordens de serviço: criar, atribuir equipe, iniciar, concluir, observações e fotos antes/depois
4. Upload de fotos em demandas e OS
5. Relatórios: demandas por bairro, OS concluídas, estoque crítico, produtividade e exportação CSV/PDF

## Publicar na Vercel

Configurações:
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install

## Atualizar GitHub

Substitua os arquivos do projeto antigo por estes arquivos, depois rode:

```bash
git add .
git commit -m "Implanta login, demandas, OS, fotos e relatorios"
git push
```

Depois faça redeploy na Vercel.

## Observação sobre fotos

Nesta versão MVP, as fotos são salvas como Data URL diretamente nas colunas foto_url/os_fotos. Para produção com muitas fotos, o ideal é migrar para Supabase Storage.
