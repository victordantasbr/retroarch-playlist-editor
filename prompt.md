# Plano de Execução: Clone do RetroArch Playlist Editor com Match Fuzzy de Thumbnails

## 📋 Visão Geral

Desenvolver uma aplicação web 100% *client-side* (HTML/CSS/JS) baseada no [RetroArch Playlist Editor do Marc Robledo](https://www.marcrobledo.com/retroarch-playlist-editor/). A ferramenta permite carregar arquivos de playlist do RetroArch (`.lpl`), selecionar um sistema/núcleo e renomear os campos `label` dos jogos usando busca *fuzzy* com base na base oficial da Libretro. Isso garante o match exato de nomes para que as capas/thumbnails sejam exibidas corretamente no RetroArch.

---

## 🏗️ Arquitetura e Fluxo de Dados

```
[ Upload .lpl ] ──> [ Seleção de Sistema Libretro ] ──> [ Fetch .dat via CDN (jsDelivr) ]
                                                                   │
[ Baixar .lpl Atualizado ] <── [ Painel de Revisão ] <── [ Algoritmo Fuzzy Match ]

```

---

## 🛠️ Especificações Técnicas

* **Stack:** HTML5, CSS3, JavaScript ES6+ (Sem frameworks pesados para manter o projeto leve e compatível com a ferramenta original).
* **Dependências via CDN:**
* `string-similarity` (ou `fuse.js`): Algoritmo de correspondência fuzzy.
* `jsDelivr CDN`: Acesso direto sem CORS aos repositórios da Libretro no GitHub (`libretro/libretro-database`).


* **Formato de Entrada/Saída:** JSON RetroArch Playlist (`.lpl` versão 1.5+).

---

## 🚀 Fases do Plano de Execução

### Fase 1: Interface Básica e Parser de Playlist (`.lpl`)

1. **Estrutura HTML/CSS:**
* Criar layout responsivo similar ao editor do Marc Robledo.
* Áreas para upload de arquivo `.lpl` e seletor dropdown do sistema.
* Tabela de exibição dos jogos da playlist.


2. **Parser JSON de Entrada:**
* Ler e validar o arquivo `.lpl` via `FileReader` API.
* Armazenar a estrutura original do JSON na memória para preservar campos como `path`, `core_path`, `core_name`, `crc32`, e `db_name`.



### Fase 2: Integração com Libretro Database (Anti-CORS)

1. **Mapeamento de Sistemas:**
* Criar um dicionário/lista pré-definida dos principais sistemas Libretro (ex: `Nintendo - Super Nintendo Entertainment System`, `Sega - Mega Drive - Genesis`, etc.).


2. **Fetch do Arquivo `.dat` via CDN:**
* Utilizar a CDN jsDelivr para carregar os arquivos de database sem problema de CORS:
`[https://cdn.jsdelivr.net/gh/libretro/libretro-database@master/dat/$](https://cdn.jsdelivr.net/gh/libretro/libretro-database@master/dat/$){encodeURIComponent(systemName)}.dat`


3. **Parser do Arquivo `.dat` (ClrMamePro):**
* Criar função Regex/Parser para extrair o campo `name` dentro de cada bloco `game ( ... )` do arquivo `.dat` e retornar uma lista simples de strings contendo os nomes oficiais.



### Fase 3: Algoritmo de Sanitização e Busca Fuzzy

1. **Sanitização Pré-Match:**
* Função para tratar a string do `label` original antes do cálculo de similaridade (remover extensões `.sfc`, `.zip`, e tags como `(USA)`, `(En,Ja)`, `[!][v1.1]`).


2. **Execução da Matching Engine:**
* Usar `stringSimilarity.findBestMatch(labelSanitizado, listaOficialNames)`.
* Definir um *threshold* ajustável (padrão: `0.65` / 65% de similaridade).
* Atualizar o campo `label` do item na playlist com a melhor correspondência encontrada.



### Fase 4: UI de Revisão e Confirmação

1. **Feedback Visual:**
* Exibir lista de resultados categorizada por cores na tabela:
* 🟢 **Verde:** Match com alta confiança (> 80%).
* 🟡 **Amarelo:** Match com média confiança (50% - 79%) / Requer atenção.
* 🔴 **Vermelho:** Sem match acima do limite (mantém o nome original).




2. **Edição Manual & Controles:**
* Adicionar um slider para o usuário ajustar a sensibilidade do *Threshold* em tempo real.
* Permitir que o usuário sobrescreva manualmente a sugestão de nome antes de exportar.



### Fase 5: Exportação e Download

1. **Geração do Arquivo Limpo:**
* Reconstruir a estrutura do JSON `.lpl` original atualizada com os novos `label`.


2. **Download Client-Side:**
* Criar um `Blob` com o tipo `application/json` e disparar o download automático do arquivo `.lpl` corrigido.



---

## 📂 Código de Referência para Início Rápido

### Boilerplate de Parser do DAT e Fetch da CDN

```javascript
// Fetch e Parse do DAT da Libretro sem CORS
async function getLibretroGameNames(systemName) {
  const cdnUrl = `https://cdn.jsdelivr.net/gh/libretro/libretro-database@master/dat/${encodeURIComponent(systemName)}.dat`;
  
  const response = await fetch(cdnUrl);
  if (!response.ok) throw new Error("Não foi possível carregar a database do sistema.");
  
  const datText = await response.text();
  
  // Extrai o conteúdo do campo 'name "Exemplo de Jogo"' de cada entrada 'game (...)'
  const gameNameRegex = /game\s*\([\s\S]*?name\s*"([^"]+)"/g;
  const officialNames = [];
  let match;
  
  while ((match = gameNameRegex.exec(datText)) !== null) {
    officialNames.push(match[1]);
  }
  
  return officialNames;
}

```

---

## 🎯 Entregáveis Esperados do Agente

1. Arquivo `index.html` com os estilos CSS embutidos.
2. Arquivo `app.js` contendo:
* Leitura do `.lpl`.
* Conexão com CDN/DAT.
* Parser DAT/ClrMamePro.
* Lógica Fuzzy com tratamento de strings.
* Exportação do arquivo corrigido.