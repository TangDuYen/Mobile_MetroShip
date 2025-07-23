import { StyleSheet, Text, View } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';

export default function App() {
  return (
    <>
      <AppNavigator />
      {/* <HomeScreen /> */}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
