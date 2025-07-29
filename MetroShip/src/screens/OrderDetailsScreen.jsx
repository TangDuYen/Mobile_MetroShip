import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import shipmentMapping from './../config/mapping';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

export default function OrderDetailsScreen() {
  const route = useRoute();
  const { trackingCode } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        //SHIPMENT
        const res = await fetch(`${API_URL}shipments/${trackingCode}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        const result = await res.json();
        const shipment = result?.data;

        //PARCELS
        const parcelsRes = await fetch(`${API_URL}parcels?PageSize=1000`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        const parcelsData = await parcelsRes.json();
        const allParcels = parcelsData?.data?.items || [];

        //FILTER PARCELS BY SHIPMENT ID
        const shipmentParcels = allParcels.filter(
          (p) => p.shipmentId === shipment.id
        );

        setOrder(shipment);
        setParcels(shipmentParcels);
      } catch (err) {
        Alert.alert('Lỗi', 'Không lấy được chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [trackingCode]);

  const handleAction = async (action) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log(token);

      const res = await fetch(`${API_URL}shipments/staff/update-status-at-station`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          trackingCode,
          currentStationId: order?.currentStationId,
        }),
      });
      if (res.ok) {
        Alert.alert('Thành công', `Đã thực hiện hành động: ${action}`);
      } else {
        Alert.alert('Lỗi', 'Không cập nhật được trạng thái');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối server');
    }
  };

  if (loading) return <ActivityIndicator size="large" />;

  if (!order) return <Text>Không tìm thấy đơn hàng.</Text>;

  return (
    <View style={{ padding: 16, marginTop: 20 }}>
      <View style={{ marginBottom: 12 }}>
        <Button title="Quay lại" onPress={() => navigation.navigate('Home')} />
      </View>
      <View style={styles.shipmentItem}>
        <Text style={{ fontWeight: 'bold', fontSize: 20 }}>Mã đơn: {order.trackingCode}</Text>
        <Text>Tổng chi phí: {order.totalCostVnd.toLocaleString()} VND</Text>
        <Text>Tổng khối lượng: {order.totalWeightKg.toLocaleString()} kg</Text>
        <Text>Tổng thể tích: {order.totalVolumeM3} m3</Text>
        <Text>Người gửi: {order.senderName}</Text>
        <Text>SĐT: {order.senderPhone}</Text>
        <Text>Người nhận: {order.recipientName}</Text>
        <Text>SĐT: {order.recipientPhone}</Text>
        <Text>Trạm gửi: {order.departureStationName}</Text>
        <Text>Trạm nhận: {order.destinationStationName}</Text>
        <Text>Trạm hiện tại: {order.currentStationName}</Text>
        <Text>Trạng thái: {shipmentMapping[order.shipmentStatus]}</Text>
      </View>
      {parcels.length > 0 && (
        <FlatList
          data={parcels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.parcelItem}>
              <Text style={styles.parcelCode}>{item.parcelCode}</Text>
              <Text>Khối lượng: {item.weightKg} kg</Text>
              <Text>Thể tích: {item.volumeCm3} cm³</Text>
              <Text>Giá: {item.priceVnd.toLocaleString()} VND</Text>
              <Text>Loại: {item.parcelCategory?.categoryName}</Text>
              <Text>Bảo hiểm: {item.insuranceFeeVnd.toLocaleString()} VND</Text>
            </View>
          )}
        />
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }}>
        <View style={{ flex: 1, marginHorizontal: 4 }}>
          <Button title="Lên hàng" onPress={() => handleAction('LOAD')} />
        </View>
        <View style={{ flex: 1, marginHorizontal: 4 }}>
          <Button title="Xuống hàng" onPress={() => handleAction('UNLOAD')} />
        </View>
        <View style={{ flex: 1, marginHorizontal: 4 }}>
          <Button title="Vào kho" onPress={() => handleAction('STORE')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shipmentItem: {
    marginBottom: 16,
  },
  parcelItem: {
    backgroundColor: '#f9f9f9',
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
});
