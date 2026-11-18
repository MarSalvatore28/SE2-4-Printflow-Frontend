import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export const Layout = () => {
    return (
        <div className="flex h-screen w-full overflow-hidden text-text font-sans bg-gray-50 relative">
            <Sidebar />
            <main className="flex-1 h-full p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};