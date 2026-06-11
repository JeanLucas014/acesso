import { useState } from 'react'
import type { DraftPlayer, Position } from '../types'

const FIRST_NAMES = [
  'João', 'Pedro', 'Lucas', 'Matheus', 'Gabriel', 'Rafael', 'Felipe', 'Bruno',
  'Carlos', 'Anderson', 'Diego', 'Rodrigo', 'Eduardo', 'Victor', 'Leandro',
  'Marcelo', 'Thiago', 'Guilherme', 'Caio', 'Renato', 'Henrique', 'Paulo',
  'Sandro', 'Vinicius', 'Alex', 'Daniel', 'Wendell', 'Alexsandro', 'Robson', 'Tiago',
]
const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Costa', 'Souza', 'Lima', 'Ferreira', 'Pereira',
  'Rodrigues', 'Alves', 'Nascimento', 'Carvalho', 'Gomes', 'Ribeiro', 'Martins',
  'Rocha', 'Vieira', 'Almeida', 'Barbosa', 'Cunha', 'Dias', 'Freitas', 'Melo',
  'Moreira', 'Nunes', 'Araújo', 'Borges', 'Castro', 'Duarte', 'Ramos',
]

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function pickName(rand: () => number, usedNames: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
    const name = `${first} ${last}`
    if (!usedNames.has(name)) { usedNames.add(name); return name }
  }
  return `Jogador ${Math.floor(rand() * 99) + 1}`
}

interface SlotDef { position: Position; isYouth: boolean }

const POOL_SLOTS: SlotDef[] = [
  // Young (15): 2 GOL, 2 ZAG, 3 LAT, 2 VOL, 2 MEI, 4 ATA
  { position: 'GOL', isYouth: true }, { position: 'GOL', isYouth: true },
  { position: 'ZAG', isYouth: true }, { position: 'ZAG', isYouth: true },
  { position: 'LAT', isYouth: true }, { position: 'LAT', isYouth: true }, { position: 'LAT', isYouth: true },
  { position: 'VOL', isYouth: true }, { position: 'VOL', isYouth: true },
  { position: 'MEI', isYouth: true }, { position: 'MEI', isYouth: true },
  { position: 'ATA', isYouth: true }, { position: 'ATA', isYouth: true },
  { position: 'ATA', isYouth: true }, { position: 'ATA', isYouth: true },
  // Veteran (15): 2 GOL, 3 ZAG, 2 LAT, 3 VOL, 3 MEI, 2 ATA
  { position: 'GOL', isYouth: false }, { position: 'GOL', isYouth: false },
  { position: 'ZAG', isYouth: false }, { position: 'ZAG', isYouth: false }, { position: 'ZAG', isYouth: false },
  { position: 'LAT', isYouth: false }, { position: 'LAT', isYouth: false },
  { position: 'VOL', isYouth: false }, { position: 'VOL', isYouth: false }, { position: 'VOL', isYouth: false },
  { position: 'MEI', isYouth: false }, { position: 'MEI', isYouth: false }, { position: 'MEI', isYouth: false },
  { position: 'ATA', isYouth: false }, { position: 'ATA', isYouth: false },
]

function attrByPosition(pos: Position, rand: () => number, base: number) {
  const v = (min: number, max: number) => Math.round(min + rand() * (max - min))
  switch (pos) {
    case 'GOL': return { pace: v(35,55), shooting: v(10,25), passing: v(40,60), dribbling: v(20,40), defending: base + v(5,20) }
    case 'ZAG': return { pace: v(45,65), shooting: v(20,40), passing: v(45,65), dribbling: v(30,50), defending: base + v(5,20) }
    case 'LAT': return { pace: base + v(5,20), shooting: v(30,55), passing: v(55,75), dribbling: v(55,72), defending: v(55,75) }
    case 'VOL': return { pace: v(55,72), shooting: v(35,55), passing: base + v(5,18), dribbling: v(45,65), defending: base + v(3,15) }
    case 'MEI': return { pace: v(55,72), shooting: v(50,72), passing: base + v(8,22), dribbling: base + v(5,20), defending: v(40,60) }
    case 'ATA': return { pace: base + v(8,22), shooting: base + v(8,22), passing: v(45,65), dribbling: base + v(5,18), defending: v(20,40) }
  }
}

function generatePool(): DraftPlayer[] {
  const seed = Math.floor(Math.random() * 999999)
  const rand = rng(seed)
  const usedNames = new Set<string>()

  return POOL_SLOTS.map((slot, i) => {
    const name = pickName(rand, usedNames)
    const isYouth = slot.isYouth
    const age = isYouth ? 17 + Math.floor(rand() * 6) : 30 + Math.floor(rand() * 6)
    const base = isYouth ? 45 + Math.floor(rand() * 20) : 60 + Math.floor(rand() * 15)
    const attrs = attrByPosition(slot.position, rand, base)
    const overall = Math.round((attrs.pace + attrs.shooting + attrs.passing + attrs.dribbling + attrs.defending) / 5)
    const potential = isYouth ? 70 + Math.floor(rand() * 20) : base + Math.floor(rand() * 10)
    const wage = isYouth
      ? Math.round((2000 + Math.floor(rand() * 6000)) / 100) * 100
      : Math.round((8000 + Math.floor(rand() * 22000)) / 100) * 100

    return {
      localId: `draft-${i}-${seed}`,
      name,
      age,
      nationality: 'Brasileiro',
      position: slot.position,
      isYouth,
      rating_overall: overall,
      rating_pace: attrs.pace,
      rating_shooting: attrs.shooting,
      rating_passing: attrs.passing,
      rating_dribbling: attrs.dribbling,
      rating_defending: attrs.defending,
      potential,
      wage_brl: wage,
    }
  })
}

export const REQUIRED: Record<Position, number> = {
  GOL: 2, ZAG: 4, LAT: 4, VOL: 4, MEI: 3, ATA: 5,
}

export function useDraft() {
  const [pool] = useState<DraftPlayer[]>(() => generatePool())
  const [selected, setSelected] = useState<DraftPlayer[]>([])

  const totalWage = selected.reduce((s, p) => s + p.wage_brl, 0)

  const posCount = selected.reduce((acc, p) => {
    acc[p.position] = (acc[p.position] ?? 0) + 1
    return acc
  }, {} as Partial<Record<Position, number>>)

  const isComplete =
    selected.length === 22 &&
    (Object.entries(REQUIRED) as [Position, number][]).every(
      ([pos, req]) => (posCount[pos] ?? 0) >= req
    )

  function addPlayer(player: DraftPlayer) {
    if (selected.find((p) => p.localId === player.localId)) return
    if (selected.length >= 22) return
    setSelected((prev) => [...prev, player])
  }

  function removePlayer(localId: string) {
    setSelected((prev) => prev.filter((p) => p.localId !== localId))
  }

  return { pool, selected, totalWage, posCount, isComplete, addPlayer, removePlayer }
}
