type EmptyValue = null | undefined | ''

export type CleanedValue<T> = T extends EmptyValue
  ? never
  : T extends readonly (infer Item)[]
    ? CleanedValue<Item>[]
    : T extends object
      ? T
      : T

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function cleanEmptyValues<T>(
  value: T,
): CleanedValue<T> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (Array.isArray(value)) {
    const cleanedArray = value
      .map((item) => cleanEmptyValues(item))
      .filter((item): item is NonNullable<typeof item> => item !== undefined)

    return cleanedArray.length > 0
      ? (cleanedArray as CleanedValue<T>)
      : undefined
  }

  if (isPlainObject(value)) {
    const cleanedObject = Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, cleanEmptyValues(item)] as const)
        .filter(([, item]) => item !== undefined),
    )

    return Object.keys(cleanedObject).length > 0
      ? (cleanedObject as CleanedValue<T>)
      : undefined
  }

  return value as CleanedValue<T>
}
