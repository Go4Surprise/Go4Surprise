import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { BASE_URL } from "../constants/apiUrl";
import { Ionicons } from "@expo/vector-icons";
import { TextField } from "@mui/material";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() - 18))
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
    surname?: string;
    email?: string;
    phone?: string;
    terms?: string;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateFields = () => {
    const validations = [
      {
        field: "username",
        value: username,
        message: "El nombre de usuario es obligatorio",
      },
      {
        field: "password",
        value: password,
        message: "La contraseña es obligatoria",
      },
      {
        field: "confirmPassword",
        value: confirmPassword,
        message: "La confirmación de la contraseña es obligatoria",
      },
      { field: "name", value: name, message: "El nombre es obligatorio" },
      {
        field: "surname",
        value: surname,
        message: "El apellido es obligatorio",
      },
      { field: "email", value: email, message: "El correo es obligatorio" },
    ];

    let newErrors: Record<string, string> = {};

    validations.forEach(({ field, value, message }) => {
      if (typeof field === "string" && typeof message === "string" && !value) {
        Object.assign(newErrors, { [field]: message });
      }
    });

    // Check terms acceptance
    if (!acceptedTerms) {
      newErrors.terms =
        "Debes aceptar la política de privacidad y condiciones de uso";
    }

    const nameRegex = /^[A-Za-z]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]+$/;

    if (name && !nameRegex.test(name)) {
      newErrors.name =
        "El nombre no puede contener números ni caracteres especiales.";
    }
    if (surname && !nameRegex.test(surname)) {
      newErrors.surname =
        "El apellido no puede contener números ni caracteres especiales.";
    }
    if (password && password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (email && !emailRegex.test(email)) {
      newErrors.email = "El correo electrónico no es válido.";
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "El correo electrónico no es válido";
    }
    if (phone && !phoneRegex.test(phone)) {
      newErrors.phone = "El teléfono solo puede contener números.";
    }

    if (confirmPassword && confirmPassword !== password) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (phone && phone.length > 0 && !/^\d{9}$/.test(phone)) {
      newErrors.phone = "El teléfono debe tener 9 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUsernameExists = async () => {
    setErrorMessage(null);
    try {
      const response = await axios.get(
        `${BASE_URL}/users/check_username/${username}`
      );
      return response.data.exists;
    } catch (error) {
      setErrorMessage("Error al verificar el nombre de usuario.");
      return false;
    }
  };

  const handleRegister = async () => {
    const fieldsValid = validateFields();
    if (!fieldsValid) return;

    const userExists = await checkUsernameExists();
    if (userExists) {
      setErrors((prev) => ({
        ...prev,
        username: "El nombre de usuario ya está en uso",
      }));
      return;
    }

    setErrorMessage(null);

    const dateFormatted =
      birthdate.getFullYear() +
      "-" +
      String(birthdate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(birthdate.getDate()).padStart(2, "0");

    try {
      const response = await axios.post(`${BASE_URL}/users/register/`, {
        username,
        password,
        name,
        surname,
        email,
        phone,
        birthdate: dateFormatted,
      });

      const { access, refresh, user_id, id } = response.data;

      // Guardar tokens y redirigir automáticamente
      await AsyncStorage.setItem("accessToken", access);
      await AsyncStorage.setItem("refreshToken", refresh);
      await AsyncStorage.setItem("userId", user_id);
      await AsyncStorage.setItem("id", id);

      Alert.alert("¡Bienvenido!", "Tu cuenta ha sido creada con éxito.");
      router.push("/LoginScreen");
    } catch (error) {
      console.log(error);
      if (axios.isAxiosError(error)) {
        const serverError = error.response?.data;
        if (serverError?.username) {
          setErrors((prev) => ({ ...prev, username: serverError.username[0] }));
        } else if (serverError?.non_field_errors) {
          setErrorMessage(serverError.non_field_errors[0]);
        } else {
          setErrorMessage("Error al hacer el registro. Intenta más tarde.");
        }
      } else {
        setErrorMessage("Error desconocido.");
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/LoginScreen")}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
        />

        <View style={styles.card}>
          <Text style={styles.title}>Crear Cuenta</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre de usuario"
            value={username}
            onChangeText={setUsername}
          />
          {errors.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}

          <View style={{ width: "100%", position: "relative" }}>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <View style={{ width: "100%", position: "relative" }}>
            <TextInput
              style={styles.input}
              placeholder="Confirmar Contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={name}
            onChangeText={setName}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Apellido"
            value={surname}
            onChangeText={setSurname}
          />
          {errors.surname && (
            <Text style={styles.errorText}>{errors.surname}</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          {/* Selector de fecha nativo */}
          <TextField
            label="Fecha de Nacimiento"
            name="birthdate"
            type="date"
            fullWidth
            style={{ marginTop: "2%" }}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              max: new Date(
                new Date().setFullYear(new Date().getFullYear() - 18)
              )
                .toISOString()
                .split("T")[0], // Fecha mínima (18 años atrás)
            }}
            // Usar un valor seguro para el campo
            value={
              birthdate && !isNaN(birthdate.getTime())
                ? birthdate.toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => {
              try {
                // Verificar si el valor es válido antes de actualizar el estado
                const dateStr = e.target.value;
                if (dateStr) {
                  const dateValue = new Date(dateStr);
                  // Verificar que la fecha sea válida antes de actualizar el estado
                  if (!isNaN(dateValue.getTime())) {
                    setBirthdate(dateValue);
                  }
                } else {
                  // Si el campo está vacío, establecer una fecha por defecto o null
                  setBirthdate(new Date(
                    new Date().setFullYear(new Date().getFullYear() - 18)
                  ));
                }
              } catch (error) {
                console.error("Error al procesar la fecha:", error);
                // No actualizar el estado si hay un error
              }
            }}
          />

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setAcceptedTerms(!acceptedTerms);
              }}
              style={styles.checkbox}
            >
              <Ionicons
                name={acceptedTerms ? "checkbox-outline" : "square-outline"}
                size={24}
                color="#1877F2"
              />
            </TouchableOpacity>
            <Text style={styles.termsText}>
              He leído y acepto la{" "}
              <Text
                style={styles.link}
                onPress={() =>
                  router.push({
                    pathname: "/PoliticaPrivacidad",
                    params: { from: "register" },
                  })
                }
              >
                Política de Privacidad
              </Text>{" "}
              y las{" "}
              <Text
                style={styles.link}
                onPress={() =>
                  router.push({
                    pathname: "/CondicionesUso",
                    params: { from: "register" },
                  })
                }
              >
                Condiciones de Uso
              </Text>
              .
            </Text>
          </View>
          {errors.terms && (
            <Text style={[styles.errorText, { width: "100%", marginTop: 5 }]}>
              {errors.terms}
            </Text>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={() => void handleRegister()}
          >
            <Text style={styles.buttonText}>Registrarse</Text>
          </TouchableOpacity>

          <Text
            style={styles.loginText}
            onPress={() => router.push("/LoginScreen")}
          >
            ¿Ya tienes cuenta?{" "}
            <Text style={styles.loginLink}>Inicia sesión</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyeIcon: {
    position: "absolute",
    right: 10,
    top: "30%",
    transform: [{ translateY: -11 }],
    padding: 4,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#F4F4F4",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 20,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1877F2",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    backgroundColor: "#F9F9F9",
    marginBottom: 6,
  },
  dateContainer: {
    width: "100%",
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    backgroundColor: "#F9F9F9",
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  button: {
    backgroundColor: "#1877F2",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginText: {
    marginTop: 16,
    fontSize: 14,
    color: "#606770",
  },
  loginLink: {
    color: "#1877F2",
    fontWeight: "bold",
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
  },
  link: {
    color: "#1877F2",
    textDecorationLine: "underline",
  },
});
