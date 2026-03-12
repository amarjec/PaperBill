import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import GlobalHeader from '../../src/components/GlobalHeader';
import { usePermission } from '@/src/hooks/usePermission';
import { useKhataList } from '@/src/hooks/useKhataList';

export default function TabLayout() {
  const { can } = usePermission();
  const { debtors } = useKhataList(); 

  // Determine if the tab should be shown
  const showLedgerTab = can('khata', 'read') && debtors?.length > 0;
  return (
    <Tabs
      screenOptions={{
        header: () => <GlobalHeader />,
        
        // --- TRADITIONAL, PRACTICAL FOOTER ---
        tabBarStyle: {
          backgroundColor: '#1f2617', // Solid dark primaryText background
          borderTopWidth: 4, // Adds a subtle top border line
          borderTopColor: '#393f35', // secondaryText color for the border
          height: Platform.OS === 'ios' ? 95 : 75, // Taller on iOS for the home bar
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          elevation: 0, // Removes Android shadow for a completely flat, grounded look
        },
        
        // --- CLEAR ACTIVE/INACTIVE STATES ---
        tabBarActiveTintColor: '#e5fc01', // Bright accent color for the active tab
        tabBarInactiveTintColor: '#bfb5a8', // Muted secondary color for inactive tabs
        
        // --- TYPOGRAPHY ---
        tabBarLabelStyle: {
          fontWeight: '900',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 4,
        },
        
        // Un-mount screens when switching to free up phone memory
        unmountOnBlur: true, 
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
       <Tabs.Screen
        name="ledger"
        options={{
          title: 'Ledger',
          href: showLedgerTab ? '/ledger' : null,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="book-open" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Bills',
          // href: can('bills', 'read') ? '/history' : null,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="list" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}