import { BrowserRouter, Routes, Route, unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { AuthProvider } from './services/auth';

function App() {
  const history = createBrowserHistory();
  
  return (
    <HistoryRouter history={history}>
      <AuthProvider>
        <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HistoryRouter>
  );
}

export default App;