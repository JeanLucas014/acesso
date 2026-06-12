import { useState, useEffect, useCallback } from 'react'
import { useSave } from './useSave'
import { getFinances, getRecentTransactions, checkFairPlay, getMonthlyChartData } from '../lib/clubFinances'
import type { Finance, FairPlayStatus } from '../types'

interface MonthData { month: number; income: number; expense: number }

export function useFinances() {
  const { save } = useSave()

  const [finances, setFinances]     = useState<Finance[]>([])
  const [recent, setRecent]         = useState<Finance[]>([])
  const [fairPlay, setFairPlay]     = useState<FairPlayStatus | null>(null)
  const [chartData, setChartData]   = useState<MonthData[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!save?.id) return
    setLoading(true)
    setError(null)
    try {
      const [all, rec] = await Promise.all([
        getFinances(save.id, save.season_current),
        getRecentTransactions(save.id, 20),
      ])
      setFinances(all)
      setRecent(rec)
      setFairPlay(checkFairPlay(save.wage_bill_brl, all))
      setChartData(getMonthlyChartData(all))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [save?.id, save?.season_current, save?.wage_bill_brl])

  useEffect(() => { fetchData() }, [fetchData])

  const totalIncome  = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount_brl, 0)
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount_brl, 0)
  const netResult    = totalIncome - totalExpense

  return {
    finances,
    recent,
    fairPlay,
    chartData,
    totalIncome,
    totalExpense,
    netResult,
    loading,
    error,
    refresh: fetchData,
  }
}
