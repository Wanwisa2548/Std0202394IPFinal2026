import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from './screens/DashboardScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import ProfileScreen from './screens/ProfileScreen';
import CuteIcon from './CuteIcons';
import { colors } from './theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS = { Dashboard: 'home', Analytics: 'chart', Profile: 'user' };

/** Floating white tab bar; the active tab gets a soft blue pill with its label. */
function CuteTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, focused && styles.tabFocused, pressed && styles.pressed]}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
                <CuteIcon name={TAB_ICONS[route.name]} size={focused ? 28 : 24} />
              </View>
              <Text style={[styles.label, focused && styles.labelFocused]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CuteTabBar {...props} />}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.background, paddingHorizontal: 14, paddingTop: 8 },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 8px 24px rgba(15,30,61,0.14)',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 18 },
  tabFocused: { backgroundColor: colors.primaryLight },
  pressed: { transform: [{ scale: 0.95 }] },
  iconWrap: { width: 40, height: 34, alignItems: 'center', justifyContent: 'center' },
  iconWrapFocused: { transform: [{ translateY: -1 }] },
  label: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 1 },
  labelFocused: { color: colors.primary, fontWeight: '700' },
});
