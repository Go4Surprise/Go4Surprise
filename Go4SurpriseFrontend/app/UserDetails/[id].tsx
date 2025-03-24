import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, 
    ActivityIndicator, Alert, TextInput, Switch,
    useWindowDimensions, ScrollView 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/apiUrl';

type User = {
    id: number;
    username: string;
    email: string;
    is_superuser: boolean;
    is_staff: boolean;
    name: string;
    surname: string;
    phone: string;
};

export default function UserDetails() {
    const { id } = useLocalSearchParams();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<User>>({});
    
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    useEffect(() => {
        void checkAdminStatus();
        void fetchUserDetails();
    }, [id]);

    const checkAdminStatus = async () => {
        const isAdmin = await AsyncStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            Alert.alert('Acceso denegado', 'No tienes permisos para acceder a esta sección.');
            router.replace('/HomeScreen');
        }
    };

    const fetchUserDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await axios.get(`${BASE_URL}/users/admin/detail/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            setUser(response.data);
            setEditData(response.data);
            setLoading(false);
        } catch (error) {
            setError('Error al cargar los datos del usuario');
            setLoading(false);
            console.error('Error fetching user details:', error);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = await AsyncStorage.getItem('accessToken');
            await axios.put(
                `${BASE_URL}/users/admin/update/${id}/`, 
                editData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            
            // Update the user data after successful save
            setUser({...user, ...editData} as User);
            setIsEditing(false);
            Alert.alert('Éxito', 'Usuario actualizado correctamente');
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el usuario');
            console.error('Error updating user:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        Alert.alert(
            "Confirmar eliminación",
            "¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive",
                    onPress:() => { void(async () => {
                        try {
                            const token = await AsyncStorage.getItem('accessToken');
                            await axios.delete(`${BASE_URL}/users/admin/delete/${id}/`, {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                            });
                            
                            Alert.alert('Éxito', 'Usuario eliminado correctamente');
                            router.replace('/AdminUserPanel');
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar el usuario');
                            console.error('Error deleting user:', error);
                        }
        })();}
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1877F2" />
            </View>
        );
    }

    if (error || !user) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error || 'Usuario no encontrado'}</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.push('/AdminUserPanel')}>
                    <Text style={styles.buttonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.content, isMobile ? styles.contentMobile : styles.contentDesktop]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Detalles del Usuario</Text>
                    <View style={styles.headerButtons}>
                        {!isEditing ? (
                            <TouchableOpacity style={styles.editButton} onPress={() => { setIsEditing(true); }}>
                                <Text style={styles.buttonText}>Editar</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setIsEditing(false);
                                        setEditData(user);
                                    }}
                                >
                                    <Text style={styles.buttonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.saveButton, saving && styles.disabledButton]}
                                    onPress={async() => {await handleSave}}
                                    disabled={saving}
                                >
                                    <Text style={styles.buttonText}>
                                        {saving ? 'Guardando...' : 'Guardar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Nombre de usuario:</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={editData.username}
                                onChangeText={(text) => { setEditData({...editData, username: text}); }}
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{user.username}</Text>
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Email:</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={editData.email}
                                onChangeText={(text) => { setEditData({...editData, email: text}); }}
                                keyboardType="email-address"
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{user.email}</Text>
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Teléfono:</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={editData.phone}
                                onChangeText={(text) => { setEditData({...editData, phone: text}); }}
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{user.phone || 'No especificado'}</Text>
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Nombre:</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={editData.name}
                                onChangeText={(text) => { setEditData({...editData, name: text}); }}
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{user.name || 'No especificado'}</Text>
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Apellidos:</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={editData.surname}
                                onChangeText={(text) => { setEditData({...editData, surname: text}); }}
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{user.surname || 'No especificado'}</Text>
                        )}
                    </View>

                    <View style={styles.switchFieldGroup}>
                        <Text style={styles.fieldLabel}>Administrador:</Text>
                        {isEditing ? (
                            <Switch
                                value={!!editData.is_superuser}
                                onValueChange={(value) => {setEditData({
                                    ...editData, 
                                    is_superuser: value,
                                    // If user becomes admin, they also need staff permissions
                                    is_staff: value ? true : editData.is_staff
                                })}}
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{user.is_superuser ? 'Sí' : 'No'}</Text>
                        )}
                    </View>

                    <View style={styles.switchFieldGroup}>
                        <Text style={styles.fieldLabel}>Miembro del personal:</Text>
                        {isEditing ? (
                            <Switch
                                value={!!editData.is_staff}
                                onValueChange={(value) => { setEditData({...editData, is_staff: value}); }}
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{user.is_staff ? 'Sí' : 'No'}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteUser()}
                    >
                        <Text style={styles.buttonText}>Eliminar Usuario</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        paddingTop: 50,
    },
    contentDesktop: {
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
    },
    contentMobile: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
    },
    backButtonText: {
        color: '#1877F2',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerButtons: {
        flexDirection: 'row',
    },
    editActions: {
        flexDirection: 'row',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    fieldGroup: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E4E6EB',
        paddingBottom: 8,
    },
    switchFieldGroup: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E4E6EB',
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#65676B',
        marginBottom: 4,
    },
    fieldValue: {
        fontSize: 16,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        fontSize: 16,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    editButton: {
        backgroundColor: '#1877F2',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    saveButton: {
        backgroundColor: '#42B72A',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginLeft: 10,
    },
    cancelButton: {
        backgroundColor: '#808080',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    disabledButton: {
        opacity: 0.5,
    },
    deleteButton: {
        backgroundColor: '#E4144C',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginBottom: 10,
    },
});
