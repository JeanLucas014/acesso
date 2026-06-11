import { useEffect, useState, useCallback } from 'react'
import type { UserSave, DraftPlayer } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useGameStore } from '../store/useGameStore'

interface CreateSaveInput {
  clubName: string
  state: string
  city: string
  primaryColor: string
  secondaryColor: string
  crestTemplate: number
  originType: string
  budget: number
  wageBill: number
  selectedPlayers: DraftPlayer[]
}

export function useSave() {
  const { user } = useAuth()
  const setSave = useGameStore((s) => s.setSave)
  const [save, setSaveState] = useState<UserSave | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSave = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('user_saves')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (err) { setError(err.message); setLoading(false); return }
    setSaveState(data ?? null)
    if (data) {
      setSave({
        saveId: data.id,
        clubId: data.club_id ?? null,
        clubName: data.club_name ?? '',
        clubPrimaryColor: data.club_primary_color ?? '#22C55E',
        clubSecondaryColor: data.club_secondary_color ?? '#FFFFFF',
        clubCrestTemplate: data.club_crest_template ?? 1,
        division: data.origin_type ?? 'estadual',
        budget: data.budget_brl ?? 0,
        wageBill: data.wage_bill_brl ?? 0,
        season: data.season_current ?? 1,
      })
    }
    setLoading(false)
  }, [user, setSave])

  useEffect(() => { fetchSave() }, [fetchSave])

  async function createSave(input: CreateSaveInput): Promise<string | null> {
    if (!user) return null

    // 1. Create club
    const { data: clubData, error: clubErr } = await supabase
      .from('clubs')
      .insert({
        name: input.clubName,
        short_name: input.clubName.split(' ').filter(w => w.length > 2).slice(0, 3).map(w => w[0]).join('').toUpperCase() || input.clubName.slice(0, 3).toUpperCase(),
        city: input.city,
        state: input.state,
        division: 'estadual',
        is_real: false,
        primary_color: input.primaryColor,
        secondary_color: input.secondaryColor,
      })
      .select('id')
      .single()

    if (clubErr || !clubData) { setError(clubErr?.message ?? 'Erro ao criar clube'); return null }

    // 2. Create user_save
    const { data: saveData, error: saveErr } = await supabase
      .from('user_saves')
      .insert({
        user_id: user.id,
        club_id: clubData.id,
        club_name: input.clubName,
        club_primary_color: input.primaryColor,
        club_secondary_color: input.secondaryColor,
        club_crest_template: input.crestTemplate,
        season_current: 1,
        budget_brl: input.budget,
        wage_bill_brl: input.wageBill,
        prestige: input.originType === 'historic' ? 50 : 10,
        origin_type: input.originType,
      })
      .select('id')
      .single()

    if (saveErr || !saveData) { setError(saveErr?.message ?? 'Erro ao criar save'); return null }

    const saveId = saveData.id

    // 3. Insert players + squad in parallel batches
    const playerInserts = input.selectedPlayers.map((p) => ({
      name: p.name,
      age: p.age,
      nationality: p.nationality,
      position_main: p.position,
      rating_overall: p.rating_overall,
      rating_pace: p.rating_pace,
      rating_shooting: p.rating_shooting,
      rating_passing: p.rating_passing,
      rating_dribbling: p.rating_dribbling,
      rating_defending: p.rating_defending,
      rating_physical: Math.round((p.rating_pace + p.rating_defending) / 2),
      rating_mental: Math.round((p.rating_passing + p.rating_defending) / 2),
      potential: p.potential,
      market_value_brl: p.wage_brl * 24,
      wage_brl: p.wage_brl,
      current_club_id: clubData.id,
      division: 'estadual',
      renown: 'local',
    }))

    const { data: playersData, error: playersErr } = await supabase
      .from('players')
      .insert(playerInserts)
      .select('id')

    if (playersErr || !playersData) { setError(playersErr?.message ?? 'Erro ao inserir jogadores'); return null }

    const squadInserts = input.selectedPlayers.map((p, i) => ({
      save_id: saveId,
      player_id: playersData[i].id,
      shirt_number: i + 1,
      wage_brl: p.wage_brl,
      contract_end_season: p.isYouth ? 5 : 3,
      morale: 70,
      fatigue: 0,
      is_youth: p.isYouth,
    }))

    const { error: squadErr } = await supabase.from('squads').insert(squadInserts)
    if (squadErr) { setError(squadErr.message); return null }

    // 4. Update store
    setSave({
      saveId,
      clubId: clubData.id,
      clubName: input.clubName,
      clubPrimaryColor: input.primaryColor,
      clubSecondaryColor: input.secondaryColor,
      clubCrestTemplate: input.crestTemplate,
      budget: input.budget,
      wageBill: input.wageBill,
      season: 1,
    })

    await fetchSave()
    return saveId
  }

  return { save, loading, error, createSave, refetch: fetchSave }
}
