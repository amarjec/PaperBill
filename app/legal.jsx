import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LegalScreen() {
  const router = useRouter();

  const Section = ({ title, children, icon }) => (
    <View className="bg-white p-5 rounded-[24px] border border-card mb-5 shadow-sm">
      <View className="flex-row items-center mb-4 border-b border-card/60 pb-3">
        <View className="bg-bg p-2 rounded-xl mr-3">
          <MaterialCommunityIcons name={icon} size={18} color="#1f2617" />
        </View>
        <Text className="text-primaryText text-lg font-black">{title}</Text>
      </View>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );

  const P = ({ children }) => (
    <Text className="text-secondaryText text-xs font-bold leading-5">{children}</Text>
  );

  const Bullet = ({ children }) => (
    <View className="flex-row items-start pr-4">
      <View className="w-1.5 h-1.5 rounded-full bg-primaryText mt-2 mr-3" />
      <Text className="text-secondaryText text-xs font-bold leading-5">{children}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* ── Header ── */}
      <View className="px-6 py-4 flex-row items-center border-b border-card/50 pb-4">
        <Pressable onPress={() => router.back()} className="bg-card p-3 rounded-2xl mr-4 active:opacity-50">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>
        <View>
          <Text className="text-primaryText text-xl font-black tracking-tight">Legal & Privacy</Text>
          <Text className="text-secondaryText text-[11px] font-bold mt-0.5">Last updated: March 2026</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        
        {/* ── 1. Privacy Policy ── */}
        <Section title="Privacy Policy" icon="shield-lock-outline">
          <P>KachaBill is committed to protecting your privacy and ensuring your business data is completely secure. We strictly adhere to Play Store developer policies.</P>
          <Text className="text-primaryText text-[11px] font-black uppercase tracking-widest mt-2">Data Collection & Use</Text>
          <Bullet>We collect your mobile number, business name, and Google email to create and authenticate your account.</Bullet>
          <Bullet>Customer data, khata ledgers, and inventory added by you are stored securely on our servers solely to provide the app's functionality to you across devices.</Bullet>
          <Bullet>We do <Text className="text-red-500 font-black">NOT</Text> sell, rent, or share your business data, customer details, or transaction history with any third parties or advertisers.</Bullet>
          <Text className="text-primaryText text-[11px] font-black uppercase tracking-widest mt-2">Data Deletion</Text>
          <Bullet>You may request the complete deletion of your account and all associated data by contacting our support team. Data will be purged within 30 days of the request.</Bullet>
        </Section>

        {/* ── 2. Terms of Use ── */}
        <Section title="Terms of Service" icon="file-document-outline">
          <P>By using KachaBill, you agree to the following terms:</P>
          <Bullet>You are responsible for maintaining the confidentiality of your account credentials and staff PINs.</Bullet>
          <Bullet>The app is provided to assist with standard billing and ledger management. We do not act as financial, tax, or legal advisors.</Bullet>
          <Bullet>Any abuse of the platform, including generating fraudulent invoices or illegal activities, will result in immediate account suspension.</Bullet>
        </Section>

        {/* ── 3. Payments & Refunds (Crucial for Play Store) ── */}
        <Section title="Payments & Refund Policy" icon="credit-card-outline">
          <P>KachaBill offers Premium features via Razorpay secure payment gateway.</P>
          <Text className="text-primaryText text-[11px] font-black uppercase tracking-widest mt-2">One-Time Payments Only</Text>
          <Bullet>We offer 1-Month and 1-Year Premium plans. All payments processed via Razorpay are strictly <Text className="text-primaryText font-black">one-time payments</Text>.</Bullet>
          <Bullet>KachaBill <Text className="text-primaryText font-black">does not support auto-debit</Text> or recurring subscriptions. You will never be charged automatically without your active consent when a plan expires.</Bullet>
          <Text className="text-primaryText text-[11px] font-black uppercase tracking-widest mt-2">Cancellations & Refunds</Text>
          <Bullet>Because our plans are one-time purchases, they cannot be cancelled mid-term for a pro-rated refund.</Bullet>
          <Bullet>If a transaction fails but money is deducted from your bank, the amount is automatically refunded by your bank within 5-7 business days.</Bullet>
          <Bullet>For payment disputes or technical issues regarding Premium unlocking, please contact support.kachabill@gmail.com within 48 hours of the transaction.</Bullet>
        </Section>

        {/* ── Contact Info inside Legal ── */}
        <View className="mt-4 items-center">
          <Text className="text-secondaryText text-xs font-bold text-center mb-1">
            For legal inquiries or support, contact us at:
          </Text>
          <Text className="text-primaryText text-sm font-black mb-1">support.kachabill@gmail.com</Text>
          <Text className="text-primaryText text-sm font-black">+91 9685208320</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}