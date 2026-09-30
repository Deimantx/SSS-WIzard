export const GUILD_FACILITIES = [
  { id: 'archive', name: 'Arcane Archive', shortName: 'Archive', description: 'Preserve registered materials, formulae, and Guild records.', seal: 'I' },
  { id: 'research-wing', name: 'Research Wing', shortName: 'Research Wing', description: 'Expand scholarly capacity and improve research output.', seal: 'II' },
  { id: 'transmutation-hall', name: 'Transmutation Hall', shortName: 'Transmutation Hall', description: 'Restore and refine the Guild material arrays.', seal: 'III' },
  { id: 'leyline-annex', name: 'Leyline Annex', shortName: 'Leyline Annex', description: 'Improve the tower’s Arcane Flux intake and storage.', seal: 'IV' },
  { id: 'acolyte-quarters', name: 'Acolyte Quarters', shortName: 'Acolyte Quarters', description: 'Safely increase the Guild’s Acolyte capacity.', seal: 'V' },
  { id: 'commission-office', name: 'Commission Office', shortName: 'Commission Office', description: 'Improve the Guild’s professional Commission service.', seal: 'VI' },
] as const

export type GuildFacilityId = (typeof GUILD_FACILITIES)[number]['id']
