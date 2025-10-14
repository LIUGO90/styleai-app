import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { useOfferings, usePurchase, useSubscription } from '../hooks/useRevenueCat';
import { router } from 'expo-router';

interface PaywallProps {
  onClose?: () => void;
  onPurchaseSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export default function Paywall({
  onClose,
  onPurchaseSuccess,
  title = 'Unlock Premium Features',
  subtitle = 'Get unlimited access to all styling features',
}: PaywallProps) {
  const { currentOffering, loading: offeringsLoading } = useOfferings();
  const { purchase, restore, purchasing, restoring } = usePurchase();
  const { refresh: refreshSubscription } = useSubscription();
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    try {
      await purchase(selectedPackage);
      await refreshSubscription();

      Alert.alert(
        'Success!',
        'Your subscription is now active. Enjoy premium features!',
        [
          {
            text: 'OK',
            onPress: () => {
              onPurchaseSuccess?.();
              onClose?.();
            },
          },
        ]
      );
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', 'Unable to complete your purchase. Please try again.');
      }
    }
  };

  const handleRestore = async () => {
    try {
      const customerInfo = await restore();
      await refreshSubscription();

      const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0;

      if (hasActiveSubscription) {
        Alert.alert(
          'Success!',
          'Your purchases have been restored.',
          [
            {
              text: 'OK',
              onPress: () => {
                onPurchaseSuccess?.();
                onClose?.();
              },
            },
          ]
        );
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases for this account.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    }
  };

  const formatPrice = (pkg: PurchasesPackage): string => {
    return pkg.product.priceString;
  };

  const getPackageDescription = (pkg: PurchasesPackage): string => {
    const identifier = pkg.identifier;
    if (identifier.includes('annual') || identifier.includes('yearly')) {
      return 'Billed annually';
    } else if (identifier.includes('monthly')) {
      return 'Billed monthly';
    } else if (identifier.includes('lifetime')) {
      return 'One-time payment';
    }
    return 'Subscription';
  };

  const getPackageTitle = (pkg: PurchasesPackage): string => {
    const identifier = pkg.identifier;
    if (identifier.includes('annual') || identifier.includes('yearly')) {
      return 'Annual';
    } else if (identifier.includes('monthly')) {
      return 'Monthly';
    } else if (identifier.includes('lifetime')) {
      return 'Lifetime';
    }
    return pkg.product.title;
  };

  if (offeringsLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-4 text-gray-600">Loading plans...</Text>
      </View>
    );
  }

  if (!currentOffering || !currentOffering.availablePackages.length) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-xl font-bold mb-2">No Plans Available</Text>
        <Text className="text-gray-600 text-center mb-4">
          We're unable to load subscription plans at the moment.
        </Text>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            className="bg-black rounded-full px-6 py-3"
          >
            <Text className="text-white font-semibold">Close</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Select first package by default
  if (!selectedPackage && currentOffering.availablePackages.length > 0) {
    setSelectedPackage(currentOffering.availablePackages[0]);
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header */}
        <View className="items-center mb-8">
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              className="absolute right-0 top-0 p-2"
            >
              <Text className="text-2xl text-gray-600">×</Text>
            </TouchableOpacity>
          )}
          <Text className="text-3xl font-bold text-center mb-2">{title}</Text>
          <Text className="text-gray-600 text-center">{subtitle}</Text>
        </View>

        {/* Features */}
        <View className="mb-8">
          <FeatureItem text="Unlimited AI styling sessions" />
          <FeatureItem text="Advanced outfit recommendations" />
          <FeatureItem text="Personal style profile" />
          <FeatureItem text="Save unlimited lookbooks" />
          <FeatureItem text="Priority customer support" />
          <FeatureItem text="Early access to new features" />
        </View>

        {/* Packages */}
        <View className="mb-6">
          {currentOffering.availablePackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.identifier}
              onPress={() => setSelectedPackage(pkg)}
              className={`mb-3 p-4 rounded-2xl border-2 ${
                selectedPackage?.identifier === pkg.identifier
                  ? 'border-black bg-gray-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-lg font-bold mb-1">
                    {getPackageTitle(pkg)}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {getPackageDescription(pkg)}
                  </Text>
                </View>
                <Text className="text-xl font-bold">{formatPrice(pkg)}</Text>
              </View>
              {pkg.product.introPrice && (
                <View className="mt-2 bg-green-100 px-3 py-1 rounded-full self-start">
                  <Text className="text-green-800 text-xs font-semibold">
                    {pkg.product.introPrice.priceString} for {pkg.product.introPrice.period}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={purchasing || !selectedPackage}
          className={`rounded-full py-4 mb-3 ${
            purchasing || !selectedPackage ? 'bg-gray-400' : 'bg-black'
          }`}
        >
          {purchasing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Subscribe Now
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore Button */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={restoring}
          className="py-3"
        >
          {restoring ? (
            <ActivityIndicator color="#666" />
          ) : (
            <Text className="text-gray-600 text-center font-semibold">
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>

        {/* Legal */}
        <View className="mt-4 mb-8">
          <Text className="text-xs text-gray-500 text-center leading-5">
            By subscribing, you agree to our{' '}
            <Text className="underline">Terms of Service</Text> and{' '}
            <Text className="underline">Privacy Policy</Text>.
            {'\n\n'}
            Subscriptions automatically renew unless cancelled at least 24 hours before
            the end of the current period. You can manage or cancel your subscription
            in your App Store account settings.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-center mb-3">
      <View className="w-6 h-6 rounded-full bg-black items-center justify-center mr-3">
        <Text className="text-white font-bold">✓</Text>
      </View>
      <Text className="text-base flex-1">{text}</Text>
    </View>
  );
}

/**
 * Simple paywall modal component
 */
export function PaywallModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 bg-white z-50">
      <Paywall onClose={onClose} />
    </View>
  );
}

