import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleRegister = () => {
        if (!username || !password || !name || !surname || !email || !phone) {
            alert('Todos los campos son obligatorios');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Correo electrónico no válido');
            return;
        }

        setLoading(true);

        fetch('http://localhost:8000/users/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                name: name,
                surname: surname,
                email: email,
                phone: phone,
            }),
        })
            .then(response => {
                setLoading(false);
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(text || 'Error en la solicitud');
                    });
                }
                return response.json();
            })
            .then(() => {
                alert('Registro exitoso');
                navigate('/');
            })
            .catch(error => {
                setLoading(false);
                alert(`Error en la solicitud: ${error.message}`);
                console.error('Error en la solicitud:', error);
            });
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Registro de Usuario</h1>
            <input
                style={styles.input}
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
            />
            <input
                style={styles.input}
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                style={styles.input}
                placeholder="Apellido"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
            />
            <input
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
            />
            <input
                style={styles.input}
                placeholder="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
            />
            {loading ? (
                <p>Cargando...</p>
            ) : (
                <button onClick={handleRegister}>Registrarse</button>
            )}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px',
    },
    title: {
        fontSize: '24px',
        marginBottom: '16px',
        textAlign: 'center',
    },
    input: {
        height: '40px',
        borderColor: 'gray',
        borderWidth: '1px',
        marginBottom: '12px',
        paddingHorizontal: '8px',
        width: '100%',
        maxWidth: '400px',
    },
};

export default RegisterScreen;