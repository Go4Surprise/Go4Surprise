import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { BASE_URL } from "../constants/apiUrl";
import { Ionicons } from "@expo/vector-icons";

const PasswordResetConfirm = () => {
    const { uidb64, token } = useLocalSearchParams(); 
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async () => {
        setError("");
        setSuccessMessage("");

        if (!password.trim()) {
            setError("Por favor, introduce una nueva contraseña.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        try {
            await axios.post(`${BASE_URL}/users/reset/${uidb64}/${token}/`, {
                password,
                confirm_password: confirmPassword,
            });
            setSuccessMessage("Contraseña restablecida correctamente. Redirigiendo...");
            setTimeout(() => router.push("/LoginScreen"), 3000);
        } catch (error) {
            setError("No se pudo restablecer la contraseña. Inténtalo de nuevo.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Restablecer Contraseña</Text>
            <Text style={styles.textInfo}>Introduce tu nueva contraseña para continuar.</Text>

            {/* Campo de contraseña */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Nueva contraseña"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => { setShowPassword(!showPassword); }}
                >
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Campo de confirmar contraseña */}
            <Text style={styles.textInfo}>Confirme su nueva contraseña.</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Confirmar contraseña"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => { setShowConfirmPassword(!showConfirmPassword); }}
                >
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={() => { void handleSubmit() }}>
                <Text style={styles.buttonText}>Restablecer</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F4F4F4",
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1877F2",
        marginBottom: 10,
    },
    textInfo: {
        fontSize: 14,
        color: "#606770",
        textAlign: "center",
        marginBottom: 10,
    },
    inputContainer: {
        width: "100%",
        maxWidth: 400,
        position: "relative",
        marginBottom: 12,
    },
    input: {
        width: "100%",
        padding: 14,
        borderWidth: 1,
        borderColor: "#CCC",
        borderRadius: 8,
        backgroundColor: "#F9F9F9",
    },
    eyeIcon: {
        position: "absolute",
        right: 10,
        top: "35%",
        transform: [{ translateY: -12 }],
        padding: 4,
    },
    errorText: {
        color: "red",
        fontSize: 14,
        marginBottom: 10,
    },
    successText: {
        color: "green",
        fontSize: 14,
        marginBottom: 10,
    },
    button: {
        backgroundColor: "#1877F2",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        width: "100%",
        maxWidth: 400,
        marginTop: 10,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default PasswordResetConfirm;
