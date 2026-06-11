import { create } from 'zustand'

interface GameStore {
  saveId: string | null
  clubId: string | null
  clubName: string | null
  division: string | null
  budget: number
  season: number
  setSave: (data: Partial<GameStore>) => void
  clearSave: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  saveId: null,
  clubId: null,
  clubName: null,
  division: null,
  budget: 0,
  season: 1,
  setSave: (data) => set(data),
  clearSave: () =>
    set({
      saveId: null,
      clubId: null,
      clubName: null,
      division: null,
      budget: 0,
      season: 1,
    }),
}))
