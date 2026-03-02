// import { useAuth } from '../context/AuthContext';

// export function usePermission() {
//   const { user } = useAuth();

//   // module = 'customers', 'products', 'bills', or 'khata'
//   // action = 'create', 'read', 'update', or 'delete'
//   const can = (module, action) => {
//     // 1. If no user is loaded yet, deny access
//     if (!user) return false;

//     // 2. Owners can do absolutely everything
//     if (user.role === 'Owner') return true;

//     // 3. Staff members must have the specific permission set to true
//     return !!user.permissions?.[module]?.[action];
//   };

//   return { can };
// }

// // how to use it 

// // import React from 'react';
// // import { View, Text, Pressable } from 'react-native';
// // import { Feather } from '@expo/vector-icons';
// // import { usePermission } from '@/src/hooks/usePermission'; // 1. Import the hook

// // export default function CustomerScreen() {
// //   const { can } = usePermission(); // 2. Initialize it

// //   return (
// //     <View className="flex-1 bg-bg">
// //       {/* ... your customer list code ... */}

// //       {/* 3. Wrap the Add Button in the condition */}
// //       {can('customers', 'create') && (
// //         <Pressable 
// //           className="absolute bottom-10 right-8 bg-primaryText w-16 h-16 rounded-full items-center justify-center shadow-lg"
// //         >
// //           <Feather name="plus" size={30} color="#e5fc01" />
// //         </Pressable>
// //       )}
      
// //       {/* Example for an Edit button inside a list item */}
// //       {/* {can('customers', 'update') && (
// //           <Pressable><Feather name="edit" /></Pressable>
// //         )} 
// //       */}
      
// //     </View>
// //   );
// // }

// alternate method for hiding ui from staff