import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const colors = {
  black: '#000000',
  white: '#FFFFFF',
  zinc900: '#18181B',
  zinc800: '#27272A',
  zinc700: '#3F3F46',
  zinc500: '#71717A',
  zinc400: '#A1A1AA',
  fuchsia600: '#C026D3',
  fuchsia500: '#D946EF',
  indigo700: '#4338CA',
  indigo600: '#4F46E5',
  indigo500: '#6366F1',
  cyan400: '#22D3EE',
  cyan500: '#06B6D4',
  green500: '#22C55E',
  amber500: '#F59E0B',
  orange500: '#F97316',
  yellow400: '#FACC15',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const typography = {
  'heading-1': {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  'heading-2': {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  'heading-3': {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  'heading-4': {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.1,
  },
  'body-lg': {
    fontSize: 16,
    fontWeight: '600',
  },
  'body-md': {
    fontSize: 14,
    fontWeight: '500',
  },
  'body-sm': {
    fontSize: 12,
    fontWeight: '500',
  },
  'caption': {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  'micro': {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  absolute: {
    position: 'absolute',
  },
  full: {
    width: '100%',
    height: '100%',
  },
  wFull: {
    width: '100%',
  },
  hFull: {
    height: '100%',
  },
  roundedFull: {
    borderRadius: borderRadius.full,
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  neonShadow: {
    shadowColor: colors.fuchsia500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
  },
  pulse: {
    opacity: 0.8,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 40, // Add safe area for status bar
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green500,
    borderWidth: 2,
    borderColor: colors.black,
  },
  userInfo: {
    gap: 4,
  },
  username: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  college: {
    color: colors.zinc400,
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 70, 239, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.3)',
  },
  streakText: {
    color: colors.fuchsia500,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bellButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.black,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 24,
    position: 'relative',
    height: 80,
  },
  navLeft: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
    justifyContent: 'flex-start',
    paddingLeft: 16,
  },
  navRight: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
    justifyContent: 'flex-end',
    paddingRight: 16,
  },
  addButtonContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -28 }, { translateY: -28 }],
    zIndex: 10,
    width: 56,
    height: 56,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.fuchsia600,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.fuchsia500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
});

export const screenWidth = width;
export const screenHeight = height;