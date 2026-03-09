import { View, Text, StyleSheet } from 'react-native';

export default function MealPlanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Meal Plan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070B', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#6B6B70', fontSize: 18 },
});
