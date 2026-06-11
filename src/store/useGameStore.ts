import { create } from 'zustand'

interface GameStore {
  saveId: string | null
  clubId: string | null
  clubName: string
  clubPrimaryColor: string
  clubSecondaryColor: string
  clubCrestTemplate: number
  division: string
  budget: number
  wageBill: number
  season: number
  setSave: (data: Partial<GameStore>) => void
  clearSave: () => void
}

const defaults = {
  saveId: null,
  clubId: null,
  clubName: '',
  clubPrimaryColor: '#22C55E',
  clubSecondaryColor: '#FFFFFF',
  clubCrestTemplate: 1,
  division: 'estadual',
  budget: 0,
  wageBill: 0,
  season: 1,
}

export const useGameStore = create<GameStore>((set) => ({
  ...defaults,
  setSave: (data) => set(data),
  clearSave: () => set(defaults),
}))
