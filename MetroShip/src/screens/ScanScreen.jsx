import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Camera } from 'expo-camera';
import { CameraView } from 'expo-camera';

export default function ScanScreen() {
  const route = useRoute();
  const { staffId, stationId, action } = route.params;

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const navigation = useNavigation();
  const scannedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data, bounds }) => {
    if (scannedRef.current) return;

    scannedRef.current = true;
    setScanned(true);
    setTrackingCode(data);

    Alert.alert("Mã đã quét", `Tracking Code: ${data}`, [
      {
        text: "Xem đơn hàng",
        onPress: () => {
          navigation.navigate('OrderDetails', {
            trackingCode: data,
            staffId,
            stationId,
            action,
          });
        },
      },
    ]);
  };

  const resetScan = () => {
    scannedRef.current = false;
    setScanned(false);
    setTrackingCode('');
  };

  if (hasPermission === null) return <Text>Đang kiểm tra quyền...</Text>;
  if (hasPermission === false) return <Text>Không có quyền truy cập camera</Text>;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      <View style={styles.scannerBox} />
      <View style={styles.overlay}>
        <Text style={styles.instruction}>Đưa mã QR vào khung</Text>
        <Text style={styles.meta}>Hành động: {action}</Text>
        {trackingCode !== '' && <Text style={styles.code}>Mã: {trackingCode}</Text>}
        {scanned && (
          <TouchableOpacity onPress={resetScan} style={styles.button}>
            <Text style={styles.buttonText}>Quét lại</Text>
          </TouchableOpacity>
        )}
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
  instruction: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  code: { fontSize: 16, color: '#FFC107', marginVertical: 4 },
  meta: { color: '#ccc', fontSize: 14, marginBottom: 12 },
  button: {
    marginTop: 10,
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 8,
  },
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
