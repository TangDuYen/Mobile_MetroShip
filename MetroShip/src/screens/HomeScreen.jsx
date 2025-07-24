import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';

import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import shipmentMapping from './../config/mapping';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [stationId, setStationId] = useState('');
  const [role, setRole] = useState('');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stationName, setStationName] = useState('');
  const [staffId, setStaffId] = useState('');
  const navigation = useNavigation();


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const authData = await AsyncStorage.getItem('auth');
        const parsed = JSON.parse(authData);

        const staffRole = parsed?.staffAssignments?.[0]?.assignedRole || '';
        const staffStation = parsed?.staffAssignments?.[0]?.stationId || '';
        const staffId = parsed?.id || '';

        setRole(staffRole);
        setStationId(staffStation);
        setStaffId(staffId);

        fetchShipments(staffStation);
        fetchStationName(staffStation);
      } catch (err) {
        console.error('Auth parse error:', err);
      }
    };
    const fetchStationName = async (stationId) => {
      try {
        const res = await fetch(`${API_URL}stations/${stationId}`);
        const result = await res.json();
        setStationName(result.stationNameVi);
      } catch (err) {
        console.error('Fetch station name failed:', err);
      }
    }
    fetchUserData();
  }, []);

  const fetchShipments = async (stationId) => {
    try {
      const res = await fetch(
        `${API_URL}shipments?PageSize=1000&DepartureStationId=${stationId}`
      );
      const result = await res.json();
      const items = result?.data?.items || [];
      setOrders(items);
      setFilteredOrders(items);
    } catch (err) {
      console.error('Fetch shipments failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = orders.filter((item) =>
      item.code?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredOrders(filtered);
  };
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('auth');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('stationId');
      navigation.navigate('Login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };


  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>Mã đơn: {item.trackingCode}</Text>
      <Text style={styles.itemSubText}>Trạng thái: {shipmentMapping[item.shipmentStatus]}</Text>
      <Text style={styles.itemSubText}>Trạm gửi: {item.departureStationName}</Text>
      <Text style={styles.itemSubText}>Trạm nhận: {item.destinationStationName}</Text>
      <Text style={styles.itemSubText}>Người gửi: {item.senderName}</Text>
      <Text style={styles.itemSubText}>SĐT: {item.senderPhone}</Text>
      <Text style={styles.itemSubText}>Người nhận: {item.recipientName}</Text>
      <Text style={styles.itemSubText}>SĐT: {item.recipientPhone}</Text>
      <Text style={styles.itemSubText}>Tổng chi phí: {item.totalCostVnd} VND</Text>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('Scan', {
            trackingCode: item.trackingCode,
            staffId,
            stationId,
          })
        }
        style={{
          backgroundColor: '#0066CC',
          padding: 10,
          borderRadius: 6,
          marginVertical: 10,
          alignItems: 'center',
        }}
      >
        <Text style={styles.scanButtonText}>Quét QR</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.rightHeader}>Hello {role}</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.leftHeader}>Trạm hiện tại: {stationName}</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm theo mã đơn hàng..."
        value={search}
        onChangeText={handleSearch}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0066CC" />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    padding: 16,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  leftHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  rightHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 40,
    marginBottom: 12,
  },
  item: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#212121',
    fontWeight: 'bold',
  },
  itemSubText: {
    fontSize: 14,
    color: '#555',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    color: '#777',
  },
  scanButtonText: {
    color: '#fff',
  },
  logoutButton: {
    marginLeft: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
