import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    if (isSignUp) {
      setInfo('Conta criada! Verifique seu e-mail para confirmar.')
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 max-w-[390px] mx-auto">
      {/* Logo */}
      <div className="text-center mb-12">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto mb-4">
          <circle cx="28" cy="28" r="26" stroke="#22C55E" strokeWidth="1.5" fill="none" />
          <circle cx="28" cy="28" r="10" stroke="#22C55E" strokeWidth="1" fill="none" />
          <line x1="28" y1="2" x2="28" y2="54" stroke="#22C55E" strokeWidth="0.5" opacity="0.3" />
          <line x1="2" y1="28" x2="54" y2="28" stroke="#22C55E" strokeWidth="0.5" opacity="0.3" />
        </svg>
        <h1 className="text-[36px] font-bold text-accent tracking-tight leading-none mb-2">Acesso</h1>
        <p className="text-sm text-muted">Da várzea à Libertadores.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="bg-card border-[0.5px] border-ui-border rounded-lg px-3.5 py-3 text-white text-sm placeholder-faint focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="bg-card border-[0.5px] border-ui-border rounded-lg px-3.5 py-3 text-white text-sm placeholder-faint focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {error && <p className="text-danger text-xs text-center">{error}</p>}
        {info && <p className="text-accent text-xs text-center">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-[#0A0A0A] font-semibold text-[15px] rounded-lg py-3.5 mt-1 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar 🟢'}
        </button>

        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(null); setInfo(null) }}
          className="text-faint text-xs text-center mt-1 hover:text-muted transition-colors"
        >
          {isSignUp ? 'Já tem conta? Entrar' : 'Ainda não tem conta? Criar'}
        </button>
      </form>
    </div>
  )
}
