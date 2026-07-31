export const tripWorkspaceSections = [
  {
    id: 'places',
    slug: 'que-ver',
    navigationLabel: 'Qué se verá',
    title: 'Qué se verá',
    description:
      'Lugares, monumentos y actividades que queremos conocer.',
    icon: 'place',
  },
  {
    id: 'planning',
    slug: 'planning',
    navigationLabel: 'Planning',
    title: 'Planning diario',
    description:
      'Organización de visitas y actividades para cada día.',
    icon: 'calendar',
  },
  {
    id: 'accommodation',
    slug: 'alojamiento',
    navigationLabel: 'Alojamiento',
    title: 'Alojamiento',
    description: 'Hoteles, apartamentos y datos de las reservas.',
    icon: 'bed',
  },
  {
    id: 'budget',
    slug: 'presupuesto',
    navigationLabel: 'Presupuesto',
    title: 'Presupuesto',
    description: 'Previsión y seguimiento de los gastos del viaje.',
    icon: 'wallet',
  },
  {
    id: 'restaurants',
    slug: 'restaurantes',
    navigationLabel: 'Restaurantes',
    title: 'Reservas de restaurantes',
    description: 'Restaurantes, comidas y reservas realizadas.',
    icon: 'restaurant',
  },
  {
    id: 'transfers',
    slug: 'trayectos',
    navigationLabel: 'Trayectos',
    title: 'Trayectos',
    description:
      'Desplazamientos de ida, vuelta y rutas intermedias.',
    icon: 'route',
  },
  {
    id: 'useful-data',
    slug: 'datos',
    navigationLabel: 'Datos varios',
    title: 'Datos varios',
    description:
      'Contactos, documentación, notas y otra información útil.',
    icon: 'info',
  },
] as const

export type TripWorkspaceSection =
  (typeof tripWorkspaceSections)[number]

export type TripWorkspaceSectionId = TripWorkspaceSection['id']

export type TripWorkspaceSectionIcon = TripWorkspaceSection['icon']

export function getTripWorkspacePath(tripId: string, slug?: string) {
  const basePath = `/viajes/${encodeURIComponent(tripId)}`

  return slug ? `${basePath}/${slug}` : basePath
}

export function getTripWorkspaceSection(sectionId: TripWorkspaceSectionId) {
  return tripWorkspaceSections.find((section) => section.id === sectionId)
}
