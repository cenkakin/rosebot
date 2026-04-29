import { Route, Routes } from 'react-router'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { Layout } from './features/layout/Layout'
import { FeedPage } from './features/feed/FeedPage'
import { SavedPage } from './features/saved/SavedPage'
import { ClustersPage } from './features/clusters/ClustersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/clusters" element={<ClustersPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
