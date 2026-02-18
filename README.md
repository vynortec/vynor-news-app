# 📐 VynorNew's - Business Intelligence & Corporate News

O **VynorNew's** é uma plataforma mobile-first (PWA) de alta performance voltada para o mercado corporativo. O aplicativo utiliza modelos avançados de IA (**Google Gemini**) para transformar o mar de informações globais em insights acionáveis para executivos e investidores.

## 🚀 Funcionalidades Principais

- 📰 **Feed Inteligente:** Notícias reais e recentes obtidas através do Google Search Grounding.
- ⚠️ **Análise de Impacto:** Classificação automática de notícias (Low, Medium, High, Critical) com recomendações estratégicas.
- 🧠 **Resumos Executivos:** Resumos de dois parágrafos focados no que realmente importa para o negócio.
- 🎨 **Editor Visual AI:** Ferramenta integrada que utiliza o modelo `gemini-2.5-flash-image` para editar gráficos e fotos corporativas via comandos de texto.
- 🎯 **Onboarding Personalizado:** Filtre seu feed por setores como Finanças, Tech, ESG, Agronegócio e muito mais.
- 💾 **Arquivo de Insights:** Salve notícias críticas para consulta posterior em sua base local.

## 🛠️ Stack Tecnológica

- **Frontend:** React 19, TypeScript, Tailwind CSS.
- **Ícones:** Lucide React.
- **IA/LLM:** `@google/genai`
  - **Texto:** `gemini-3-flash-preview` (com busca em tempo real).
  - **Imagem:** `gemini-2.5-flash-image`.
- **PWA:** Service Workers para suporte offline e manifesto para instalação como app nativo.

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js instalado (para rodar localmente).
- Uma **API Key do Google Gemini** (obtenha em [ai.google.dev](https://ai.google.dev/)).

### Instalação Local
1. Clone este repositório:
   ```bash
   git clone https://github.com/seu-usuario/vynor-news.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz e adicione sua chave:
   ```env
   API_KEY=sua_chave_aqui
   ```
4. Inicie o servidor:
   ```bash
   npm run dev
   ```

## 🌐 Deploy (Vercel / Netlify)

Para que o aplicativo funcione online com sua chave de IA:
1. Conecte seu repositório GitHub à **Vercel**.
2. Nas configurações do projeto (**Environment Variables**), adicione a chave:
   - **Key:** `API_KEY`
   - **Value:** `[Sua Chave do Gemini]`
3. O link será gerado automaticamente (ex: `vynor-news.vercel.app`).

## 📱 Instalação como App (PWA)

1. Abra o link gerado no seu celular.
2. **iOS (Safari):** Clique em "Compartilhar" -> "Adicionar à Tela de Início".
3. **Android (Chrome):** Clique nos três pontos -> "Instalar Aplicativo".

## 📄 Licença
Este projeto foi desenvolvido para fins de demonstração de engenharia de software e inteligência artificial.

---
*Desenvolvido com foco em estética premium e funcionalidade enterprise.*
