import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import React, { useEffect, useState } from 'react';
import shipmentMapping, { parcelStatusMap } from './../config/mapping';
import { useNavigation, useRoute } from '@react-navigation/native';

import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OrderDetailsScreen() {
  const route = useRoute();
  const { trackingCode, staffId, stationId, action } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trains, setTrains] = useState([]);
  const [metroLines, setMetroLines] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        // Lấy shipment (đã có luôn parcels bên trong)
        const res = await fetch(`${API_URL}shipments/${trackingCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setOrder(result?.data);
      } catch (err) {
        Alert.alert('Lỗi', 'Không lấy được chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    const fetchMetroLines = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_URL}metro-lines/dropdown`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setMetroLines(result?.data || []);
      } catch {
        Alert.alert('Lỗi', 'Không thể kết nối server');
      }
    };

    const fetchTrains = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_URL}metro-trains`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setTrains(result?.data?.items || []);
      } catch {
        Alert.alert('Lỗi', 'Không thể kết nối server');
      }
    };

    fetchDetails();
    fetchMetroLines();
    fetchTrains();
  }, [trackingCode]);

  const handleLostParcel = (parcelCode) => {
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn báo mất kiện ${parcelCode} không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            const token = await AsyncStorage.getItem('token');

            const currentTrainId = order?.shipmentItineraries[0].trainId;
            const trainCode = trains.find((t) => t.id === currentTrainId)?.trainCode;

            let endpoint = '';
            if (action === 'Lên hàng') {
              endpoint = `${API_URL}parcels/staff/loading/${parcelCode}/${trainCode}?isLost=true`;
            } else if (action === 'Xuống hàng') {
              endpoint = `${API_URL}parcels/staff/unloading/${parcelCode}/${trainCode}?isLost=true`;
            } else if (action === 'Vào kho') {
              endpoint = `${API_URL}parcels/staff/awaiting-delivery/${parcelCode}?isLost=true`;
            }

            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
              Alert.alert('Thành công', `Đã báo mất thành công cho kiện ${parcelCode}`);
            } else {
              Alert.alert('Lỗi', `Không thể thực hiện ${action}`);
            }
          },
        }
      ]
    );
  };

  const handleParcelAction = async (parcelCode) => {
    try {
      const token = await AsyncStorage.getItem('token');

      const currentTrainId = order?.shipmentItineraries[0].trainId;
      const trainCode = trains.find((t) => t.id === currentTrainId)?.trainCode;

      let endpoint = '';
      if (action === 'Lên hàng') {
        endpoint = `${API_URL}parcels/staff/loading/${parcelCode}/${trainCode}?isLost=false`;
      } else if (action === 'Xuống hàng') {
        endpoint = `${API_URL}parcels/staff/unloading/${parcelCode}/${trainCode}?isLost=false`;
      } else if (action === 'Vào kho') {
        endpoint = `${API_URL}parcels/staff/awaiting-delivery/${parcelCode}?isLost=false`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = await res.text();
      }

      if (res.ok) {
        Alert.alert('Thành công', `${action} thành công cho kiện ${parcelCode}`);
      } else {
        Alert.alert('Lỗi', data?.message || JSON.stringify(data) || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi mạng', err.message);
    }
  };


  if (loading) return <ActivityIndicator size="large" />;
  if (!order) return <Text>Không tìm thấy đơn hàng.</Text>;

  const currentTrainId = order?.shipmentItineraries?.[0]?.trainId;
  const currentTrainCode = trains.find((t) => t.id === currentTrainId)?.trainCode || null;

  return (
    <View style={{ padding: 16, marginTop: 20 }}>
      <View style={{ marginBottom: 12 }}>
        <Button title="Quay lại" onPress={() => navigation.navigate('Home')} />
      </View>

      {/* Thông tin đơn */}
      <View style={styles.shipmentItem}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
          Mã đơn: {order.trackingCode}
        </Text>
        <Text style={styles.parcelInfo}>Tổng chi phí: {order.totalCostVnd.toLocaleString()} VND</Text>
        <Text style={styles.parcelInfo}>Tổng khối lượng: {order.totalWeightKg.toLocaleString()} kg</Text>
        <Text style={styles.parcelInfo}>Tổng thể tích: {order.totalVolumeM3} m³</Text>
        <Text style={styles.parcelInfo}>Người gửi: {order.senderName}</Text>
        <Text style={styles.parcelInfo}>SĐT: {order.senderPhone}</Text>
        <Text style={styles.parcelInfo}>Người nhận: {order.recipientName}</Text>
        <Text style={styles.parcelInfo}>SĐT: {order.recipientPhone}</Text>
        <Text style={styles.parcelInfo}>Trạm gửi: {order.departureStationName}</Text>
        <Text style={styles.parcelInfo}>Trạm nhận: {order.destinationStationName}</Text>
        <Text style={styles.parcelInfo}>Trạm hiện tại: {order.currentStationName}</Text>
        <Text style={styles.parcelInfo}>Trạng thái: {shipmentMapping[order.shipmentStatus]}</Text>
      </View>

      {/* Danh sách kiện */}
      {order.parcels?.length > 0 && (
        <FlatList
          data={order.parcels}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.parcelItem}>
              <Text style={styles.parcelCode}>{item.parcelCode}</Text>
              <Text>Khối lượng: {item.weightKg} kg</Text>
              <Text>Thể tích: {item.volumeCm3} cm³</Text>
              <Text>Giá: {item.priceVnd.toLocaleString()} VND</Text>
              <Text>Trạng thái: {parcelStatusMap[item.status]}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.customButton, { backgroundColor: '#007BFF' }]}
                  // onPress={() => handleParcelAction(item.parcelCode)}
                  onPress={() =>
                    navigation.navigate('ScanParcel', {
                      action,
                      trainCode: currentTrainCode,
                    })
                  }
                >
                  <Text style={styles.customButtonText}>{action}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.customButton, { backgroundColor: 'red' }]}
                  onPress={() => handleLostParcel(item.parcelCode)}
                >
                  <Text style={styles.customButtonText}>Báo mất</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shipmentItem: {
    marginBottom: 10,
  },
  parcelItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  parcelCode: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  parcelInfo: {
    marginBottom: 4,
  },
  customButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  customButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
