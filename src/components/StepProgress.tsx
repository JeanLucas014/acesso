interface Step {
  label: string
}

interface StepProgressProps {
  steps: Step[]
  current: number // 0-indexed
}

export function StepProgress({ steps, current }: StepProgressProps) {
  return (
    <div className="flex items-center px-2 mb-6">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-[5px]">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border transition-colors ${
                  done
                    ? 'bg-accent border-accent text-[#0A0A0A]'
                    : active
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-ui-border text-faint bg-[#0A0A0A]'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  done ? 'text-accent' : active ? 'text-white font-semibold' : 'text-faint'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 mx-1 mb-[18px]"
                style={{ height: '1.5px', background: done ? '#22C55E' : '#1F1F1F' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
