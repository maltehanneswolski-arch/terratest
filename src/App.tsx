import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import { AppShell } from './components/ui/app-shell';

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
