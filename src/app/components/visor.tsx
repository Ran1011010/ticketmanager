
import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

const Visor: React.FC = () => {
    // Estado para manejar la URL del archivo PDF
    const [pdfUrl, setPdfUrl] = useState('/Educacion_y_Uso_Correcto_NAS.pdf'); // Cambia esto si tienes un archivo diferente

    // Plugin de diseño predeterminado de react-pdf-viewer
    const defaultLayout = defaultLayoutPlugin();

    return (
        <div className="container mx-auto px-4">            
            <div style={{ height: '750px', border: '1px solid #ccc' }}>
                {/* Worker es necesario para procesar PDFs en react-pdf */}
                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.6.172/build/pdf.worker.min.js`}>
                    <Viewer
                        fileUrl={pdfUrl}
                        plugins={[defaultLayout]} // Incluye barra de herramientas y diseño predeterminado
                    />
                </Worker>
            </div>
        </div>
    );
};

export default Visor;
