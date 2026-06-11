import type { Position } from '../types'

// ═══════════════════════════════════════════════
// CLUBS
// ═══════════════════════════════════════════════
export const SEED_CLUBS = [
  { name: 'Flamengo', short_name: 'FLA', city: 'Rio de Janeiro', state: 'RJ', primary_color: '#E8001C', secondary_color: '#000000', reputation: 95, fanbase_size: 40000000, division: 'serie_a' },
  { name: 'Palmeiras', short_name: 'PAL', city: 'São Paulo', state: 'SP', primary_color: '#006437', secondary_color: '#FFFFFF', reputation: 92, fanbase_size: 18000000, division: 'serie_a' },
  { name: 'Corinthians', short_name: 'COR', city: 'São Paulo', state: 'SP', primary_color: '#000000', secondary_color: '#FFFFFF', reputation: 90, fanbase_size: 30000000, division: 'serie_a' },
  { name: 'São Paulo FC', short_name: 'SPF', city: 'São Paulo', state: 'SP', primary_color: '#CC0000', secondary_color: '#FFFFFF', reputation: 88, fanbase_size: 15000000, division: 'serie_a' },
  { name: 'Atlético-MG', short_name: 'CAM', city: 'Belo Horizonte', state: 'MG', primary_color: '#000000', secondary_color: '#FFFFFF', reputation: 87, fanbase_size: 14000000, division: 'serie_a' },
  { name: 'Grêmio', short_name: 'GRE', city: 'Porto Alegre', state: 'RS', primary_color: '#0043A0', secondary_color: '#000000', reputation: 85, fanbase_size: 12000000, division: 'serie_a' },
  { name: 'Internacional', short_name: 'INT', city: 'Porto Alegre', state: 'RS', primary_color: '#CC0000', secondary_color: '#FFFFFF', reputation: 84, fanbase_size: 11000000, division: 'serie_a' },
  { name: 'Santos', short_name: 'SAN', city: 'Santos', state: 'SP', primary_color: '#000000', secondary_color: '#FFFFFF', reputation: 82, fanbase_size: 9000000, division: 'serie_a' },
  { name: 'Botafogo', short_name: 'BOT', city: 'Rio de Janeiro', state: 'RJ', primary_color: '#000000', secondary_color: '#FFFFFF', reputation: 80, fanbase_size: 10000000, division: 'serie_a' },
  { name: 'Fluminense', short_name: 'FLU', city: 'Rio de Janeiro', state: 'RJ', primary_color: '#6B0F2A', secondary_color: '#338B4A', reputation: 79, fanbase_size: 8000000, division: 'serie_a' },
] as const

// ═══════════════════════════════════════════════
// PLAYER GENERATOR
// ═══════════════════════════════════════════════
const FIRST = ['Éverton','Gabriel','Pedro','Lucas','Matheus','Raphael','Bruno','Thiago','Anderson','Rodrigo','Diego','Carlos','Felipe','Eduardo','Victor','Leandro','Marcelo','Caio','Daniel','Jorge','Paulo','Vinicius','Alex','Renato','Neymar','Luan','Patrick','Willian','Claudinho','Roni']
const LAST  = ['Silva','Santos','Oliveira','Costa','Souza','Lima','Ferreira','Pereira','Rodrigues','Alves','Nascimento','Carvalho','Gomes','Ribeiro','Martins','Rocha','Vieira','Almeida','Barbosa','Cunha','Melo','Moreira','Nunes','Araújo','Castro','Borges','Duarte','Ramos','Batista','Cunha']

function lcg(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff }
}

type SeedClub = (typeof SEED_CLUBS)[number]

export function generateClubPlayers(club: SeedClub, clubIdx: number) {
  const rand = lcg(clubIdx * 997 + 3)
  const base = club.reputation >= 90 ? 78 : club.reputation >= 85 ? 73 : 67
  const used = new Set<string>()

  function name() {
    for (let i = 0; i < 40; i++) {
      const n = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`
      if (!used.has(n)) { used.add(n); return n }
    }
    return `Jogador ${clubIdx * 100 + Math.floor(rand() * 99)}`
  }

  const v = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo))

  function makePlayer(pos: Position, posIdx: number) {
    const age = 18 + v(0, 16)
    const b = base + v(-8, 8)
    let pace = v(45,70), shooting = v(35,60), passing = v(45,70), dribbling = v(40,65), defending = v(45,70)
    switch (pos) {
      case 'GOL': pace=v(35,55); shooting=v(10,25); defending=b+v(0,12); break
      case 'ZAG': pace=v(50,68); shooting=v(22,42); defending=b+v(0,12); break
      case 'LAT': pace=b+v(0,12); passing=b+v(-5,10); defending=v(58,78); break
      case 'VOL': passing=b+v(0,10); defending=b+v(0,10); shooting=v(35,55); break
      case 'MEI': passing=b+v(5,15); dribbling=b+v(0,12); shooting=v(55,78); break
      case 'ATA': pace=b+v(5,15); shooting=b+v(5,15); dribbling=b+v(0,12); defending=v(20,40); break
    }
    const overall = Math.round((pace+shooting+passing+dribbling+defending)/5)
    const potential = Math.min(99, overall + v(0,15))
    const wage = Math.round((8000 + v(0, 172000)) / 1000) * 1000
    return {
      localId: `seed-${clubIdx}-${posIdx}`,
      name: name(),
      age,
      nationality: 'Brasileiro',
      position_main: pos,
      rating_overall: overall,
      rating_pace: pace,
      rating_shooting: shooting,
      rating_passing: passing,
      rating_dribbling: dribbling,
      rating_defending: defending,
      rating_physical: v(55, 80),
      rating_mental: v(55, 80),
      potential,
      market_value_brl: wage * 24,
      wage_brl: wage,
      division: club.division as string,
      renown: club.reputation >= 88 ? 'national' : 'local',
    }
  }

  const positions: Position[] = [
    'GOL','GOL',
    'ZAG','ZAG','ZAG','ZAG',
    'LAT','LAT','LAT','LAT',
    'VOL','VOL','VOL','VOL',
    'MEI','MEI','MEI','MEI',
    'ATA','ATA','ATA','ATA','ATA','ATA','ATA',
  ]

  return positions.map((pos, i) => makePlayer(pos, i))
}

export const SEED_PLAYERS = SEED_CLUBS.flatMap((club, idx) =>
  generateClubPlayers(club, idx)
)
