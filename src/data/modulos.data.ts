import type { SvgIconComponent } from '@mui/icons-material';

// ===========================================================================
// MENU LATERAL. Cada equipo SOLO quita el "// " del inicio de las lineas que
// terminan con su etiqueta (por ejemplo "// [B-F1]"). La etiqueta se queda.
// ===========================================================================

import PrintIcon from '@mui/icons-material/Print'; // [A-F1]
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'; // [B-F1]
import FactoryIcon from '@mui/icons-material/Factory'; // [B-F1]
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'; // [C-F1]
import NotificationsIcon from '@mui/icons-material/Notifications'; // [B-F2]
import DescriptionIcon from '@mui/icons-material/Description'; // [B-F3]
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'; // [B-F4]

export interface Modulo {
  name: string;
  path: string;
  icon: SvgIconComponent;
  // Roles que ven el módulo en el menú y pueden abrirlo. Sin roles = todos.
  roles?: string[];
}

export const modulos: Modulo[] = [
  { name: 'Clientes', path: '/clientes', icon: PeopleAltIcon }, // [B-F1]
  { name: 'Área', path: '/area', icon: FactoryIcon }, // [B-F1]
  { name: 'Máquinas', path: '/maquinas', icon: PrintIcon }, // [A-F1]
  { name: 'Asignaciones', path: '/asignaciones', icon: AssignmentIndIcon }, // [C-F1]
  { name: 'Informes', path: '/informes', icon: DescriptionIcon }, // [B-F3]
  { name: 'Notificaciones', path: '/notificaciones', icon: NotificationsIcon }, // [B-F2]
  { name: 'Usuarios', path: '/usuarios', icon: ManageAccountsIcon, roles: ['admin'] }, // [B-F4]
];
