export function isValidTn(value: string): boolean {
  return /^\d{10}$/.test(value);
}

export function isValidSpid(value: string): boolean {
  return /^[A-Za-z0-9]{4}$/.test(value);
}

export function isValidLrn(value: string): boolean {
  return /^\d{10}$/.test(value);
}

export function isValidRegion(value: string): boolean {
  return /^[A-Za-z0-9]{4}$/.test(value);
}
