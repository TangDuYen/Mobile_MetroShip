import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';

import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Roboto: require('../../assets/fonts/Roboto-Regular.ttf'),
  });

  if (!fontsLoaded) return null;

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const res = await fetch(`${API_URL}auth/authentication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || 'Đăng nhập thất bại');
      }

      //Kiểm tra quyền "CargoLoader"
      const assignmentRoles = result?.staffAssignments?.map(s => s.assignedRole);
      const hasCargoRole = assignmentRoles?.includes('CargoLoader');

      if (!hasCargoRole) {
        Alert.alert(
          'Thông báo',
          'Bạn cần tài khoản nhân viên chuyển hàng (CargoLoader) để sử dụng.'
        );
        return;
      }

      //Lưu thông tin sau khi login thành công
      await AsyncStorage.setItem('auth', JSON.stringify(result));
      await AsyncStorage.setItem('token', result.token);
      await AsyncStorage.setItem('stationId', result.staffAssignments?.[0]?.stationId || '');

      navigation.replace('Home');

    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Lỗi', err.message || 'Không thể đăng nhập');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MetroShip</Text>

      <TextInput
        style={styles.input}
        placeholder="Tài khoản"
        placeholderTextColor="#999"
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        placeholderTextColor="#999"
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    color: '#0066CC',
    fontWeight: 'bold',
    marginBottom: 32,
    fontFamily: 'Inter',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontFamily: 'Roboto',
    fontSize: 16,
    color: '#212121',
  },
  button: {
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});
