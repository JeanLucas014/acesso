import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Formation, DraftPlayer, OriginType } from '../types'
import { StepProgress } from '../components/StepProgress'
import { StepIdentity } from './create-club/StepIdentity'
import { StepOrigin } from './create-club/StepOrigin'
import { StepDraft } from './create-club/StepDraft'
import { StepFormation } from './create-club/StepFormation'
import { useSave } from '../hooks/useSave'

export interface WizardData {
  // Step 1
  clubName: string
  state: string
  city: string
  primaryColor: string
  secondaryColor: string
  crestTemplate: number
  // Step 2
  originType: OriginType | null
  budget: number
  wageLimit: number
  // Step 3
  selectedPlayers: DraftPlayer[]
  // Step 4
  formation: Formation
  lineup: Record<string, string>
}

const INITIAL: WizardData = {
  clubName: '',
  state: '',
  city: '',
  primaryColor: '#22C55E',
  secondaryColor: '#FFFFFF',
  crestTemplate: 1,
  originType: null,
  budget: 300000,
  wageLimit: 50000,
  selectedPlayers: [],
  formation: '4-3-3',
  lineup: {},
}

const STEPS = [
  { label: 'Identidade' },
  { label: 'Financeiro' },
  { label: 'Draft' },
  { label: 'Formação' },
]

export function CreateClubPage() {
  const navigate = useNavigate()
  const { createSave } = useSave()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function update(patch: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...patch }))
  }

  async function handleFinish() {
    if (!data.originType) return
    setSaving(true)
    setSaveError(null)

    const wageBill = data.selectedPlayers.reduce((s, p) => s + p.wage_brl, 0)

    const saveId = await createSave({
      clubName: data.clubName,
      state: data.state,
      city: data.city,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      crestTemplate: data.crestTemplate,
      originType: data.originType,
      budget: data.budget,
      wageBill,
      selectedPlayers: data.selectedPlayers,
    })

    setSaving(false)

    if (!saveId) {
      setSaveError('Erro ao salvar. Tenta de novo!')
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-dvh max-w-[390px] mx-auto px-4 pt-4 pb-6">
      <StepProgress steps={STEPS} current={step} />

      {saveError && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-4 text-sm text-danger text-center">
          {saveError}
        </div>
      )}

      {step === 0 && (
        <StepIdentity data={data} onChange={update} onNext={() => setStep(1)} />
      )}
      {step === 1 && (
        <StepOrigin data={data} onChange={update} onNext={() => setStep(2)} onBack={() => setStep(0)} />
      )}
      {step === 2 && (
        <StepDraft data={data} onChange={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <StepFormation
          data={data}
          onChange={update}
          onFinish={handleFinish}
          onBack={() => setStep(2)}
          saving={saving}
        />
      )}
    </div>
  )
}
