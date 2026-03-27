import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewSubmission from './pages/NewSubmission'
import SubmissionDetail from './pages/SubmissionDetail'
import Team from './pages/Team'
import Settings from './pages/Settings'
import OAuthCallback from './pages/OAuthCallback'

export default function App() {
  return (
    <Routes>
      <Route path="/settings/callback/:platform" element={<OAuthCallback />} />

      <Route
        path="/"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/submit"
        element={
          <Layout>
            <NewSubmission />
          </Layout>
        }
      />
      <Route
        path="/submission/:id"
        element={
          <Layout>
            <SubmissionDetail />
          </Layout>
        }
      />
      <Route
        path="/team"
        element={
          <Layout>
            <Team />
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout>
            <Settings />
          </Layout>
        }
      />

      {/* Catch-all — send to dashboard */}
      <Route
        path="*"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
    </Routes>
  )
}
