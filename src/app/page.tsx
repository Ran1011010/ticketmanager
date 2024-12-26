"use client";

import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contract: "",
    issue: "",
  });

  const [ loading, setLoading ] = useState(false);
  const [ message, setMessage ] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit =  async(e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/submit-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setFormData({ name: "", email: "", issue: "", contract: "" });
      } else {
        const error = await response.json();
        setMessage(error.message || "Hubo un error al enviar el ticket.");
      }
    } catch (error) {
      setMessage("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
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
            name="contract"
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
        <button 
          type="submit" 
          className={`p-2 rounded ${loading ? "bg-gray-400" : "bg-blue-500 text-white"}`}
          >
          { loading ? "Enviando..." : "Enviar" }
        </button>
      </form>
    </div>
  );
}
