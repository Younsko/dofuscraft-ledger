/**
 * Utility to reliably resolve Dofus item icons using DofusDB high-resolution asset CDN
 * with graceful fallback, eliminating Ankama's placeholder red crosses (❌).
 */

export function getItemIconUrl(item?: {
  image_urls?: { icon?: string; sd?: string; hq?: string }
  ankama_id?: number
}): string {
  if (!item) {
    return 'https://api.dofusdb.fr/img/items/0.png'
  }

  const rawIcon = item.image_urls?.icon || item.image_urls?.sd || item.image_urls?.hq || ''

  if (rawIcon) {
    // If it's already a direct DofusDB URL, return it
    if (rawIcon.includes('dofusdb.fr')) {
      return rawIcon
    }

    // Extract the icon asset ID from Dofusdu URL (e.g. /item/35010-64.png -> 35010)
    const match = rawIcon.match(/item\/(\d+)(?:-\d+)?\.png/)
    if (match && match[1] && match[1] !== '0') {
      return `https://api.dofusdb.fr/img/items/${match[1]}.png`
    }
  }

  // Fallback to item's ankama_id on DofusDB
  if (item.ankama_id && item.ankama_id > 0) {
    return `https://api.dofusdb.fr/img/items/${item.ankama_id}.png`
  }

  return 'https://api.dofusdb.fr/img/items/0.png'
}

/**
 * Handle image error cleanly without showing ugly red cross
 */
export function handleItemImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  ankamaId?: number
) {
  const target = e.target as HTMLImageElement
  const currentSrc = target.src

  // If DofusDB failed, try Ankama / Dofusdu CDN
  if (currentSrc.includes('dofusdb.fr') && ankamaId) {
    target.src = `https://api.dofusdu.de/dofus3/v1/img/item/${ankamaId}-64.png`
    return
  }

  // Ultimate fallback: transparent 1x1 dot or neutral SVG icon
  target.style.opacity = '0.3'
}
