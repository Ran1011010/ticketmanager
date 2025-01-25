
import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

const Visor: React.FC = () => {
    const [pdfUrl, setPdfUrl] = useState('/Educacion_y_Uso_Correcto_NAS.pdf'); 

    const defaultLayout = defaultLayoutPlugin();

    return (
        <div className="container mx-auto px-4">            
            <div style={{ height: '750px', border: '1px solid #ccc' }}>
                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.6.172/build/pdf.worker.min.js`}>
                    <Viewer
                        fileUrl={pdfUrl}
                        plugins={[defaultLayout]} 
                    />
                </Worker>
            </div>
        </div>
    );
};

export default Visor;
