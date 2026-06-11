import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { SquadPage } from './pages/SquadPage'
import { PreMatchPage } from './pages/PreMatchPage'
import { PostMatchPage } from './pages/PostMatchPage'
import { CompetitionPage } from './pages/CompetitionPage'
import { TransfersPage } from './pages/TransfersPage'
import { FinancesPage } from './pages/FinancesPage'
import { CreateClubPage } from './pages/CreateClubPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/squad" element={<SquadPage />} />
            <Route path="/match/pre" element={<PreMatchPage />} />
            <Route path="/match/post" element={<PostMatchPage />} />
            <Route path="/competition" element={<CompetitionPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/finances" element={<FinancesPage />} />
            <Route path="/create-club" element={<CreateClubPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
