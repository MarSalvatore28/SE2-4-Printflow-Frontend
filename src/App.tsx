import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginPage from './app/Auth/pages/LoginPage';
import { Layout } from './components/layout/Layout';

// ===========================================================================
// LINEAS DE CADA EQUIPO
// Cada equipo SOLO quita el "// " del inicio de las lineas que terminan con
// su etiqueta (por ejemplo "// [B-F1]"). La etiqueta del final se queda.
// ===========================================================================

import MaquinasPage from './app/Maquinas/pages/Maquinas.page'; // [A-F1]
import ClientesPage from './app/Clientes/pages/Clientes.page'; // [B-F1]
import AreaPage from './app/Area/pages/Area.page'; // [B-F1]
import AsignacionMaquinaPage from './app/maquina_asignacion/pages/AsignacionMaquina.page'; // [C-F1]
import { SocketProvider } from './context/SocketContext'; // [A-F2]
import { NotificationProvider } from './context/NotificationContext'; // [A-F2]
import NotificacionesPage from './app/Notificaciones/pages/NotificacionesPage'; // [B-F2]
import InformesPage from './app/Informes/pages/Informes.page'; // [B-F3]

// Notificaciones en tiempo real. En la Fase 2 el Equipo A BORRA la linea que
// termina en "[BORRAR en A-F2]" y quita el "// " de la que termina en "[A-F2]".
const ProveedorNotificaciones = ({ children }: { children: ReactNode }) => <SocketProvider><NotificationProvider>{children}</NotificationProvider></SocketProvider>; // [A-F2]

const rutas: { path: string; element: ReactNode }[] = [
  { path: 'maquinas', element: <MaquinasPage /> }, // [A-F1]
  { path: 'clientes', element: <ClientesPage /> }, // [B-F1]
  { path: 'area', element: <AreaPage /> }, // [B-F1]
  { path: 'asignaciones', element: <AsignacionMaquinaPage /> }, // [C-F1]
  { path: 'notificaciones', element: <NotificacionesPage /> }, // [B-F2]
  { path: 'informes', element: <InformesPage /> }, // [B-F3]
];

const Inicio = () => (
  <div>
    <h2 className="text-2xl font-bold mb-2">PrintFlow</h2>
    <p>Selecciona un módulo en el menú lateral.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ProveedorNotificaciones>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Inicio />} />
                {rutas.map((r) => (
                  <Route key={r.path} path={r.path} element={r.element} />
                ))}
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProveedorNotificaciones>
    </AuthProvider>
  );
}

export default App;
