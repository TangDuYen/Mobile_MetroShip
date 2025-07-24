import { useRoute } from '@react-navigation/native';

export default function ScanScreen() {
  const route = useRoute();
  const { trackingCode, staffId, stationId } = route.params;

  return (
    <>
    </>
  );
}
