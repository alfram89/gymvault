const modules = import.meta.glob('./*.json', { eager: true })
export const TEMPLATES = Object.values(modules).map(m => m.default ?? m)
