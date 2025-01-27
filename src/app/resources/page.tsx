"use client";

import Footer from '../components/footer';
import Navbar from '../components/navbar';
import Visor from '../components/visor';

const ResourcesPage: React.FC = () => {
    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="container mx-auto px-4">
                <hr className="mt-6" />
                <h1 className="text-3xl font-bold my-4 text-center" >Educación de la Nube TPF</h1>
                <hr className="my-6" />
                <Visor />
            </div>
            <Footer />
        </div>
    );
};

export default ResourcesPage;
