import {
  placeBestTimeLabels,
  placeCategoryLabels,
  placePriorityLabels,
  type Place,
} from '../model/place'

export function getPlaceInformationSummary(place: Place) {
  const details: string[] = []

  if (place.imageUrl) details.push('Imagen añadida')
  if (place.category) details.push(placeCategoryLabels[place.category])
  if (place.priority) details.push(placePriorityLabels[place.priority])
  if (place.description) details.push('Descripción añadida')
  if (place.address) details.push('Dirección añadida')
  if (place.mapsUrl) details.push('Enlace de Maps')
  if (place.websiteUrl) details.push('Página web')
  if (place.openingHours) details.push('Horario añadido')
  if (place.price) details.push(`Precio: ${place.price}`)
  if (place.estimatedDuration) {
    details.push(`Duración: ${place.estimatedDuration}`)
  }
  if (place.bestTime) details.push(placeBestTimeLabels[place.bestTime])
  if (place.requiresReservation !== null) {
    details.push(
      place.requiresReservation ? 'Necesita reserva' : 'No necesita reserva',
    )
  }
  if (place.notes) details.push('Notas añadidas')

  return details
}
