import { useState } from "react";
import axios from "axios";
import { BASE_URL } from '../constants/apiUrl';
import { useLocalSearchParams, useRouter } from "expo-router";


const PasswordResetConfirm = () => {
    const { uidb64, token } = useLocalSearchParams(); 
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${BASE_URL}/users/reset/${uidb64}/${token}/`, { password });
            setMessage("Password reset successful. Redirecting...");
            setTimeout(() => router.push("/LoginScreen"), 3000);
        } catch (error) {
            setMessage("Error resetting password.");
        }
    };

    return (
        <div>
            <h2>Enter New Password</h2>
            <form onSubmit={handleSubmit}>
                <input 
                    type="password" 
                    placeholder="New password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <button type="submit">Reset Password</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default PasswordResetConfirm;
