"use client";

import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contract: "",
    issue: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    contract: "",
    issue: "",
  });

  const [ loading, setLoading ] = useState(false);
  const [ message, setMessage ] = useState("");

  const validateFields = () => {
    const newErrors = { name: "", email: "", contract: "", issue: "" };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
      isValid = false;
    }else if (formData.name.length < 5 || formData.name.length > 50) {
      newErrors.name = "El nombre es muy corto o muy largo";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio.";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El correo electrónico no es válido.";
      isValid = false;
    } else if (!/^[^\s@]+@(tpfingenieria\.cl|tpfingenieria\.com)$/.test(formData.email)) {
      newErrors.email = "El correo electrónico debe ser de dominio @tpfingenieria.cl o @tpfingenieria.com.";
      isValid = false;
    }
    

    if (!formData.contract.trim()) {
      newErrors.contract = "El contrato o la oficina es obligatorio.";
      isValid = false;
    }else if (formData.contract.length < 5 || formData.contract.length > 50) {
      newErrors.contract = "el nombre de la oficina o contrato es muy corto o muy largo";
      isValid = false;
    }

    if (!formData.issue.trim()) {
      newErrors.issue = "La descripción de la incidencia es obligatoria.";
      isValid = false;
    } else if (formData.issue.length < 10 || formData.issue.length > 500) {
      newErrors.issue = "La descripción debe tener entre 10 y 500 caracteres.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // Limpia errores al escribir
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!validateFields()) {
      return; // Detiene el envío si hay errores
    }

    setLoading(true);

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
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
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
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
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
          {errors.contract && <p className="text-red-500 text-sm">{errors.contract}</p>}
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
          {errors.issue && <p className="text-red-500 text-sm">{errors.issue}</p>}
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
