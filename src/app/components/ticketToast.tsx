import { useState } from "react";

const TicketToast = () => {
  const [showToast, setShowToast] = useState(false);

  const handleSendTicket = () => {

    console.log("Ticket enviado");
    setShowToast(true); 

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <div>      
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p>¡Ticket enviado correctamente!</p>
        </div>    
    </div>
  );
};

export default TicketToast;
