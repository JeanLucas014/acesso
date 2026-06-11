# Acesso — Design System & Wireframes

## Regras do Projeto

### Ícones
- **Usar apenas Lucide React** para ícones. Nunca usar emoji como ícone funcional na UI final (⚽, 🏟️, 💰, etc.)
- Emoji são permitidos **apenas em microcopy** (textos de feedback, toasts, mensagens animadas) — nunca em headers, labels, botões de ação ou navegação
- Exemplos corretos: `<Trophy />` em vez de 🏆, `<Heart />` em vez de ❤️, `<AlertTriangle />` em vez de ⚠️

### Responsividade
- **Mobile-first (390px)** como base, mas todas as telas devem ter **versão desktop otimizada**
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Desktop deve aproveitar o espaço: sidebars, grids multi-coluna, cards lado a lado
- Dashboard desktop: layout 2-3 colunas com sidebar de navegação lateral
- Elenco desktop: grid de cards em vez de lista vertical
- Pré-jogo desktop: campo SVG maior com banco de reservas ao lado
- Finanças desktop: gráficos maiores + tabela expandida
- Transferências desktop: lista + detalhe lado a lado (master-detail)

### Design System
- Cores, tipografia e tokens estão documentados nos wireframes HTML
- Seguir rigorosamente o spec: sem gradientes, sem glassmorphism, flat e limpo
- Tom divertido no copy, sério no layout
