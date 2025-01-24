"use client";

import Footer from '../components/footer';
import Navbar from '../components/navbar';
import Visor from '../components/visor';

const ResourcesPage: React.FC = () => {
    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="container mx-auto px-4">
                <h1 className="text-2xl font-bold my-4">Recursos</h1>
                <Visor />
            </div>
            <Footer />
        </div>
    );
};

export default ResourcesPage;
