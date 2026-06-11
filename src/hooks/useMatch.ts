import { useCallback, useState } from 'react'
import type { MatchResult, SquadUpdate, Match } from '../types'
import { supabase } from '../lib/supabase'

export function useMatch() {
  const [loading, setLoading] = useState(false)

  const saveResult = useCallback(async (opts: {
    result: MatchResult
    squadUpdates: SquadUpdate[]
    fixtureId: string
    saveId: string
    season: number
    competition: string
    round: number
    homeClubId: string
    homeClubName: string
    awayClubId: string
    awayClubName: string
    isUserHome: boolean
    formationUsed: string
    tacticUsed: string
  }): Promise<string | null> => {
    setLoading(true)
    try {
      // Save match record
      const { data: match, error: matchErr } = await supabase.from('matches').insert({
        save_id: opts.saveId,
        season: opts.season,
        competition: opts.competition,
        round: opts.round,
        home_club_id: opts.homeClubId,
        home_club_name: opts.homeClubName,
        away_club_id: opts.awayClubId,
        away_club_name: opts.awayClubName,
        home_goals: opts.result.homeGoals,
        away_goals: opts.result.awayGoals,
        is_user_home: opts.isUserHome,
        events: opts.result.events,
        ratings: opts.result.ratings,
        formation_used: opts.formationUsed,
        tactic_used: opts.tacticUsed,
        played_at: new Date().toISOString(),
      }).select('id').single()

      if (matchErr || !match) return null

      // Mark fixture as played
      await supabase.from('fixtures').update({
        home_goals: opts.result.homeGoals,
        away_goals: opts.result.awayGoals,
        is_played: true,
      }).eq('id', opts.fixtureId)

      // Update squad fatigue/morale/injuries
      for (const upd of opts.squadUpdates) {
        await supabase.from('squads').update({
          fatigue: upd.fatigue,
          morale: upd.morale,
          injury_games_out: upd.injuryGamesOut,
          suspension_games_out: upd.suspensionGamesOut,
        }).eq('save_id', opts.saveId).eq('player_id', upd.playerId)
      }

      return match.id
    } finally {
      setLoading(false)
    }
  }, [])

  const getMatch = useCallback(async (matchId: string): Promise<Match | null> => {
    const { data } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle()
    return data as Match | null
  }, [])

  return { saveResult, getMatch, loading }
}
