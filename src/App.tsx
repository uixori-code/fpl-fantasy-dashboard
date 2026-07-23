import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import MyTeam from './pages/MyTeam';
import Statistics from './pages/Statistics';
import Fixtures from './pages/Fixtures';
import TopManagers from './pages/TopManagers';
import Transfers from './pages/Transfers';
import Watchlist from './pages/Watchlist';
import MiniLeague from './pages/MiniLeague';
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
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/mini-league" element={<MiniLeague />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
