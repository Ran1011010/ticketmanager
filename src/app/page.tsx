"use client";

import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contract: "",
    issue: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData); 
    alert("Formulario enviado (¡Falta conectar la lógica!)");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mesa de Atención Informática TPF</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Nombre</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Correo Electrónico</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Contrato/Oficina</label>
          <input
            type="text"
            name="name"
            value={formData.contract}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Descripción de la Incidencia</label>
          <textarea
            name="issue"
            value={formData.issue}
            onChange={handleChange}
            className="border p-2 w-full"
            rows={4}
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Enviar
        </button>
      </form>
    </div>
  );
}
