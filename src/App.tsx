import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import MyTeam from './pages/MyTeam';
import Statistics from './pages/Statistics';
import Fixtures from './pages/Fixtures';
import TopManagers from './pages/TopManagers';
import Settings from './pages/Settings';

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/my-team" element={<MyTeam />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/top-managers" element={<TopManagers />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
