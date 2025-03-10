import React, { useState } from "react";
import { Card, CardContent, TextField, Button, Typography } from "@mui/material";

interface Reserva {
  nombre: string;
  email: string;
  telefono: string;
  experiencia: string;
}

export default function RegisterBooking() {
  const [reserva, setReserva] = useState<Reserva>({
    nombre: "",
    email: "",
    telefono: "",
    experiencia: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReserva({ ...reserva, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const reservas: Reserva[] = JSON.parse(localStorage.getItem("reservas") || "[]");
    reservas.push(reserva);
    localStorage.setItem("reservas", JSON.stringify(reservas));
    alert("Reserva realizada con éxito!");
    setReserva({ nombre: "", email: "", telefono: "", experiencia: "" });
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="w-full max-w-md p-6 bg-white shadow-lg rounded-2xl">
        <CardContent>
          <Typography variant="h4" component="h2" gutterBottom>
            Reserva tu experiencia
          </Typography>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <TextField
                id="nombre"
                label="Nombre"
                type="text"
                name="nombre"
                value={reserva.nombre}
                onChange={handleChange}
                required
                fullWidth
              />
            </div>
            <div>
              <TextField
                id="email"
                label="Email"
                type="email"
                name="email"
                value={reserva.email}
                onChange={handleChange}
                required
                fullWidth
              />
            </div>
            <div>
              <TextField
                id="telefono"
                label="Teléfono"
                type="tel"
                name="telefono"
                value={reserva.telefono}
                onChange={handleChange}
                required
                fullWidth
              />
            </div>
            <div>
              <TextField
                id="experiencia"
                label="Experiencia"
                type="text"
                name="experiencia"
                value={reserva.experiencia}
                onChange={handleChange}
                required
                fullWidth
              />
            </div>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Reservar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}