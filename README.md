# 🛍️ Minha Lojinha

Catálogo de itens para venda — gratuito, sem mensalidade, publicado como link via GitHub Pages.

```
loja/
├── index.html    ← estrutura da página (não edite)
├── style.css     ← visual (não edite)
├── app.js        ← lógica (não edite)
├── config.json   ← ✏️ configurações da sua loja
└── items.csv     ← ✏️ seus itens à venda (planilha)
```

Você gerencia tudo editando **`config.json`** e **`items.csv`** direto no GitHub — ou baixando o CSV, editando no Excel/Google Sheets, e subindo de volta.  
Qualquer pessoa que abrir o link verá as informações atualizadas.

---

## 🚀 Colocando no ar (do zero)

### 1 — Criar conta no GitHub

1. Acesse **[github.com](https://github.com)** → **Sign up**
2. Escolha um username simples, ex: `brechoana` ou `lojafamilia`
3. Confirme o e-mail e escolha o plano **Free**

---

### 2 — Criar o repositório

1. Clique em **New** (botão verde) ou acesse [github.com/new](https://github.com/new)
2. Preencha:
   - **Repository name:** `loja`
   - Marque **Public**
   - Marque **Add a README file**
3. Clique em **Create repository**

---

### 3 — Subir os arquivos

1. Dentro do repositório, clique em **Add file → Upload files**
2. Arraste os 5 arquivos de uma vez:
   - `index.html`
   - `style.css`
   - `app.js`
   - `config.json`
   - `items.csv`
3. Clique em **Commit changes**

---

### 4 — Publicar o site

1. Clique em **Settings** → **Pages** (menu lateral)
2. Em **Source**, selecione:
   - Branch: `main` | Pasta: `/ (root)`
3. Clique em **Save**
4. Aguarde ~2 minutos

Seu link ficará disponível no formato:
```
https://SEU-USERNAME.github.io/loja/
```
Compartilhe esse link com quem quiser!

---

## ⚙️ Configurar a sua loja (`config.json`)

Abra o arquivo `config.json` no GitHub (clique nele → ícone de lápis ✏️):

```json
{
  "nome":           "Brechó da Ana",
  "slogan":         "Itens seminovos com muito cuidado",
  "contato_nome":   "Ana Lima",
  "whatsapp":       "11999990000",
  "promo_1":        "🛒 3 itens = valor mínimo em todos",
  "promo_2":        "💵 À vista = valor mínimo",
  "cor_principal":  "#C0654A",
  "cor_secundaria": "#7A8C6E"
}
```

| Campo | O que faz |
|---|---|
| `nome` | Nome da loja (aparece no topo e na aba do navegador) |
| `slogan` | Frase abaixo do nome |
| `contato_nome` | Seu nome — aparece na mensagem do WhatsApp e na proposta |
| `whatsapp` | Número com DDD, só números. Ex: `11999990000` |
| `promo_1` / `promo_2` | Textos das tags de promoção no banner |
| `cor_principal` | Cor de destaque (botões, badges). Use código hex |
| `cor_secundaria` | Cor secundária (preço mínimo, promoção) |

Após editar, clique em **Commit changes** — o site atualiza em segundos.

> Para cores, pesquise "color picker" no Google e copie o código hexadecimal.

---

## 📦 Gerenciar itens (`items.csv`)

O `items.csv` é uma planilha simples. Você pode editá-lo de três formas:

**Opção A — direto no GitHub** (mais rápido para mudanças pequenas)
Clique no arquivo → ícone de lápis ✏️ → edite → Commit changes.

**Opção B — pelo Google Sheets** (melhor para adicionar muitos itens)
1. Abra [sheets.google.com](https://sheets.google.com) → **Arquivo → Importar**
2. Faça upload do `items.csv` e escolha "Substituir planilha"
3. Edite normalmente
4. **Arquivo → Fazer download → CSV**
5. Suba o arquivo baixado no GitHub (Add file → Upload files)

**Opção C — pelo Excel**
1. Abra o `items.csv` no Excel (duplo clique ou Arquivo → Abrir)
2. Edite normalmente
3. Salve como **CSV UTF-8** (importante: não salvar como .xlsx)
4. Suba no GitHub

---

### Estrutura das colunas

| Coluna | Obrigatório | Descrição |
|---|---|---|
| `id` | ✅ | Número único. Sempre incremente (1, 2, 3…) |
| `nome` | ✅ | Nome do item exibido no catálogo |
| `descricao` | — | Texto livre sobre estado, cor, material… |
| `preco` | ✅ | Valor pedido. Só números. Ex: `280` |
| `preco_minimo` | — | Mínimo aceito. Usado no carrinho e na promoção |
| `preco_novo` | — | Valor do item novo (calcula % de desconto) |
| `vendedor` | ✅ | Nome de quem está vendendo |
| `emoji` | — | Ícone exibido quando não há foto. Ex: `🪑` |
| `status` | ✅ | `disponivel`, `reservado` ou `vendido` |
| `caracteristicas` | — | Detalhes separados por `\|`. Ex: `Azul \| 80cm \| Com rodinhas` |
| `fotos` | — | URLs de fotos separadas por `\|` (máx. 3) |

### Exemplo de linha

```
6,Estante de Madeira,5 prateleiras desmontável pintada de branco.,320,260,720,Família Rocha,📚,disponivel,Madeira maciça | 180x80cm | Desmontável | Branca,
```

### Status possíveis

| Valor | O que aparece |
|---|---|
| `disponivel` | Card normal com botão de carrinho |
| `reservado` | Badge laranja "Reservado" |
| `vendido` | Card acinzentado com badge "Vendido" |

> ⚠️ **Atenção:** o status precisa ser escrito exatamente como acima — letras minúsculas, sem acento em `disponivel`. Um erro de digitação faz o item não aparecer nos filtros.

---

### Campos com vírgula no texto

Se a descrição de um item tiver vírgula (ex: `"Azul, verde e amarelo"`), coloque o campo inteiro entre aspas duplas:

```
7,Vaso Decorativo,"Azul, verde e amarelo. Cerâmica artesanal.",45,35,,João,🏺,disponivel,,
```

O Excel e o Google Sheets fazem isso automaticamente quando você exporta — não precisa se preocupar.

---

## 🖼️ Adicionar fotos

As fotos precisam de uma URL pública. A opção mais simples é o **Google Drive**.

### Hospedar foto no Google Drive

1. Acesse [drive.google.com](https://drive.google.com) e faça upload da foto
2. Clique com o botão direito → **Compartilhar** → **Qualquer pessoa com o link** → Copiar link

O link copiado será:
```
https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view?usp=sharing
```

Pegue o **ID** (entre `/d/` e `/view`) e monte assim:
```
https://drive.google.com/uc?export=view&id=1aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

No CSV, coloque na coluna `fotos`. Para até 3 fotos, separe com `|`:
```
https://...id=ID1 | https://...id=ID2 | https://...id=ID3
```

> 💡 Crie uma pasta no Drive chamada "Fotos Loja" para manter tudo organizado.

---

## 🛒 Como o carrinho funciona

O visitante:
1. Clica em **+ Carrinho** nos itens que gostar
2. Abre o carrinho (botão 🛒 no topo)
3. Com **3 ou mais itens**, o total muda automaticamente para o **valor mínimo** e mostra a economia
4. Clica em **💬 Entrar em contato** → abre o WhatsApp com mensagem pronta

> O botão de WhatsApp só aparece se `whatsapp` estiver preenchido no `config.json`.

---

## 📄 Gerar proposta em PDF

O botão **📄 Proposta** (canto superior direito) permite ao vendedor:
1. Digitar o nome do cliente
2. Selecionar os itens de interesse
3. Adicionar uma observação (ex: "Proposta válida por 7 dias")
4. Clicar em **Gerar PDF** — abre o diálogo de impressão do navegador

No celular, aparece a opção **"Salvar como PDF"** ou **"Compartilhar"**, que pode ser enviado direto pelo WhatsApp.

---

## 🧪 Testar localmente

Como o site lê arquivos externos (`config.json` e `items.csv`), **não funciona abrindo o `index.html` diretamente** — o navegador bloqueia por segurança. Precisa de um servidor local simples:

**Node.js:**
```bash
npx serve .
```

**Python:**
```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador. No GitHub Pages isso não é necessário — funciona direto.

---

## ❓ Dúvidas frequentes

**O site não abre.**  
Verifique se o GitHub Pages está ativo: Settings → Pages.

**Editei o CSV mas o site não atualizou.**  
Aguarde ~2 minutos e pressione **Ctrl+Shift+R** para forçar o recarregamento.

**As fotos não aparecem.**  
Confirme que o arquivo no Drive está compartilhado como público e que a URL está no formato `uc?export=view&id=...`.

**Salvei o CSV no Excel e os acentos quebraram.**  
Ao salvar no Excel, escolha **CSV UTF-8** (e não apenas CSV). Essa opção mantém acentos e emojis corretamente.

**Abri o `index.html` no computador e não carrega.**  
Use um servidor local (veja seção acima).

**Quero uma segunda loja.**  
Crie um novo repositório no GitHub com os mesmos 5 arquivos e edite `config.json` e `items.csv` com as informações do novo vendedor.
