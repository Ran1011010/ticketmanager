"use client";
import Footer from '../components/footer';
import Navbar from '../components/navbar';

const ResourcesPage: React.FC = () => {
    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="container mx-auto px-4">
                <h1 className="text-2xl font-bold my-4">Recursos</h1>
                <p>Uso de plataforma NAS</p>
            </div>
            <Footer />
        </div>
    );
};

export default ResourcesPage;
