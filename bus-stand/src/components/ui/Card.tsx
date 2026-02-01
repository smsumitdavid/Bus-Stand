import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  onPress?: () => void; // If card is clickable
}

const Card: React.FC<CardProps> = ({ children, containerStyle, onPress }) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    // @ts-ignore - TouchableOpacity accepts onPress, View doesn't, but logic holds
    <Container 
      style={[styles.card, containerStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    // Production-level Shadows
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5, // Android Shadow
  }
});

export default Card;
