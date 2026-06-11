import { useEffect, useState, useCallback } from 'react'
import type { Competition, Fixture, Standing } from '../types'
import { supabase } from '../lib/supabase'
import {
  getActiveCompetition,
  generateStateChampionship,
  getStandings,
  getNextUserFixture,
  simulateRoundAI,
  getCurrentRound,
  getFixturesByRound,
} from '../lib/competition'
import { useSave } from './useSave'

interface NextFixtureInfo {
  fixture: Fixture
  competition: Competition
  opponentName: string
  opponentReputation: number
}

export function useCompetition() {
  const { save, loading: saveLoading } = useSave()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [standings, setStandings]     = useState<Standing[]>([])
  const [nextFixture, setNextFixture]  = useState<NextFixtureInfo | null>(null)
  const [currentRound, setCurrentRound] = useState(1)
  const [roundFixtures, setRoundFixtures] = useState<Fixture[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!save?.id || !save.club_id) return
    setLoading(true)

    try {
      let comp = await getActiveCompetition(save.id)

      if (!comp) {
        // Fetch user club state
        const { data: club } = await supabase.from('clubs').select('state').eq('id', save.club_id).maybeSingle()
        const state = club?.state ?? 'BR'

        const compId = await generateStateChampionship(
          save.id,
          { id: save.club_id, name: save.club_name, state },
          save.season_current ?? 1
        )

        if (!compId) { setError('Erro ao criar campeonato.'); setLoading(false); return }
        comp = await getActiveCompetition(save.id)
      }

      setCompetition(comp)

      if (comp) {
        const [standingsData, nextFix, round] = await Promise.all([
          getStandings(comp.id),
          getNextUserFixture(save.id),
          getCurrentRound(comp.id),
        ])

        setStandings(standingsData)
        setNextFixture(nextFix)
        setCurrentRound(round)

        const roundFixes = await getFixturesByRound(comp.id, round)
        setRoundFixtures(roundFixes)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [save?.id, save?.club_id, save?.club_name, save?.season_current])

  useEffect(() => {
    if (!saveLoading && save) refresh()
  }, [saveLoading, save, refresh])

  async function simulateCurrentRoundAI() {
    if (!competition || !save?.club_id) return
    await simulateRoundAI(currentRound, competition.id, save.club_id)
    await refresh()
  }

  return {
    competition,
    standings,
    nextFixture,
    currentRound,
    roundFixtures,
    loading,
    error,
    refresh,
    simulateCurrentRoundAI,
  }
}
