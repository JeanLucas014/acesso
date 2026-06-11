import { useEffect, useState, useCallback } from 'react'
import type { SquadPlayer } from '../types'
import { supabase } from '../lib/supabase'

export function useSquad(saveId: string | null) {
  const [players, setPlayers] = useState<SquadPlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSquad = useCallback(async () => {
    if (!saveId) { setPlayers([]); return }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('squads')
      .select(`
        id,
        shirt_number,
        wage_brl,
        contract_end_season,
        morale,
        fatigue,
        goals_season,
        assists_season,
        rating_avg_season,
        is_youth,
        loan_from_club_id,
        players (*)
      `)
      .eq('save_id', saveId)
      .order('shirt_number', { ascending: true })

    if (err) { setError(err.message); setLoading(false); return }

    const squad: SquadPlayer[] = (data ?? []).map((row) => {
      const p = row.players as unknown as Record<string, unknown>
      return {
        // player fields
        id: p.id as string,
        name: p.name as string,
        age: p.age as number,
        nationality: (p.nationality as string) ?? 'Brasileiro',
        position_main: p.position_main as SquadPlayer['position_main'],
        position_secondary: p.position_secondary as string | undefined,
        rating_overall: p.rating_overall as number,
        rating_pace: p.rating_pace as number,
        rating_shooting: p.rating_shooting as number,
        rating_passing: p.rating_passing as number,
        rating_dribbling: p.rating_dribbling as number,
        rating_defending: p.rating_defending as number,
        rating_physical: p.rating_physical as number,
        rating_mental: p.rating_mental as number,
        potential: p.potential as number,
        market_value_brl: p.market_value_brl as number,
        wage_brl: row.wage_brl ?? (p.wage_brl as number),
        current_club_id: p.current_club_id as string | undefined,
        division: (p.division as string) ?? 'estadual',
        renown: (p.renown as string) ?? 'local',
        // squad fields
        squad_id: row.id,
        shirt_number: row.shirt_number ?? undefined,
        contract_end_season: row.contract_end_season,
        morale: row.morale,
        fatigue: row.fatigue,
        goals_season: row.goals_season,
        assists_season: row.assists_season,
        rating_avg_season: row.rating_avg_season ?? undefined,
        is_youth: row.is_youth,
        loan_from_club_id: row.loan_from_club_id ?? undefined,
      }
    })

    setPlayers(squad)
    setLoading(false)
  }, [saveId])

  useEffect(() => { fetchSquad() }, [fetchSquad])

  return { players, loading, error, refetch: fetchSquad }
}
