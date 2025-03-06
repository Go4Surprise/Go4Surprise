import React, { useState } from 'react';
import './Questionnaire.css';

function Questionnaire() {
  const [interests, setInterests] = useState({
    deporte: false,
    gastronomia: false,
    cine: false,
    aventura: false,
    musica: false,
    naturaleza: false,
    tecnologia: false,
    arte: false,
    bienestar: false,
    literatura: false,
  });

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setInterests({
      ...interests,
      [name]: checked,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(interests);
  };

  return (
    <div className="questionnaire-container">
      <h2>Descubre experiencias únicas</h2>
      <p>Selecciona tus intereses para recibir recomendaciones personalizadas.</p>
      <form className="questionnaire-form" onSubmit={handleSubmit}>
        {Object.keys(interests).map((interest) => (
          <label key={interest} className="questionnaire-option">
            <input
              type="checkbox"
              name={interest}
              checked={interests[interest]}
              onChange={handleChange}
            />
            <span className="custom-checkbox"></span>
            {interest.charAt(0).toUpperCase() + interest.slice(1)}
          </label>
        ))}
        <button type="submit">Descubrir experiencias</button>
      </form>
    </div>
  );
}

export default Questionnaire;
