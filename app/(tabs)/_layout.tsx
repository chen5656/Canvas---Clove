import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, Text } from 'react-native';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {name}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1E',
          borderTopColor: '#2A2A2E',
          height: Platform.OS === 'web' ? 60 : 80,
          paddingBottom: Platform.OS === 'web' ? 8 : 24,
        },
        tabBarActiveTintColor: '#32D583',
        tabBarInactiveTintColor: '#6B6B70',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shop',
          tabBarIcon: ({ focused }) => <TabIcon name="🛒" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => <TabIcon name="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {},
  tabLabel: {
    fontSize: 18,
  },
  tabLabelActive: {},
});
