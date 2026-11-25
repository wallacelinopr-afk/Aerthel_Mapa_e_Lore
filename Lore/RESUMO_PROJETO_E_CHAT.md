# Resumo Consolidado do Projeto & Sessão de Desenvolvimento — Aerthel (Mapa & Lore)

Este documento resume toda a análise, correções técnicas, expansão geopolítica e definição de cânon realizadas sobre a pasta **`Aerthel_Mapa_e_Lore`**.

---

## 1. Diagnóstico Inicial do Projeto
O projeto **Aerthel** (*"a terra que respira"*) divide-se em duas frentes integradas:
1. **`Lore/` (Cânon Histórico de ~613 anos — do Ano -23 ao Ano 590 / 300 de Aerthel):**
   - **Bloco 1 — A Era Antiga (`BLOCO_1_A_ERA_ANTIGA.md`):** A dualidade entre *Borea* (Norte, Rei Eadric Freddom) e *Meridion* (Sul, Rei Kaelen Skar); o *Incidente do Tratado de Ferro (-23)*; o *Massacre de Cinzas Negras (Ano 0, 800 nortenhos queimados com piche)*; a morte de Eadric com uma flecha na narina na *Batalha do Lago Prateado (Ano 0)*; os 90 anos e 60.000 mortos na construção das **Muralhas Triplas (Skadi, Frigg e Freya)** sob *Theron, o Louco* (e seus cães *Penitentes*), *Aldric* e *Elys I*; a *Peste de 130* e o *Golpe na Lama Vermelha (145)* por *Kaldor Grenfall*; a *Grande Fome Negra (145–280)* e a unificação de 17 clãs do Sul por *Julian Grenfall* até a marcha ao Penhasco de Vidro (290).
   - **Bloco 2 — O Grande Pacto (`BLOCO_2_O_GRANDE_PACTO.md`):** A entrega da coroa nortenha por *Elys Freddom II* a Julian Grenfall (tornando os Freddom Guardiões neutros das Muralhas); a fundação de **Aerthel** e **Vermer**; a *Grande Assembleia de Vermer (291)* e a *Partilha do Terceiro Dia*; a *Teia de Ferro* (acordos com *Haldor Kazimir*, *Cassian e Hakon Skalmark*, *Malen Skar*, *Aldous Kühl* e *Vinda Solayne*); e a **Tragédia do Canil (291–292)** — o casamento político e morte de *Lyra Kazimir (15 anos)* nos canis de *Markalo Thornwall*, a execução de Markalo e seus filhos por Haldor Kazimir (junto a Freddom, Kargard e Prerwall), a purga dos Thornwall no Sul e o banimento dos cães de Ruthless.
   - **Bloco 3 — Os Três Séculos (`BLOCO_3_OS_TRES_SECULOS.md`):** Os 300 anos até o presente (Ano 590 / 300 de Aerthel) em 4 marcos: o casamento *Toren Grenfall & Soraia Solayne (299)* e a reabertura dos canis por *Torren Kazimir*; a *Guerra das Águas Salgadas (388–394)* entre Skar e Skalmark e a ascensão do **Banco Kühl** no *Acordo dos Dois Mares (394)*; o *Inverno Longo (472–481)* (bloqueio das Muralhas pelos Freddom e canais térmicos de Cortry e Draemont) e a *Crise das Cisternas (504)* (monopólio hídrico Khai–Solayne); e o limiar do presente com a renovação de casamentos dinásticos e o **Acordo Secreto na Névoa (584–589)** entre *Vaelar Kazimir* e *Oryon Skalmark*.
2. **`Mapa_Aerthel/` (Atlas Geopolítico Interativo em React + TypeScript + Three.js + Tailwind v4):**
   - Mapa continental de **6.000 km Norte–Sul** com 14 macrorregiões/assentamentos, 34 rotas (estrada, trilha, rio e mar) com cálculo de menor caminho via algoritmo de **Dijkstra**, 26 Pontos de Interesse (9 Estalagens, 6 Bordéis, 6 Zonas Livres e 5 Entrepostos) e 3 modos de visualização (*Satélite 3D*, *Mapa Cartográfico* e *Atlas Regional Isolado*).

---

## 2. Correções Técnicas Aplicadas no Código e no Lore
1. **Padronização Canônica de IDs:** Todos os IDs internos de casas e regiões que ainda usavam nomes de rascunhos antigos em `houses.json`, `regions.json`, `pois.ts`, `MapModuleView.tsx`, `AerthelEarthMap.tsx`, `CartographicMap.tsx` e `IsolatedRegionMapModal.tsx` foram convertidos para os nomes oficiais do Lore (`vultur`, `cortry`, `kargard`, `skar`, `skalmark`, `morvain`, `osken`, `mafteac`, `zhouti`, `vardell`, `thornwall`, `corvin`, `hausen`, `saiget`, `escarpas-de-vultur`, `basgard`, `mata-velha`, `solar-outonal`, `cabo-da-cinza`).
2. **Suporte de Rota `'trilha'`:** Adicionado o modo `'trilha'` (40 km/dia) em `map.ts` e `routeGraph.ts` para cálculo preciso das rotas de montanha do Norte.
3. **Limpeza de Termos Residuais:** Traduzidos e alinhados termos em inglês (`Sea of Frost` → `Mar de Gelo`, `The King's Road` → `Via Imperial`, `House` → `Hausen` no Bloco 3).

---

## 3. Expansão Geopolítica Assimétrica (De 39 para 61 Casas)
Para equilibrar a densidade histórica do Sul (que tinha o dobro da população do Norte e os 17 clãs unificados por Julian) com as 14 vassalas do Norte, sem usar números pareados artificiais, o cenário foi expandido para **61 Casas** (**1 Coroa + 6 Soberanas + 26 Maiores Vassalas + 27 Menores Vassalas + 1 Estrangeira**):

- **Norte (`Casa Kazimir` — 14 vassalas: 7 Maiores + 7 Menores/Sub-vassalas):** *Freddom, Kargard, Prerwall, Vultur, Cortry, Glaedwyn, Draemont* + *Hausen, Coolys, Hylton, Vane, Vardell, Thornwall, Corvin*.
- **A Coroa (`Casa Grenfall de Vermer` — 10 vassalas diretas: 4 Maiores + 6 Menores):**
  - *Maiores:* **Avernus** *(Cratera de Cinzas Negras / Fosso do Averno — a 61ª Casa, onde nenhuma ave voa, sob o lema "Fácil é a Descida")*, **Vaelmont** *(juízes e editos)*, **Crayne** *(pontes e aquedutos)* e **Halcyon** *(médicos da Peste de 130)*.
  - *Menores:* **Saiget** *(forjas)*, **Marlow** *(portões octogonais)*, **Oster** *(docas e celeiros)*, **Belvar** *(espionagem palaciana)*, **Serrett** *(cavalaria da Lama Vermelha)* e **Voss** *(caravanas da Via Imperial)*.
- **Terras Outonais (`Casa Kühl` — 7 vassalas: 3 Maiores + 4 Menores/Sub-vassalas):** *Vallen, Merrick, Goldwyn* + *Dornel, Brekker, Stroud (sub-vassala de Vallen), Lindel (sub-vassala de Merrick)*.
- **Golfo Oriental (`Casa Skar` — 7 vassalas: 4 Maiores + 3 Menores/Sub-vassalas):** *Morvain (extinta), Rook, Draven, Cael* + *Velkor, Solen (sub-vassala de Rook), Marrow*.
- **Centro-Sul (`Casa Grenfall do Grifo` — 6 vassalas: 4 Maiores + 2 Menores/Sub-vassalas):** *Talren, Corvell, Alder, Hart (sem terra)* + *Fenwick, Brask (sub-vassala de Talren)*.
- **Deserto Sulino (`Casa Solayne` — 5 vassalas: 2 Maiores + 3 Menores):** *Khai, Vashar* + *Osken, Mafteac, Zahhir*.
- **Ilhas da Serpente (`Casa Skalmark` — 4 vassalas: 2 Maiores + 2 Menores):** *Varn, Drek* + *Kestrel, Silt*.
- **Além-Mar (`Casa Zhouti` — 1 Casa Estrangeira):** Império Oriental / Rota de Jade.

---

## 4. Diretrizes Consolidadas do Bloco do Norte (Leva 1 — 15 Casas)
Na produção das fichas profundas do Norte (`FICHAS_BLOCO_NORTE.md` / `.docx`), foram estabelecidos os seguintes pilares canônicos:
1. **Ascensão de Kazimir na Crise:** Era uma casa menor de entreposto durante a dinastia Freddom; cresceu na Grande Fome Negra após testemunhar pais se sacrificando e mães matando os próprios filhos e a si mesmas para fugir da morte lenta por fome. Usou sua posição no centro das rotas para mediar trocas e salvar o Norte do colapso.
2. **Freddom vs. Kargard:** Ambas de disciplina extrema, mas **Freddom** é focada em **Caça, Rastreamento e Vigília** nas Muralhas e na Zona Morta, enquanto **Kargard** é focada em **Guerra Total, Formação Fechada e Choque Frontal**.
3. **Prerwall como Quarto Pilar:** Casa irmã dos Kazimir em perfil administrativo e estratégico; detém poder ligeiramente menor que Ruthless, mas senta-se em peso político e militar equivalente a **Kazimir, Freddom e Kargard** (o Quadrilátero do Norte).
4. **Vultur:** Mesma ferocidade marcial de Kargard, porém extremamente fechada nos picos da cordilheira e fanática por **eugenia e pureza de linhagem**.
5. **Coolys:** Casa menor mercantil do Bairro do Lacre, **ambiciosa e agressiva nos negócios**, mas de **lealdade absoluta e histórica aos Kazimir**.
6. **Hausen como Grande Armada de Guerra do Norte:** Comanda as **Grandes Frotas Navais de Guerra Quebra-Gelo** a partir do Arsenal de Basgard (em aliança direta com Kargard e Kazimir), operando dracares couraçados de aço negro e escoltando o *Acordo Secreto na Névoa*.
