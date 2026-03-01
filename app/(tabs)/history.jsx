// import React from 'react';
// import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Feather } from '@expo/vector-icons';
// import { useHistory } from '@/src/hooks/useHistory';
// import { BillCard } from '@/src/components/history/BillCard';

// export default function HistoryScreen() {
//   const { 
//     activeTab, setActiveTab, 
//     searchTerm, setSearchTerm, 
//     filteredData, loading 
//   } = useHistory();

//   return (
//     <SafeAreaView className="flex-1 bg-bg">
//       {/* Header */}
//       <View className="px-6 py-4">
//         <Text className="text-primaryText text-3xl font-black">History</Text>
//         <Text className="text-secondaryText font-medium text-sm mt-1">Manage your records</Text>
//       </View>

//       {/* Top Toggle (Bills vs Estimates) */}
//       <View className="px-6 mb-4">
//         <View className="bg-card/40 p-1.5 rounded-2xl flex-row border border-secondary/10">
//           <Pressable 
//             onPress={() => setActiveTab('Bills')}
//             className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'Bills' ? 'bg-primaryText shadow-md' : 'bg-transparent'}`}
//           >
//             <Text className={`font-black text-sm uppercase tracking-widest ${activeTab === 'Bills' ? 'text-accent' : 'text-secondaryText'}`}>
//               Invoices
//             </Text>
//           </Pressable>

//           <Pressable 
//             onPress={() => setActiveTab('Estimates')}
//             className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'Estimates' ? 'bg-primaryText shadow-md' : 'bg-transparent'}`}
//           >
//             <Text className={`font-black text-sm uppercase tracking-widest ${activeTab === 'Estimates' ? 'text-accent' : 'text-secondaryText'}`}>
//               Estimates
//             </Text>
//           </Pressable>
//         </View>
//       </View>

//       {/* Search Bar */}
//       <View className="px-6 mb-4">
//         <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl border border-card shadow-sm">
//           <Feather name="search" size={20} color="#bfb5a8" />
//           <TextInput 
//             placeholder="Search customer or bill number..." 
//             placeholderTextColor="#bfb5a8"
//             value={searchTerm}
//             onChangeText={setSearchTerm}
//             className="flex-1 ml-3 text-primaryText font-bold"
//           />
//           {searchTerm.length > 0 && (
//             <Pressable onPress={() => setSearchTerm('')}>
//               <Feather name="x-circle" size={18} color="#bfb5a8" />
//             </Pressable>
//           )}
//         </View>
//       </View>

//       {/* List */}
//       {loading ? (
//         <View className="flex-1 justify-center items-center">
//           <ActivityIndicator size="large" color="#1f2617" />
//         </View>
//       ) : (
//         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
//           {filteredData.length === 0 ? (
//             <View className="items-center justify-center mt-20 opacity-40">
//               <Feather name="file-text" size={48} color="#393f35" />
//               <Text className="text-primaryText font-bold mt-4">
//                 No {activeTab.toLowerCase()} found
//               </Text>
//             </View>
//           ) : (
//             filteredData.map(bill => (
//               <BillCard key={bill._id} bill={bill} />
//             ))
//           )}
//         </ScrollView>
//       )}
//     </SafeAreaView>
//   );
// }

import React from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useHistory } from '@/src/hooks/useHistory';
import { BillCard } from '@/src/components/history/BillCard';

export default function HistoryScreen() {
  const { 
    activeTab, setActiveTab, 
    searchTerm, setSearchTerm, 
    filteredData, loading 
  } = useHistory();

  // Hardware Switch Toggle logic (Deferring the heavy list render)
  const handleToggle = (isEstimates) => {
    setTimeout(() => {
      setActiveTab(isEstimates ? 'Estimates' : 'Bills');
    }, 0);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-primaryText text-3xl font-black">History</Text>
        <Text className="text-secondaryText font-medium text-sm mt-1">Manage your records</Text>
      </View>

      {/* Top Toggle - NATIVE HARDWARE SWITCH */}
      <View className="px-6 mb-4">
        <View className="bg-card/40 p-4 rounded-2xl flex-row justify-between items-center border border-secondary/10">
          <Text className={`font-black text-sm uppercase tracking-widest ${activeTab === 'Bills' ? 'text-accent' : 'text-secondaryText'}`}>
            Invoices
          </Text>
          
          <Switch
            trackColor={{ false: '#393f35', true: '#e5fc01' }}
            thumbColor={activeTab === 'Estimates' ? '#1f2617' : '#bfb5a8'}
            ios_backgroundColor="#393f35"
            onValueChange={handleToggle}
            value={activeTab === 'Estimates'}
          />
          
          <Text className={`font-black text-sm uppercase tracking-widest ${activeTab === 'Estimates' ? 'text-accent' : 'text-secondaryText'}`}>
            Estimates
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-4">
        <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl border border-card shadow-sm">
          <Feather name="search" size={20} color="#bfb5a8" />
          <TextInput 
            placeholder="Search customer or bill number..." 
            placeholderTextColor="#bfb5a8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 ml-3 text-primaryText font-bold"
          />
          {searchTerm.length > 0 && (
            <Pressable onPress={() => setSearchTerm('')} className="p-1 active:opacity-50">
              <Feather name="x-circle" size={18} color="#bfb5a8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1f2617" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          {filteredData.length === 0 ? (
            <View className="items-center justify-center mt-20 opacity-40">
              <Feather name="file-text" size={48} color="#393f35" />
              <Text className="text-primaryText font-bold mt-4">
                No {activeTab.toLowerCase()} found
              </Text>
            </View>
          ) : (
            filteredData.map(bill => (
              <BillCard key={bill._id} bill={bill} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}