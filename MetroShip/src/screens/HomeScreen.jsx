import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';

import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [stationId, setStationId] = useState('');
  const [role, setRole] = useState('');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const authData = await AsyncStorage.getItem('auth');
        const parsed = JSON.parse(authData);

        const staffRole = parsed?.staffAssignments?.[0]?.assignedRole || '';
        const staffStation = parsed?.staffAssignments?.[0]?.stationId || '';

        setRole(staffRole);
        setStationId(staffStation);

        fetchShipments(staffStation);
      } catch (err) {
        console.error('Auth parse error:', err);
      }
    };

    fetchUserData();
  }, []);

  const fetchShipments = async (stationId) => {
    try {
      const res = await fetch(
        `${API_URL}/shipments?DepartureStationId=${stationId}`
      );
      const result = await res.json();
      setOrders(result);
      setFilteredOrders(result);
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

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>Mã đơn: {item.code}</Text>
      <Text style={styles.itemSubText}>Trạng thái: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.leftHeader}>Trạm hiện tại: {stationId}</Text>
        <Text style={styles.rightHeader}>Hello {role}</Text>
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm theo mã đơn hàng..."
        value={search}
        onChangeText={handleSearch}
      />

      {/* Loading */}
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
});
