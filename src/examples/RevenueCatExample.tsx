// /**
//  * RevenueCat Integration Examples
//  * 
//  * This file demonstrates various ways to use RevenueCat in your app
//  */

// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { useSubscription, useOfferings, usePurchase, useEntitlement } from '../hooks/useRevenueCat';
// import { REVENUECAT_CONFIG } from '../config/revenuecat';
// import Paywall from '../components/Paywall';

// /**
//  * Example 1: Simple Subscription Check
//  * Shows how to check if user has an active subscription
//  */
// export function SubscriptionStatusExample() {
//   const { isActive, isPro, loading } = useSubscription();

//   if (loading) {
//     return <ActivityIndicator />;
//   }

//   return (
//     <View className="p-4">
//       <Text className="text-lg font-bold mb-2">Subscription Status</Text>
//       <Text>Active: {isActive ? 'Yes ✓' : 'No ✗'}</Text>
//       <Text>Pro User: {isPro ? 'Yes ✓' : 'No ✗'}</Text>
//     </View>
//   );
// }

// /**
//  * Example 2: Feature Gate
//  * Shows how to lock features behind a subscription
//  */
// export function PremiumFeatureExample() {
//   const { hasAccess, loading } = useEntitlement(REVENUECAT_CONFIG.entitlements.PRO);
//   const [showPaywall, setShowPaywall] = useState(false);

//   if (loading) {
//     return <ActivityIndicator />;
//   }

//   if (!hasAccess) {
//     return (
//       <View className="p-4 border border-gray-300 rounded-lg">
//         <Text className="text-lg font-bold mb-2">🔒 Premium Feature</Text>
//         <Text className="mb-4">Upgrade to Pro to unlock this feature</Text>
//         <TouchableOpacity
//           onPress={() => setShowPaywall(true)}
//           className="bg-black rounded-full py-3"
//         >
//           <Text className="text-white text-center font-semibold">Upgrade Now</Text>
//         </TouchableOpacity>

//         {showPaywall && (
//           <Paywall
//             onClose={() => setShowPaywall(false)}
//             onPurchaseSuccess={() => {
//               setShowPaywall(false);
//               Alert.alert('Success', 'You now have access to this feature!');
//             }}
//           />
//         )}
//       </View>
//     );
//   }

//   return (
//     <View className="p-4">
//       <Text className="text-lg font-bold mb-2">✨ Premium Feature</Text>
//       <Text>You have access to this premium feature!</Text>
//       {/* Your premium feature content here */}
//     </View>
//   );
// }

// /**
//  * Example 3: Subscription Plans Display
//  * Shows available subscription plans
//  */
// export function SubscriptionPlansExample() {
//   const { currentOffering, loading } = useOfferings();
//   const { purchase, purchasing } = usePurchase();

//   const handlePurchase = async (pkg: any) => {
//     try {
//       await purchase(pkg);
//       Alert.alert('Success', 'Thank you for subscribing!');
//     } catch (error: any) {
//       if (!error.userCancelled) {
//         Alert.alert('Error', 'Failed to complete purchase');
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <View className="p-4">
//         <ActivityIndicator />
//         <Text className="text-center mt-2">Loading plans...</Text>
//       </View>
//     );
//   }

//   if (!currentOffering) {
//     return (
//       <View className="p-4">
//         <Text>No subscription plans available</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView className="p-4">
//       <Text className="text-2xl font-bold mb-4">Choose Your Plan</Text>
//       {currentOffering.availablePackages.map((pkg) => (
//         <TouchableOpacity
//           key={pkg.identifier}
//           onPress={() => handlePurchase(pkg)}
//           disabled={purchasing}
//           className="mb-4 p-4 border-2 border-gray-300 rounded-xl"
//         >
//           <Text className="text-xl font-bold">{pkg.product.title}</Text>
//           <Text className="text-gray-600 mb-2">{pkg.product.description}</Text>
//           <Text className="text-2xl font-bold">{pkg.product.priceString}</Text>
//         </TouchableOpacity>
//       ))}
//     </ScrollView>
//   );
// }

// /**
//  * Example 4: Account Settings with Subscription Management
//  * Shows subscription info and management options
//  */
// export function SubscriptionSettingsExample() {
//   const { isActive, expirationDate, willRenew, productIdentifier, loading } = useSubscription();
//   const { restore, restoring } = usePurchase();
//   const [showPaywall, setShowPaywall] = useState(false);

//   const handleRestore = async () => {
//     try {
//       await restore();
//       Alert.alert('Success', 'Your purchases have been restored');
//     } catch (error) {
//       Alert.alert('Error', 'Failed to restore purchases');
//     }
//   };

//   if (loading) {
//     return <ActivityIndicator />;
//   }

//   return (
//     <ScrollView className="p-4">
//       <Text className="text-2xl font-bold mb-6">Subscription</Text>

//       {isActive ? (
//         <View className="bg-green-50 p-4 rounded-xl mb-4">
//           <Text className="text-lg font-bold text-green-800 mb-2">✓ Active Subscription</Text>
//           <Text className="text-green-700">Plan: {productIdentifier}</Text>
//           {expirationDate && (
//             <Text className="text-green-700">
//               {willRenew ? 'Renews' : 'Expires'}: {new Date(expirationDate).toLocaleDateString()}
//             </Text>
//           )}
//         </View>
//       ) : (
//         <View className="bg-gray-50 p-4 rounded-xl mb-4">
//           <Text className="text-lg font-bold mb-2">No Active Subscription</Text>
//           <TouchableOpacity
//             onPress={() => setShowPaywall(true)}
//             className="bg-black rounded-full py-3 mt-2"
//           >
//             <Text className="text-white text-center font-semibold">Upgrade to Pro</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <TouchableOpacity
//         onPress={handleRestore}
//         disabled={restoring}
//         className="border border-gray-300 rounded-full py-3 mb-3"
//       >
//         <Text className="text-center font-semibold">
//           {restoring ? 'Restoring...' : 'Restore Purchases'}
//         </Text>
//       </TouchableOpacity>

//       {showPaywall && (
//         <Paywall
//           onClose={() => setShowPaywall(false)}
//           onPurchaseSuccess={() => setShowPaywall(false)}
//         />
//       )}
//     </ScrollView>
//   );
// }

// /**
//  * Example 5: Limited Usage with Paywall
//  * Shows how to limit feature usage for free users
//  */
// export function LimitedUsageExample() {
//   const { isPro, loading } = useSubscription();
//   const [usageCount, setUsageCount] = useState(0);
//   const [showPaywall, setShowPaywall] = useState(false);
//   const FREE_LIMIT = 3;

//   const handleFeatureUse = () => {
//     if (isPro) {
//       // Unlimited access for pro users
//       Alert.alert('Success', 'Feature used! (Unlimited)');
//       return;
//     }

//     if (usageCount >= FREE_LIMIT) {
//       // Show paywall when limit reached
//       setShowPaywall(true);
//       return;
//     }

//     // Allow free usage
//     setUsageCount(usageCount + 1);
//     Alert.alert('Success', `Feature used! (${usageCount + 1}/${FREE_LIMIT} free uses)`);
//   };

//   if (loading) {
//     return <ActivityIndicator />;
//   }

//   return (
//     <View className="p-4">
//       <Text className="text-2xl font-bold mb-4">Limited Feature</Text>

//       {!isPro && (
//         <View className="bg-blue-50 p-3 rounded-lg mb-4">
//           <Text className="text-blue-800">
//             Free uses: {usageCount}/{FREE_LIMIT}
//           </Text>
//         </View>
//       )}

//       <TouchableOpacity
//         onPress={handleFeatureUse}
//         className="bg-black rounded-full py-3"
//       >
//         <Text className="text-white text-center font-semibold">Use Feature</Text>
//       </TouchableOpacity>

//       {showPaywall && (
//         <View className="mt-4">
//           <Text className="text-center text-gray-600 mb-4">
//             You've reached your free limit. Upgrade for unlimited access!
//           </Text>
//           <Paywall
//             onClose={() => setShowPaywall(false)}
//             onPurchaseSuccess={() => {
//               setShowPaywall(false);
//               setUsageCount(0);
//             }}
//           />
//         </View>
//       )}
//     </View>
//   );
// }

// /**
//  * Example 6: Complete Demo Screen
//  * Combines all examples into one screen
//  */
// export default function RevenueCatDemoScreen() {
//   const [activeExample, setActiveExample] = useState<string | null>(null);

//   const examples = [
//     { id: 'status', title: 'Subscription Status', component: SubscriptionStatusExample },
//     { id: 'feature', title: 'Premium Feature Gate', component: PremiumFeatureExample },
//     { id: 'plans', title: 'Subscription Plans', component: SubscriptionPlansExample },
//     { id: 'settings', title: 'Subscription Settings', component: SubscriptionSettingsExample },
//     { id: 'limited', title: 'Limited Usage', component: LimitedUsageExample },
//   ];

//   if (activeExample) {
//     const Example = examples.find(e => e.id === activeExample)?.component;
//     if (Example) {
//       return (
//         <View className="flex-1 bg-white">
//           <View className="p-4 border-b border-gray-200">
//             <TouchableOpacity onPress={() => setActiveExample(null)}>
//               <Text className="text-blue-600">← Back to Examples</Text>
//             </TouchableOpacity>
//           </View>
//           <ScrollView>
//             <Example />
//           </ScrollView>
//         </View>
//       );
//     }
//   }

//   return (
//     <ScrollView className="flex-1 bg-white">
//       <View className="p-6">
//         <Text className="text-3xl font-bold mb-2">RevenueCat Examples</Text>
//         <Text className="text-gray-600 mb-6">
//           Explore different ways to integrate subscriptions
//         </Text>

//         {examples.map((example) => (
//           <TouchableOpacity
//             key={example.id}
//             onPress={() => setActiveExample(example.id)}
//             className="mb-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
//           >
//             <Text className="text-lg font-semibold">{example.title}</Text>
//             <Text className="text-gray-600 mt-1">Tap to view example →</Text>
//           </TouchableOpacity>
//         ))}
//       </View>
//     </ScrollView>
//   );
// }

