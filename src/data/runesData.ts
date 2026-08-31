import { DofusItem } from '../types'

export interface DofusRuneInfo {
  ankama_id: number
  name: string
  category: 'transcendance' | 'corruption' | 'standard' | 'special'
  stat: string
  weight: number // Poids de la rune en FM
  icon: string
  level: number
  description: string
}

export const DOFUS_RUNES: DofusRuneInfo[] = [
  // Runes Spéciales & Transcendance
  {
    ankama_id: 28001,
    name: "Rune Trans Do So (Dommages Sorts)",
    category: "transcendance",
    stat: "1% Dommages aux sorts",
    weight: 15,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance augmentant les dommages aux sorts de 1%. Bloque toute forgemagie ultérieure."
  },
  {
    ankama_id: 28002,
    name: "Rune Trans Do Dis (Dommages Distance)",
    category: "transcendance",
    stat: "1% Dommages distance",
    weight: 15,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance augmentant les dommages à distance de 1%. Bloque toute forgemagie ultérieure."
  },
  {
    ankama_id: 28003,
    name: "Rune Trans Do Mel (Dommages Mêlée)",
    category: "transcendance",
    stat: "1% Dommages mêlée",
    weight: 15,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance augmentant les dommages en mêlée de 1%. Bloque toute forgemagie ultérieure."
  },
  {
    ankama_id: 28004,
    name: "Rune Trans Do Armes",
    category: "transcendance",
    stat: "1% Dommages aux armes",
    weight: 15,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance augmentant les dommages d'armes de 1%."
  },
  {
    ankama_id: 28005,
    name: "Rune Trans Vi (+70 Vitalité)",
    category: "transcendance",
    stat: "70 Vitalité",
    weight: 14,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 70 de Vitalité."
  },
  {
    ankama_id: 28006,
    name: "Rune Trans Fo (+20 Force)",
    category: "transcendance",
    stat: "20 Force",
    weight: 20,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 20 de Force."
  },
  {
    ankama_id: 28007,
    name: "Rune Trans Ine (+20 Intelligence)",
    category: "transcendance",
    stat: "20 Intelligence",
    weight: 20,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 20 d'Intelligence."
  },
  {
    ankama_id: 28008,
    name: "Rune Trans Cha (+20 Chance)",
    category: "transcendance",
    stat: "20 Chance",
    weight: 20,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 20 de Chance."
  },
  {
    ankama_id: 28009,
    name: "Rune Trans Agi (+20 Agilité)",
    category: "transcendance",
    stat: "20 Agilité",
    weight: 20,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 20 d'Agilité."
  },
  {
    ankama_id: 28010,
    name: "Rune Trans Fuite (+4 Fuite)",
    category: "transcendance",
    stat: "4 Fuite",
    weight: 16,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 4 de Fuite."
  },
  {
    ankama_id: 28011,
    name: "Rune Trans Tacle (+4 Tacle)",
    category: "transcendance",
    stat: "4 Tacle",
    weight: 16,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 4 de Tacle."
  },
  {
    ankama_id: 28012,
    name: "Rune Trans Ré Crit (+6 Ré Crit)",
    category: "transcendance",
    stat: "6 Résistance Critiques",
    weight: 12,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 6 Résistances Critiques."
  },
  {
    ankama_id: 28013,
    name: "Rune Trans Ré Pou (+12 Ré Pou)",
    category: "transcendance",
    stat: "12 Résistance Poussée",
    weight: 24,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 12 Résistances Poussée."
  },
  {
    ankama_id: 28014,
    name: "Rune Trans Ret PM (+3 Ret PM)",
    category: "transcendance",
    stat: "3 Retrait PM",
    weight: 21,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 3 Retrait PM."
  },
  {
    ankama_id: 28015,
    name: "Rune Trans Ret PA (+3 Ret PA)",
    category: "transcendance",
    stat: "3 Retrait PA",
    weight: 21,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18063-64.png",
    level: 200,
    description: "Rune de Transcendance conférant 3 Retrait PA."
  },
  // Corruption Runes
  {
    ankama_id: 28101,
    name: "Rune Corrup Vi (+90 Vitalité)",
    category: "corruption",
    stat: "90 Vitalité, -stats",
    weight: 18,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18064-64.png",
    level: 200,
    description: "Rune de Corruption conférant un gros bonus en Vitalité au détriment d'autres caractéristiques."
  },
  {
    ankama_id: 28102,
    name: "Rune Corrup Fo (+25 Force)",
    category: "corruption",
    stat: "25 Force, -stats",
    weight: 25,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18064-64.png",
    level: 200,
    description: "Rune de Corruption conférant 25 Force."
  },
  {
    ankama_id: 28103,
    name: "Rune Corrup Ine (+25 Intelligence)",
    category: "corruption",
    stat: "25 Intelligence, -stats",
    weight: 25,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18064-64.png",
    level: 200,
    description: "Rune de Corruption conférant 25 Intelligence."
  },
  {
    ankama_id: 28104,
    name: "Rune Corrup Cha (+25 Chance)",
    category: "corruption",
    stat: "25 Chance, -stats",
    weight: 25,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18064-64.png",
    level: 200,
    description: "Rune de Corruption conférant 25 Chance."
  },
  {
    ankama_id: 28105,
    name: "Rune Corrup Agi (+25 Agilité)",
    category: "corruption",
    stat: "25 Agilité, -stats",
    weight: 25,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18064-64.png",
    level: 200,
    description: "Rune de Corruption conférant 25 Agilité."
  },
  // Runes Majeures & Classiques
  {
    ankama_id: 1557,
    name: "Rune Ga Pâ",
    category: "special",
    stat: "1 PA",
    weight: 100,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18001-64.png",
    level: 100,
    description: "Rune de Forgemagie permettant d'augmenter le PA d'un équipement. Poids: 100."
  },
  {
    ankama_id: 1558,
    name: "Rune Ga Pme",
    category: "special",
    stat: "1 PM",
    weight: 90,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18002-64.png",
    level: 100,
    description: "Rune de Forgemagie permettant d'augmenter le PM d'un équipement. Poids: 90."
  },
  {
    ankama_id: 7438,
    name: "Rune Po",
    category: "special",
    stat: "1 Portée",
    weight: 51,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18003-64.png",
    level: 60,
    description: "Rune de Forgemagie permettant d'augmenter la Portée d'un équipement. Poids: 51."
  },
  {
    ankama_id: 7442,
    name: "Rune Invo",
    category: "special",
    stat: "1 Invocation",
    weight: 30,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18004-64.png",
    level: 60,
    description: "Rune de Forgemagie pour Invocations. Poids: 30."
  },
  {
    ankama_id: 7451,
    name: "Rune Cri",
    category: "standard",
    stat: "1% Critique",
    weight: 10,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18005-64.png",
    level: 40,
    description: "Rune de Coup Critique. Poids: 10."
  },
  {
    ankama_id: 7443,
    name: "Rune Ra Vi",
    category: "standard",
    stat: "30 Vitalité",
    weight: 6,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18012-64.png",
    level: 100,
    description: "Rune de Vitalité supérieure (+30). Poids: 6."
  },
  {
    ankama_id: 7444,
    name: "Rune Pa Vi",
    category: "standard",
    stat: "10 Vitalité",
    weight: 2,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18011-64.png",
    level: 50,
    description: "Rune de Vitalité intermédiaire (+10). Poids: 2."
  },
  {
    ankama_id: 7445,
    name: "Rune Vi",
    category: "standard",
    stat: "3 Vitalité",
    weight: 0.6,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18010-64.png",
    level: 1,
    description: "Rune de Vitalité basique (+3). Poids: 0.2/u."
  },
  {
    ankama_id: 7446,
    name: "Rune Ra Fo",
    category: "standard",
    stat: "10 Force",
    weight: 10,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18015-64.png",
    level: 100,
    description: "Rune de Force supérieure (+10). Poids: 10."
  },
  {
    ankama_id: 7447,
    name: "Rune Pa Fo",
    category: "standard",
    stat: "3 Force",
    weight: 3,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18014-64.png",
    level: 50,
    description: "Rune de Force intermédiaire (+3). Poids: 3."
  },
  {
    ankama_id: 7448,
    name: "Rune Fo",
    category: "standard",
    stat: "1 Force",
    weight: 1,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18013-64.png",
    level: 1,
    description: "Rune de Force de base (+1). Poids: 1."
  },
  {
    ankama_id: 7449,
    name: "Rune Ra Ine",
    category: "standard",
    stat: "10 Intelligence",
    weight: 10,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18018-64.png",
    level: 100,
    description: "Rune d'Intelligence supérieure (+10). Poids: 10."
  },
  {
    ankama_id: 7450,
    name: "Rune Pa Ine",
    category: "standard",
    stat: "3 Intelligence",
    weight: 3,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18017-64.png",
    level: 50,
    description: "Rune d'Intelligence intermédiaire (+3). Poids: 3."
  },
  {
    ankama_id: 7452,
    name: "Rune Ine",
    category: "standard",
    stat: "1 Intelligence",
    weight: 1,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18016-64.png",
    level: 1,
    description: "Rune d'Intelligence de base (+1). Poids: 1."
  },
  {
    ankama_id: 7453,
    name: "Rune Ra Cha",
    category: "standard",
    stat: "10 Chance",
    weight: 10,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18021-64.png",
    level: 100,
    description: "Rune de Chance supérieure (+10). Poids: 10."
  },
  {
    ankama_id: 7454,
    name: "Rune Pa Cha",
    category: "standard",
    stat: "3 Chance",
    weight: 3,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18020-64.png",
    level: 50,
    description: "Rune de Chance intermédiaire (+3). Poids: 3."
  },
  {
    ankama_id: 7455,
    name: "Rune Cha",
    category: "standard",
    stat: "1 Chance",
    weight: 1,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18019-64.png",
    level: 1,
    description: "Rune de Chance de base (+1). Poids: 1."
  },
  {
    ankama_id: 7456,
    name: "Rune Ra Agi",
    category: "standard",
    stat: "10 Agilité",
    weight: 10,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18024-64.png",
    level: 100,
    description: "Rune d'Agilité supérieure (+10). Poids: 10."
  },
  {
    ankama_id: 7457,
    name: "Rune Pa Agi",
    category: "standard",
    stat: "3 Agilité",
    weight: 3,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18023-64.png",
    level: 50,
    description: "Rune d'Agilité intermédiaire (+3). Poids: 3."
  },
  {
    ankama_id: 7458,
    name: "Rune Agi",
    category: "standard",
    stat: "1 Agilité",
    weight: 1,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18022-64.png",
    level: 1,
    description: "Rune d'Agilité de base (+1). Poids: 1."
  },
  {
    ankama_id: 7459,
    name: "Rune Ra Sa",
    category: "standard",
    stat: "10 Sagesse",
    weight: 30,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18027-64.png",
    level: 100,
    description: "Rune de Sagesse supérieure (+10). Poids: 30."
  },
  {
    ankama_id: 7460,
    name: "Rune Pa Sa",
    category: "standard",
    stat: "3 Sagesse",
    weight: 9,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18026-64.png",
    level: 50,
    description: "Rune de Sagesse intermédiaire (+3). Poids: 9."
  },
  {
    ankama_id: 7461,
    name: "Rune Sa",
    category: "standard",
    stat: "1 Sagesse",
    weight: 3,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18025-64.png",
    level: 1,
    description: "Rune de Sagesse de base (+1). Poids: 3."
  },
  {
    ankama_id: 7462,
    name: "Rune Do Feu",
    category: "standard",
    stat: "1 Dommage Feu",
    weight: 5,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18028-64.png",
    level: 40,
    description: "Rune de Dommage Feu fixe (+1). Poids: 5."
  },
  {
    ankama_id: 7463,
    name: "Rune Do Eau",
    category: "standard",
    stat: "1 Dommage Eau",
    weight: 5,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18029-64.png",
    level: 40,
    description: "Rune de Dommage Eau fixe (+1). Poids: 5."
  },
  {
    ankama_id: 7464,
    name: "Rune Do Terre",
    category: "standard",
    stat: "1 Dommage Terre",
    weight: 5,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18030-64.png",
    level: 40,
    description: "Rune de Dommage Terre fixe (+1). Poids: 5."
  },
  {
    ankama_id: 7465,
    name: "Rune Do Air",
    category: "standard",
    stat: "1 Dommage Air",
    weight: 5,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18031-64.png",
    level: 40,
    description: "Rune de Dommage Air fixe (+1). Poids: 5."
  },
  {
    ankama_id: 7466,
    name: "Rune Do Neutre",
    category: "standard",
    stat: "1 Dommage Neutre",
    weight: 5,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18032-64.png",
    level: 40,
    description: "Rune de Dommage Neutre fixe (+1). Poids: 5."
  },
  {
    ankama_id: 11110,
    name: "Rune Ré Neutre",
    category: "standard",
    stat: "1% Résistance Neutre",
    weight: 4,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18040-64.png",
    level: 50,
    description: "Rune de Résistance % Neutre. Poids: 4."
  },
  {
    ankama_id: 11111,
    name: "Rune Ré Terre",
    category: "standard",
    stat: "1% Résistance Terre",
    weight: 4,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18041-64.png",
    level: 50,
    description: "Rune de Résistance % Terre. Poids: 4."
  },
  {
    ankama_id: 11112,
    name: "Rune Ré Feu",
    category: "standard",
    stat: "1% Résistance Feu",
    weight: 4,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18042-64.png",
    level: 50,
    description: "Rune de Résistance % Feu. Poids: 4."
  },
  {
    ankama_id: 11113,
    name: "Rune Ré Eau",
    category: "standard",
    stat: "1% Résistance Eau",
    weight: 4,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18043-64.png",
    level: 50,
    description: "Rune de Résistance % Eau. Poids: 4."
  },
  {
    ankama_id: 11114,
    name: "Rune Ré Air",
    category: "standard",
    stat: "1% Résistance Air",
    weight: 4,
    icon: "https://api.dofusdu.de/dofus3/v1/img/item/18044-64.png",
    level: 50,
    description: "Rune de Résistance % Air. Poids: 4."
  }
]

export function runeToDofusItem(rune: DofusRuneInfo): DofusItem {
  return {
    ankama_id: rune.ankama_id,
    name: rune.name,
    type: {
      id: 78,
      name: "Rune de forgemagie"
    },
    level: rune.level,
    image_urls: {
      icon: rune.icon,
      sd: rune.icon
    },
    category: 'runes',
    description: `${rune.description} (Stat: ${rune.stat}, Poids FM: ${rune.weight})`
  }
}
