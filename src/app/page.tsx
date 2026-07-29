"use client";

import Image from "next/image";
import tpfLogo from '../../public/images/tpfing.png'
import { useState } from "react";
import TicketToast from "./components/ticketToast";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

export default function Home() {
  const initializeErrors = () => ({
    // name: "",
    email: "",
    contract: "",
    type: "",
    issue: "",
    priority: "",
  });

  const initializeFormData = () => ({
    // name: "",
    email: "",
    contract: "",
    type: "",
    issue: "",
    priority: "",
  });

  const [formData, setFormData] = useState(initializeFormData());
  const [errors, setErrors] = useState(initializeErrors());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const validateFields = () => {
    const newErrors = initializeErrors();
    let isValid = true;

    /* if (!formData.name.trim()) {
       newErrors.name = "El nombre es obligatorio.";
       isValid = false;
     } else if (formData.name.length < 5 || formData.name.length > 50) {
       newErrors.name = "El nombre es muy corto o muy largo.";
       isValid = false;
     }*/

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio.";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) 
      || formData.email === 'soporte@tpfingenieria.cl') {
      newErrors.email = "El correo electrónico no es válido.";
      isValid = false;
    } else if (!/^[^\s@]+@(tpfingenieria\.cl|tpfingenieria\.com)$/.test(formData.email)) {
      newErrors.email = "El correo electrónico debe ser de dominio @tpfingenieria.cl o @tpfingenieria.com.";
      isValid = false;
    }

    if (formData.contract && ![
          "ITO-L7", 
          "L7t5y6", 
          "TyC-L7", 
          "EFE-NOS", 
          "VT", 
          "administrativos",
          "EFE-BAR",
          "EFE-RD",
          "MT-L9", 
          "TyC-L9",
          "EFE-PAN-2",
          "EFE-MeliBatuco",
          "PyT-L9"
        ].includes(formData.contract)) {
      newErrors.contract = "El contrato seleccionado no es válido.";
      isValid = false;
    }

    if (formData.type && !["incidencia", "solicitud"].includes(formData.type)) {
      newErrors.type = "El tipo seleccionado no es válido.";
      isValid = false;
    }

    if (!formData.issue.trim()) {
      newErrors.issue = "La descripción de la incidencia es obligatoria.";
      isValid = false;
    } else if (formData.issue.length < 10 || formData.issue.length > 500) {
      newErrors.issue = "La descripción debe tener entre 10 y 500 caracteres.";
      isValid = false;
    }

    /*  if (formData.priority && !["baja", "media", "alta"].includes(formData.priority)) {
        newErrors.priority = "La prioridad seleccionada no es válida.";
        isValid = false;
      }
    */
    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!validateFields()) {
      return; // Detiene el envío si hay errores
    }

    setLoading(true);

   {/*try {
      const response = await fetch("/api/submit-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Ticket enviado con éxito.');
        setFormData(initializeFormData()); // Reset usando la función

        // Limpia el mensaje después de 5 segundos
        setTimeout(() => setMessage(""), 5000);
      } else {
        const error = await response.json();
        setMessage(error.message || "Hubo un error al enviar el ticket.");
      }
    } catch (error) {
      setMessage("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }*/}
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
  
      if (file) {
        formDataToSend.append("image", file);
      }
  
      const response = await fetch("/api/submit-ticket", {
        method: "POST",
        body: formDataToSend,
      });
  
      if (response.ok) {
        const data = await response.json();
        setMessage("Ticket enviado con éxito.");
        setFormData(initializeFormData());
        setFile(null); 
        setTimeout(() => setMessage(""), 5000);
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
    <div className="min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center bg-gray-100">

        <div className="container max-w-2xl mx-auto p-4 mb-10">
          <div className="flex items-center justify-center">
            <Image src={tpfLogo} alt="TPF Ingeniería" className="rounded m-5" height={100} width={600}  />
          </div>
          <h1 className="text-3xl font-bold text-center mb-10 text-gray-700">Genera tu ticket de asistencia</h1>

          {/*<Question className="w-12 h-12 mx-auto" />*/}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/*<div>
            <label className="block font-medium">Nombre y Apellido</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>*/}
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
              <select
                name="contract"
                value={formData.contract}
                onChange={handleChange}
                className="border p-2 w-full"
                required
              >
                <option value="">Seleccione contrato</option>
                <option value="ITO-L7">Sistemas L7 y Extensión L6</option>
                <option value="L7t5y6">L7 tramo 5 y 6</option>
              { /*<option value="MT-OP">Metro Operacionales</option> */}
                <option value="TyC-L7">Talleres y Cocheras Metro L7</option>
                <option value="TyC-L9">Talleres y Cocheras Metro L9</option>
                <option value="MT-L9">Obras Previas Metro L9</option>
                <option value="PyT-L9">Pique y túneles Tramo 1AB L9</option>
               { /* <option value="EFE-NOS">EFE-NOS</option>*/}
                <option value="EFE-BAR">EFE-Barrancas</option>
                <option value="EFE-RD">EFE-Radio Comunicaciones</option>
                <option value="EFE-PAN-2">EFE PAN 2</option>
                <option value="EFE-MeliBatuco">EFE Melipilla Batuco</option>
                <option value="VT">Victoria Temuco</option>                                
                <option value="administrativos">Administrativos</option>
              </select>
              {errors.contract && <p className="text-red-500 text-sm">{errors.contract}</p>}
            </div>
            <div>
              <label className="block font-medium">Tipo</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="border p-2 w-full"
                required
              >
                <option value="">Seleccione un tipo</option>
                <option value="incidencia">Incidencia</option>
                <option value="solicitud">Solicitud</option>
              </select>
              {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
            </div>
            <div>
            {/*<label className="block font-medium">Nivel de Urgencia</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="border p-2 w-full"
            >
              <option value="">Seleccione urgencia</option>
              <option value="2">Baja</option>
              <option value="3">Media</option>
              <option value="5">Alta</option>
            </select>
            {errors.priority && <p className="text-red-500 text-sm">{errors.priority}</p>}*/}
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
              <input type="file" name="image" accept="image/*" onChange={handleFileChange} />
              {file && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Imagen seleccionada:</p>
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="mt-1 max-h-40 rounded border"
                />
              </div>
            )}
              {errors.issue && <p className="text-red-500 text-sm">{errors.issue}</p>}
            </div>
            <button
              type="submit"
              className={`p-2 rounded ${loading ? "bg-gray-400 text-black" : "bg-blue-500 text-white"} w-full`}
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
          {message && <TicketToast />}
        </div>
      </div>
      <Footer />
    </div>
  );
}
