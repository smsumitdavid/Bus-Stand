import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  TouchableOpacityProps 
} from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline'; // primary=Black, secondary=Yellow
  loading?: boolean;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode; // Optional Icon support
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  containerStyle,
  textStyle,
  disabled,
  icon,
  ...props
}) => {
  
  // 🎨 Dynamic Styles based on Variant
  const getBackgroundColor = () => {
    if (disabled) return COLORS.gray;
    switch (variant) {
      case 'secondary': return COLORS.secondary; // Yellow
      case 'outline': return 'transparent';
      case 'primary': default: return COLORS.primary; // Black
    }
  };

  const getTextColor = () => {
    if (disabled) return '#FFF';
    switch (variant) {
      case 'secondary': return COLORS.primary; // Black text on Yellow
      case 'outline': return COLORS.primary;
      case 'primary': default: return '#FFFFFF'; // White text on Black
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: COLORS.primary
        },
        containerStyle
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && icon} 
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Shadow for Android
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  }
});

export default Button;
