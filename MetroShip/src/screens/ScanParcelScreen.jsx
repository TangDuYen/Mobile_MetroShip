import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ScanParcelScreen() {
  const route = useRoute();
  const { action, trainCode, expectedParcelCode } = route.params || {};

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const navigation = useNavigation();
  const scannedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    return () => {
      scannedRef.current = false;
      setScanned(false);
      setLastCode('');
    };
  }, []);

  const resetScan = () => {
    scannedRef.current = false;
    setScanned(false);
    setLastCode('');
  };

  const callActionApi = async (parcelCode) => {
    try {
      const token = await AsyncStorage.getItem('token');

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
      try { data = await res.json(); } catch { data = await res.text(); }

      if (res.ok) {
        Alert.alert('Thành công', `${action} thành công cho kiện ${parcelCode}`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', data?.message || JSON.stringify(data) || `Không thể thực hiện ${action}`, [
          { text: 'OK', onPress: () => resetScan() },
        ]);
      }
    } catch (err) {
      Alert.alert('Lỗi mạng', err?.message || 'Không thể kết nối server', [
        { text: 'OK', onPress: () => resetScan() },
      ]);
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setScanned(true);
    setLastCode(data);

    if (expectedParcelCode && data !== expectedParcelCode) {
      Alert.alert('Sai mã kiện', `QR: ${data}\nMong đợi: ${expectedParcelCode}`, [
        { text: 'Quét lại', onPress: () => resetScan() },
      ]);
      return;
    }

    await callActionApi(data);
  };

  if (hasPermission === null) return <Text>Đang kiểm tra quyền...</Text>;
  if (hasPermission === false) return <Text>Không có quyền truy cập camera</Text>;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      <View style={styles.scannerBox} />

      <View style={styles.overlay}>
        <Text style={styles.instruction}>Đưa mã QR vào khung</Text>
        <Text style={styles.meta}>Hành động: {action}</Text>
        {!!trainCode && <Text style={styles.meta}>Tàu: {trainCode}</Text>}
        {!!lastCode && <Text style={styles.code}>Mã quét: {lastCode}</Text>}

        {scanned ? (
          <TouchableOpacity onPress={resetScan} style={styles.button}>
            <Text style={styles.buttonText}>Quét lại</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.button, { backgroundColor: '#B00020', marginTop: 10 }]}
        >
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instruction: { fontSize: 18, color: '#fff', fontWeight: '600', marginBottom: 8 },
  code: { fontSize: 16, color: '#FFC107', marginVertical: 4 },
  meta: { color: '#ccc', fontSize: 14, marginBottom: 4 },
  button: { marginTop: 10, backgroundColor: '#0066CC', padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  scannerBox: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    height: 220,
    borderWidth: 2,
    borderColor: '#00FF00',
    borderRadius: 12,
    zIndex: 10,
  },
});
