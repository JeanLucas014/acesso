import type { WizardData } from '../CreateClubPage'
import { ClubCrest } from '../../components/ClubCrest'

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const COLORS = [
  '#22C55E','#EF4444','#3B82F6','#F59E0B','#8B5CF6','#EC4899',
]

const CREST_LABELS = ['Clássico','Redondo','Hexagonal','Diamante','Moderno','Brasão']

interface Props {
  data: WizardData
  onChange: (update: Partial<WizardData>) => void
  onNext: () => void
}

export function StepIdentity({ data, onChange, onNext }: Props) {
  const canProceed = data.clubName.trim().length >= 3 && data.state && data.city.trim()

  return (
    <div>
      <h2 className="text-[18px] font-bold leading-snug mb-4">
        Como vai se chamar<br />seu clube?
      </h2>

      {/* Club name */}
      <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-xs font-medium text-muted">Nome do clube</label>
        <input
          type="text"
          value={data.clubName}
          onChange={(e) => onChange({ clubName: e.target.value })}
          placeholder="Ex: Esporte Clube Zona Norte"
          className="bg-card border-[0.5px] border-ui-border rounded-lg px-3.5 py-3 text-white text-sm placeholder-faint focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* State + city */}
      <div className="flex gap-3 mb-4">
        <div className="flex flex-col gap-1.5 w-28 shrink-0">
          <label className="text-xs font-medium text-muted">Estado</label>
          <select
            value={data.state}
            onChange={(e) => onChange({ state: e.target.value })}
            className="bg-card border-[0.5px] border-ui-border rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-accent appearance-none"
          >
            <option value="">UF</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-xs font-medium text-muted">Cidade</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Sua cidade"
            className="bg-card border-[0.5px] border-ui-border rounded-lg px-3.5 py-3 text-white text-sm placeholder-faint focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Colors */}
      <div className="flex gap-6 mb-5">
        <div>
          <p className="text-xs font-medium text-muted mb-2">Cor primária</p>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange({ primaryColor: c })}
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  background: c,
                  outline: data.primaryColor === c ? `2px solid white` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted mb-2">Cor secundária</p>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange({ secondaryColor: c })}
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  background: c,
                  outline: data.secondaryColor === c ? `2px solid white` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Crest template */}
      <p className="text-xs font-medium text-muted mb-2">Escudo</p>
      <div className="grid grid-cols-6 gap-2 mb-6">
        {CREST_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => onChange({ crestTemplate: i + 1 })}
            className="flex flex-col items-center gap-1 p-2 rounded-[8px] transition-colors"
            style={{
              background: data.crestTemplate === i + 1 ? 'rgba(34,197,94,0.1)' : '#111111',
              border: `0.5px solid ${data.crestTemplate === i + 1 ? '#22C55E' : '#1F1F1F'}`,
            }}
          >
            <ClubCrest
              name={data.clubName || 'EC'}
              primaryColor={data.primaryColor}
              template={i + 1}
              size={28}
            />
            <span className="text-[8px] text-faint leading-none">{label}</span>
          </button>
        ))}
      </div>

      {/* Preview */}
      {data.clubName && (
        <div className="flex items-center gap-3 bg-card border-[0.5px] border-ui-border rounded-[10px] p-3 mb-5">
          <ClubCrest name={data.clubName} primaryColor={data.primaryColor} template={data.crestTemplate} size={40} />
          <div>
            <p className="font-semibold text-sm">{data.clubName}</p>
            <p className="text-xs text-muted">{data.city || '—'}, {data.state || '—'}</p>
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full bg-accent text-[#0A0A0A] font-semibold text-[15px] rounded-lg py-3.5 disabled:opacity-40 transition-opacity"
      >
        Próximo →
      </button>
    </div>
  )
}
