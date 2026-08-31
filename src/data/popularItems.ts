import { DofusItem } from '../types'

export const POPULAR_ITEMS: DofusItem[] = [
  {
    ankama_id: 2469,
    name: "Gelano",
    type: { id: 17, name: "Anneau" },
    level: 60,
    category: 'equipment',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/9047-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/9047-128.png"
    },
    description: "Cet anneau très recherché confère 1 PA naturel. Très prisé pour l'over FM et les runes exo !",
    recipe: [
      { item_ankama_id: 757, quantity: 50, item_subtype: "resources", item_name: "Gelée Bleuet", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/110042-64.png" },
      { item_ankama_id: 368, quantity: 50, item_subtype: "resources", item_name: "Gelée à la Fraise", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/110040-64.png" },
      { item_ankama_id: 369, quantity: 50, item_subtype: "resources", item_name: "Gelée à la Menthe", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/110041-64.png" },
      { item_ankama_id: 2436, quantity: 20, item_subtype: "resources", item_name: "Gelée Citron", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/110490-64.png" },
      { item_ankama_id: 2437, quantity: 2, item_subtype: "resources", item_name: "Gelée Citron Royale", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/110491-64.png" },
      { item_ankama_id: 2242, quantity: 2, item_subtype: "resources", item_name: "Gelée Fraise Royale", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/110409-64.png" },
      { item_ankama_id: 370, quantity: 2, item_subtype: "resources", item_name: "Gelée Bleuet Royale", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/110043-64.png" },
      { item_ankama_id: 2241, quantity: 2, item_subtype: "resources", item_name: "Gelée Menthe Royale", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/110408-64.png" }
    ]
  },
  {
    ankama_id: 8460,
    name: "Voile d'Encre",
    type: { id: 16, name: "Cape" },
    level: 200,
    category: 'equipment',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/8460-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/8460-128.png"
    },
    description: "Cape mythique du Kralamoure Géant, le summum de l'équipement de niveau 200.",
    recipe: [
      { item_ankama_id: 8443, quantity: 1, item_subtype: "resources", item_name: "Encre du Kralamoure", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/15017-64.png" },
      { item_ankama_id: 8444, quantity: 10, item_subtype: "resources", item_name: "Ventouse du Kralamoure", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/15018-64.png" },
      { item_ankama_id: 8445, quantity: 18, item_subtype: "resources", item_name: "Oeil de Circueur", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/15019-64.png" },
      { item_ankama_id: 8446, quantity: 25, item_subtype: "resources", item_name: "Étoffe de Roissingue", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/15020-64.png" },
      { item_ankama_id: 13320, quantity: 10, item_subtype: "resources", item_name: "Galet Brasillant", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/15190-64.png" },
      { item_ankama_id: 15300, quantity: 5, item_subtype: "resources", item_name: "Substrat de Futaie", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/15234-64.png" }
    ]
  },
  {
    ankama_id: 11187,
    name: "Alliance Gloursonne",
    type: { id: 17, name: "Anneau" },
    level: 197,
    category: 'equipment',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/9248-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/9248-128.png"
    },
    description: "Cet anneau très équilibré est un pilier des builds multi-éléments.",
    recipe: [
      { item_ankama_id: 11136, quantity: 12, item_subtype: "resources", item_name: "Poil de Barbe du Glourséleste", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/15148-64.png" },
      { item_ankama_id: 11137, quantity: 15, item_subtype: "resources", item_name: "Queue de Glourséleste", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/15149-64.png" },
      { item_ankama_id: 13320, quantity: 5, item_subtype: "resources", item_name: "Galet Brasillant", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/15190-64.png" },
      { item_ankama_id: 15300, quantity: 2, item_subtype: "resources", item_name: "Substrat de Futaie", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/15234-64.png" }
    ]
  },
  {
    ankama_id: 2411,
    name: "Coiffe du Bouftou",
    type: { id: 16, name: "Chapeau" },
    level: 20,
    category: 'equipment',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/16001-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/16001-128.png"
    },
    description: "La coiffe emblématique de tous les aventuriers en herbe.",
    recipe: [
      { item_ankama_id: 303, quantity: 100, item_subtype: "resources", item_name: "Laine de Bouftou", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/40001-64.png" },
      { item_ankama_id: 465, quantity: 100, item_subtype: "resources", item_name: "Corne de Bouftou", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/40002-64.png" }
    ]
  },
  {
    ankama_id: 16512,
    name: "Cape du Bouftou",
    type: { id: 16, name: "Cape" },
    level: 20,
    category: 'equipment',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/8001-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/8001-128.png"
    },
    description: "Une cape chaude confectionnée avec la laine de nos chers ovins cornus.",
    recipe: [
      { item_ankama_id: 303, quantity: 80, item_subtype: "resources", item_name: "Laine de Bouftou", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/40001-64.png" },
      { item_ankama_id: 465, quantity: 80, item_subtype: "resources", item_name: "Corne de Bouftou", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/40002-64.png" }
    ]
  },
  {
    ankama_id: 16406,
    name: "Potion Religieuse",
    type: { id: 96, name: "Potion" },
    level: 60,
    category: 'consumables',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/12759-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/12759-128.png"
    },
    recipe: [
      { item_ankama_id: 16381, quantity: 1, item_subtype: "resources", item_name: "Graine de Pavot", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/40010-64.png" },
      { item_ankama_id: 1731, quantity: 1, item_subtype: "resources", item_name: "Trèfle à 5 feuilles", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/40011-64.png" },
      { item_ankama_id: 533, quantity: 1, item_subtype: "resources", item_name: "Eau potable", item_icon: "https://api.dofusdu.de/dofus3/v1/img/item/40012-64.png" }
    ]
  }
]

export const POPULAR_RESOURCES: DofusItem[] = [
  {
    ankama_id: 757,
    name: "Gelée Bleuet",
    type: { id: 185, name: "Gelée" },
    level: 54,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/110042-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/110042-128.png"
    },
    description: "Cette gelée est particulièrement collante."
  },
  {
    ankama_id: 368,
    name: "Gelée à la Fraise",
    type: { id: 185, name: "Gelée" },
    level: 58,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/110040-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/110040-128.png"
    },
    description: "Une gelée au goût sucré de fraise mûre."
  },
  {
    ankama_id: 369,
    name: "Gelée à la Menthe",
    type: { id: 185, name: "Gelée" },
    level: 56,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/110041-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/110041-128.png"
    },
    description: "Une gelée très rafraîchissante."
  },
  {
    ankama_id: 2436,
    name: "Gelée Citron",
    type: { id: 185, name: "Gelée" },
    level: 60,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/110490-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/110490-128.png"
    },
    description: "Une gelée acide et piquante."
  },
  {
    ankama_id: 2437,
    name: "Gelée Citron Royale",
    type: { id: 185, name: "Gelée" },
    level: 60,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/110491-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/110491-128.png"
    },
    description: "Ressource rare issue du Gelikik."
  },
  {
    ankama_id: 2242,
    name: "Gelée Fraise Royale",
    type: { id: 185, name: "Gelée" },
    level: 60,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/110409-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/110409-128.png"
    },
    description: "Ressource noble et sucrée."
  },
  {
    ankama_id: 370,
    name: "Gelée Bleuet Royale",
    type: { id: 185, name: "Gelée" },
    level: 60,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/110043-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/110043-128.png"
    },
    description: "Ressource noble de Bleuet."
  },
  {
    ankama_id: 2241,
    name: "Gelée Menthe Royale",
    type: { id: 185, name: "Gelée" },
    level: 60,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/110408-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/110408-128.png"
    },
    description: "Ressource noble de menthe."
  },
  {
    ankama_id: 303,
    name: "Laine de Bouftou",
    type: { id: 50, name: "Laine" },
    level: 1,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/40001-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/40001-128.png"
    },
    description: "Une laine douce et soyeuse parfaite pour le tricot."
  },
  {
    ankama_id: 465,
    name: "Corne de Bouftou",
    type: { id: 51, name: "Corne" },
    level: 1,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/40002-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/40002-128.png"
    },
    description: "Une corne solide souvent utilisée pour fabriquer des armes et armures."
  },
  {
    ankama_id: 13320,
    name: "Galet Brasillant",
    type: { id: 91, name: "Pierre brute" },
    level: 150,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/15190-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/15190-128.png"
    },
    description: "Galet d'alignement très recherché pour les crafts THL."
  },
  {
    ankama_id: 8443,
    name: "Encre du Kralamoure",
    type: { id: 70, name: "Ressource diverse" },
    level: 200,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/15017-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/15017-128.png"
    },
    description: "L'encre noire et visqueuse du terrible Kralamoure Géant."
  },
  {
    ankama_id: 8444,
    name: "Ventouse du Kralamoure",
    type: { id: 70, name: "Ressource diverse" },
    level: 200,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/15018-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/15018-128.png"
    },
    description: "Une puissante ventouse prélevée sur les tentacules du monstre marin."
  },
  {
    ankama_id: 8446,
    name: "Étoffe de Roissingue",
    type: { id: 53, name: "Étoffe" },
    level: 150,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/15020-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/15020-128.png"
    },
    description: "Étoffe fétide et royale."
  },
  {
    ankama_id: 15300,
    name: "Substrat de Futaie",
    type: { id: 110, name: "Bois précieux" },
    level: 180,
    category: 'resources',
    image_urls: {
      icon: "https://api.dofusdu.de/dofus3/v1/img/item/15234-64.png",
      sd: "https://api.dofusdu.de/dofus3/v1/img/item/15234-128.png"
    },
    description: "Substrat rare travaillé par les bûcherons et alchimistes."
  }
]
