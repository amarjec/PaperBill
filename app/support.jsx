import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SupportScreen() {
  const router = useRouter();

  const openEmail = () => {
    Linking.openURL('mailto:support.kachabill@gmail.com?subject=KachaBill App Support Request');
  };

  const openDialer = () => {
    Linking.openURL(`tel:${Platform.OS === 'ios' ? '+919685208320' : '+919685208320'}`);
  };

  const openWhatsApp = () => {
    Linking.openURL('whatsapp://send?phone=919685208320&text=Hi KachaBill Support, I need some help with the app.');
  };

  const ContactCard = ({ icon, title, subtitle, onPress, bg = 'bg-white', iconColor = '#1f2617', isAccent = false }) => (
    <Pressable 
      onPress={onPress}
      className={`${bg} p-5 rounded-[24px] border border-card flex-row items-center mb-4 active:opacity-70`}
      style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
    >
      <View className={`${isAccent ? 'bg-bg/20' : 'bg-bg'} w-12 h-12 rounded-full items-center justify-center mr-4 border border-card/50`}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className={`font-black text-[16px] ${isAccent ? 'text-accent' : 'text-primaryText'}`}>{title}</Text>
        <Text className={`font-bold text-[11px] mt-0.5 ${isAccent ? 'text-secondary/70' : 'text-secondaryText'}`}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={isAccent ? '#e5fc01' : '#bfb5a8'} />
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* ── Header ── */}
      <View className="px-6 py-4 flex-row items-center border-b border-card/50 pb-4">
        <Pressable onPress={() => router.back()} className="bg-card p-3 rounded-2xl mr-4 active:opacity-50">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>
        <View>
          <Text className="text-primaryText text-xl font-black tracking-tight">Help & Support</Text>
          <Text className="text-secondaryText text-[11px] font-bold mt-0.5">We are here to help you</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        
        {/* ── Hero Section ── */}
        <View className="items-center mb-10 mt-4">
          <View className="bg-accent/20 w-24 h-24 rounded-full items-center justify-center mb-5 border border-accent/30">
            <MaterialCommunityIcons name="headset" size={44} color="#eab308" />
          </View>
          <Text className="text-primaryText text-2xl font-black text-center mb-2">How can we help?</Text>
          <Text className="text-secondaryText text-center text-xs font-bold leading-5 px-4">
            Facing an issue with bills, staff access, or your Premium plan? Reach out to us directly.
          </Text>
        </View>

        {/* ── Contact Options ── */}
        <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Contact Us</Text>
        
        <ContactCard 
          icon="whatsapp" 
          title="Chat on WhatsApp" 
          subtitle="+91 9685208320 (Fastest Response)"
          onPress={openWhatsApp}
          bg="bg-[#1f2617]"
          iconColor="#e5fc01"
          isAccent={true}
        />
        
        <ContactCard 
          icon="phone-outline" 
          title="Call Support" 
          subtitle="+91 9685208320"
          onPress={openDialer}
        />
        
        <ContactCard 
          icon="email-outline" 
          title="Email Us" 
          subtitle="support.kachabill@gmail.com"
          onPress={openEmail}
        />

        <View className="mt-8 items-center opacity-40">
          <MaterialCommunityIcons name="shield-check" size={24} color="#393f35" />
          <Text className="text-primaryText font-bold text-[10px] mt-2">KachaBill Secure Support</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}