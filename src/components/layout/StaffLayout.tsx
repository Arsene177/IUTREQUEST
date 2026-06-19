'use client';

import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
                    {/* pb-20 sur mobile = espace pour la bottom nav */}
                    {children}
                </main>
            </div>
        </div>
    );
}