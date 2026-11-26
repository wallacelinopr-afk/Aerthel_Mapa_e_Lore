export type PoiKind = 'estalagem' | 'bordel' | 'zona-livre' | 'entreposto'

export interface MapPoi {
  id: string
  name: string
  kind: PoiKind
  x: number
  y: number
  regionId: string
  note: string
}

export const POI_STYLE: Record<PoiKind, { label: string; badge: string; color: string }> = {
  estalagem: { label: 'Estalagem', badge: 'Estalagem', color: '#f59e0b' },
  bordel: { label: 'Bordel', badge: 'Casa de Prazer', color: '#f43f5e' },
  'zona-livre': { label: 'Zona Livre', badge: 'Zona Livre', color: '#10b981' },
  entreposto: { label: 'Entreposto', badge: 'Entreposto', color: '#38bdf8' },
}

export const MAP_POIS: MapPoi[] = [
  // Estalagens (9)
  { id: 'poi-est-1', name: 'Taverna da Brasa Fria', kind: 'estalagem', x: 545, y: 175, regionId: 'basgard', note: 'Abrigo aquecido na Via Imperial para caravanas que descem de Basgard.' },
  { id: 'poi-est-2', name: 'Estalagem do Pinheiro Partido', kind: 'estalagem', x: 350, y: 315, regionId: 'lenha-funda', note: 'Ponto de encontro de batedores e mercadores entre Ruthless e Lenha-Funda.' },
  { id: 'poi-est-3', name: 'Pouso do Ferrador', kind: 'estalagem', x: 495, y: 320, regionId: 'ruthless', note: 'Troca de cavalos e cerveja escura na descida para Véu da Garganta.' },
  { id: 'poi-est-4', name: 'Albergue da Vigília', kind: 'estalagem', x: 525, y: 445, regionId: 'muralha-tripla', note: 'Última estalagem antes dos portões da 1ª Muralha (Freya).' },
  { id: 'poi-est-5', name: 'Estalagem da Folha Rubra', kind: 'estalagem', x: 385, y: 555, regionId: 'solar-outonal', note: 'Famosa pelo hidromel de maçã e boatos sobre os cofres da Casa Kühl.' },
  { id: 'poi-est-6', name: 'Estalagem da Ponte Real', kind: 'estalagem', x: 575, y: 660, regionId: 'vermer', note: 'Hospeda mercadores que aguardam liberação para entrar nos anéis de Vermer.' },
  { id: 'poi-est-7', name: 'Taverna da Maré Baixa', kind: 'estalagem', x: 245, y: 745, regionId: 'ilhas-da-serpente', note: 'Bar de porto onde tripulações de Skalmark negociam provisões.' },
  { id: 'poi-est-8', name: 'Estalagem do Grifo Cansado', kind: 'estalagem', x: 465, y: 815, regionId: 'fortaleza-do-grifo', note: 'Parada obrigatória antes de cruzar a fronteira árida rumo ao sul.' },
  { id: 'poi-est-9', name: 'Albergue das Dunas', kind: 'estalagem', x: 410, y: 895, regionId: 'oasis-de-ambar', note: 'Pátio com sombra, cisternas fundas e música noturna no deserto.' },

  // Bordéis & Casas de Prazer (6)
  { id: 'poi-bor-1', name: 'A Dama de Ferro', kind: 'bordel', x: 435, y: 518, regionId: 'muralha-tripla', note: 'Bordel fortificado ao sul de Skadi frequentado por soldados e mercenários da Muralha.' },
  { id: 'poi-bor-2', name: 'Salão da Seda Rubra', kind: 'bordel', x: 315, y: 615, regionId: 'solar-outonal', note: 'Casa discreta de luxo frequentada por banqueiros e enviados de Solar Outonal.' },
  { id: 'poi-bor-3', name: 'Casa do Véu Carmesim', kind: 'bordel', x: 632, y: 652, regionId: 'vermer', note: 'O bordel mais influente de Vermer; espiões da Coroa pagam alto por confissões.' },
  { id: 'poi-bor-4', name: 'Lanterna do Golfo', kind: 'bordel', x: 775, y: 695, regionId: 'cabo-da-cinza', note: 'Taberna e bordel portuário em Cabo da Cinza para marinheiros e oficiais.' },
  { id: 'poi-bor-5', name: 'Cais das Sereias', kind: 'bordel', x: 170, y: 830, regionId: 'ilhas-da-serpente', note: 'Casa ruidosa encravada nas palafitas de Skalmark.' },
  { id: 'poi-bor-6', name: 'Tendinha de Âmbar', kind: 'bordel', x: 515, y: 905, regionId: 'oasis-de-ambar', note: 'Tendas perfumadas com incenso e especiarias junto às fontes de Solayne.' },

  // Zonas Livres & Terras Neutras (6)
  { id: 'poi-zon-1', name: 'Passo Franco da Garganta', kind: 'zona-livre', x: 415, y: 355, regionId: 'veu-da-garganta', note: 'Cânion neutro usado por desertores, contrabandistas e mensageiros sob vista da Casa Corvin.' },
  { id: 'poi-zon-2', name: 'Zona Morta (Entre Frigg e Skadi)', kind: 'zona-livre', x: 310, y: 490, regionId: 'muralha-tripla', note: 'Faixa sem lei entre a 2ª e a 3ª muralha onde nenhum senhor exerce justiça direta.' },
  { id: 'poi-zon-3', name: 'Mercado Livre da Encruzilhada', kind: 'zona-livre', x: 475, y: 590, regionId: 'vermer', note: 'Feira franca isenta de impostos reais onde mercadores do Norte e Sul trocam bens.' },
  { id: 'poi-zon-4', name: 'Ruínas Francas de Morvain', kind: 'zona-livre', x: 705, y: 765, regionId: 'cabo-da-cinza', note: 'Território abandonado após a queda dos Morvain; hoje reduto de bandos livres.' },
  { id: 'poi-zon-5', name: 'Enseada dos Contrabandistas', kind: 'zona-livre', x: 265, y: 880, regionId: 'ilhas-da-serpente', note: 'Baía escondida fora do alcance das patrulhas da Coroa e de Skalmark.' },
  { id: 'poi-zon-6', name: 'Acampamento Franco do Deserto', kind: 'zona-livre', x: 605, y: 945, regionId: 'oasis-de-ambar', note: 'Oásis nômade sem suserano onde clãs livres negociam água e aço.' },

  // Entrepostos & Marcos de Rota (5)
  { id: 'poi-ent-1', name: 'Angra do Chumbo (Docas)', kind: 'entreposto', x: 155, y: 235, regionId: 'furna-negra', note: 'Fiorde fortificado da Casa Vardell que escoa o aço negro de Furna Negra para o mar ocidental.' },
  { id: 'poi-ent-2', name: 'Pedágio da Via Imperial', kind: 'entreposto', x: 515, y: 492, regionId: 'muralha-tripla', note: 'Guarita central da Casa Freddom que cobra passagem entre Norte e Sul.' },
  { id: 'poi-ent-3', name: 'Porto Cinza', kind: 'entreposto', x: 255, y: 615, regionId: 'solar-outonal', note: 'Entreposto fluvial e marítimo controlado pela Casa Vallen.' },
  { id: 'poi-ent-4', name: 'Forjas Livres de Saiget', kind: 'entreposto', x: 595, y: 618, regionId: 'vermer', note: 'Bairro metalúrgico nos arredores de Vermer.' },
  { id: 'poi-ent-5', name: 'Minas Fundas de Talren', kind: 'entreposto', x: 398, y: 742, regionId: 'fortaleza-do-grifo', note: 'Entroncamento de minério que abastece os arsenais do Centro-Sul.' },
]
