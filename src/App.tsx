import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { SquadPage } from './pages/SquadPage'
import { PreMatchPage } from './pages/PreMatchPage'
import { PostMatchPage } from './pages/PostMatchPage'
import { CompetitionPage } from './pages/CompetitionPage'
import { TransfersPage } from './pages/TransfersPage'
import { FinancesPage } from './pages/FinancesPage'
import { CreateClubPage } from './pages/CreateClubPage'
import { MatchViewPage } from './pages/MatchViewPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/squad" element={<SquadPage />} />
              <Route path="/match/pre" element={<PreMatchPage />} />
              <Route path="/match/view" element={<MatchViewPage />} />
              <Route path="/match/post" element={<PostMatchPage />} />
              <Route path="/competition" element={<CompetitionPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/finances" element={<FinancesPage />} />
              <Route path="/create-club" element={<CreateClubPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
