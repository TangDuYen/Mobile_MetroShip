import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [role, setRole] = useState('');
  const [stationName, setStationName] = useState('');
  const [stationId, setStationId] = useState('');
  const [staffId, setStaffId] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      const authData = await AsyncStorage.getItem('auth');
      const parsed = JSON.parse(authData);
      const role = parsed?.staffAssignments?.[0]?.assignedRole || '';
      const stationId = parsed?.staffAssignments?.[0]?.stationId || '';
      const staffId = parsed?.id || '';

      setRole(role);
      setStationId(stationId);
      setStaffId(staffId);

      const res = await fetch(`${API_URL}stations/${stationId}`);
      const result = await res.json();
      setStationName(result.stationNameVi);
    };
    fetchUserData();
  }, []);

  const handleNavigate = (action) => {
    navigation.navigate('Scan', {
      action,
      staffId,
      stationId,
    });
  };
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear(); // Xóa toàn bộ AsyncStorage
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Xin chào: {role}</Text>
      <Text style={styles.station}>Trạm: {stationName}</Text>

      <TouchableOpacity style={styles.button} onPress={() => handleNavigate('Lên hàng')}>
        <Text style={styles.buttonText}>Lên hàng</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => handleNavigate('Xuống hàng')}>
        <Text style={styles.buttonText}>Xuống hàng</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => handleNavigate('Vào kho')}>
        <Text style={styles.buttonText}>Vào kho</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 60 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  station: { fontSize: 16, marginBottom: 24 },
  button: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutButton: {
  backgroundColor: '#FF3B30',
  marginTop: 24,
},

});

