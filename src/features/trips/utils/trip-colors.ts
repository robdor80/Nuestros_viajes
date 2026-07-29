import {
  tripColorPalette,
  type TripColor,
} from '../model/trip'

export function getStableTripColor(stableKey: string): TripColor {
  const hash = [...stableKey].reduce(
    (currentHash, character) =>
      (currentHash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  )

  return tripColorPalette[hash % tripColorPalette.length]
}

export function selectTripColor(
  usedColors: readonly TripColor[],
  stableKey: string,
): TripColor {
  const usedColorSet = new Set(usedColors)
  const availableColor = tripColorPalette.find(
    (color) => !usedColorSet.has(color),
  )

  return availableColor ?? getStableTripColor(stableKey)
}
