import type { WizardData } from '../CreateClubPage'
import type { OriginType } from '../../types'

interface OriginOption {
  type: OriginType
  title: string
  badge: string
  budget: number
  wageLimit: number
  description: string
}

const OPTIONS: OriginOption[] = [
  {
    type: 'neighborhood',
    title: 'Clube de bairro',
    badge: 'Nasceu no coração do povo',
    budget: 300000,
    wageLimit: 50000,
    description: 'R$300k de orçamento. Moral inicial +10. Sem estrutura, mas com alma.',
  },
  {
    type: 'corporate',
    title: 'Projeto empresarial',
    badge: 'Dinheiro tem. Torcida, a gente conquista.',
    budget: 600000,
    wageLimit: 100000,
    description: 'R$600k de orçamento. Patrocínio +10%. Sem história, mas com capital.',
  },
  {
    type: 'historic',
    title: 'Clube histórico ressurgido',
    badge: 'A glória vai voltar',
    budget: 150000,
    wageLimit: 30000,
    description: 'R$150k de orçamento. Bilheteria +20%. Reputação 50. Legado pesa.',
  },
]

interface Props {
  data: WizardData
  onChange: (update: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepOrigin({ data, onChange, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-[18px] font-bold leading-snug mb-4">
        Qual é a origem<br />do seu clube?
      </h2>

      <div className="flex flex-col gap-3 mb-6">
        {OPTIONS.map((opt) => {
          const active = data.originType === opt.type
          return (
            <button
              key={opt.type}
              onClick={() => onChange({ originType: opt.type, budget: opt.budget, wageLimit: opt.wageLimit })}
              className="text-left rounded-[10px] p-4 transition-all"
              style={{
                background: active ? 'rgba(34,197,94,0.08)' : '#111111',
                border: `0.5px solid ${active ? '#22C55E' : '#1F1F1F'}`,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="font-semibold text-sm">{opt.title}</p>
                {active && (
                  <span className="text-accent text-lg leading-none shrink-0">●</span>
                )}
              </div>
              <p className="text-[11px] text-muted leading-relaxed mb-2">{opt.description}</p>
              <span
                className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded"
                style={{
                  background: 'rgba(34,197,94,0.1)',
                  color: '#22C55E',
                }}
              >
                {opt.badge}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-lg text-sm font-medium text-muted border-[0.5px] border-ui-border"
        >
          ← Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!data.originType}
          className="flex-1 py-3.5 rounded-lg text-sm font-semibold bg-accent text-[#0A0A0A] disabled:opacity-40 transition-opacity"
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}
