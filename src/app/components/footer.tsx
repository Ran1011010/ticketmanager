import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Footer: React.FC = () => {
    return (
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <span className="text-sm">2025 TPF Ingeniería Chile.</span>
          <div className="flex space-x-4 ">
            <span className="text-sm">Creado por</span>
            <Link href="https://github.com/Ran1011010" aria-label="GitHub" className="hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.234c-3.338.727-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.084-.729.084-.729 1.205.084 1.838 1.234 1.838 1.234 1.07 1.835 2.809 1.305 3.495.997.108-.775.419-1.305.763-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.467-2.381 1.235-3.221-.135-.305-.54-1.528.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3.005-.405c1.02.005 2.04.14 3.005.405 2.28-1.552 3.3-1.23 3.3-1.23.645 1.648.24 2.87.12 3.176.765.84 1.23 1.91 1.23 3.221 0 4.61-2.805 5.62-5.475 5.92.435.375.825 1.112.825 2.245v3.322c0 .315.21.694.825.575C20.565 22.092 24 17.6 24 12.297c0-6.627-5.373-12-12-12z" />
              </svg>
            </Link>
          </div>
        </div>
      </footer>
    );
}

export default Footer;