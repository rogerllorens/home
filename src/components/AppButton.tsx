import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useColorScheme } from 'react-native';
import theme from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'icon';
  icon?: string;
  style?: ViewStyle;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  style,
}: Props) {
  const scheme = useColorScheme();
  const colors = theme[scheme === 'dark' ? 'lowLight' : 'light'];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={title || icon || 'button'}
        onPress={onPress}
        style={[styles.primary, { backgroundColor: colors.primary }, style]}
        focusable
      >
        {icon && <Icon name={icon} size={20} color="#fff" style={{ marginRight: 6 }} />}
        {title && <Text allowFontScaling style={styles.primaryText}>{title}</Text>}
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={title || icon || 'button'}
        onPress={onPress}
        style={[
          styles.secondary,
          { borderColor: colors.action },
          style,
        ]} focusable onFocus={(e)=>e.currentTarget.style.outlineColor=colors.action} onBlur={(e)=>e.currentTarget.style.outlineColor="transparent"}
      >
        {icon && <Icon name={icon} size={20} color={colors.action} style={{ marginRight: 6 }} />}
        {title && <Text allowFontScaling style={[styles.secondaryText, { color: colors.action }]}>{title}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title || icon || 'button'}
      onPress={onPress}
      style={[styles.iconButton, style]}
      focusable
      onFocus={(e) => (e.currentTarget.style.outlineColor = colors.action)}
      onBlur={(e) => (e.currentTarget.style.outlineColor = 'transparent')}
    >
      {icon && <Icon name={icon} size={24} color={colors.action} />}
      {title && <Text allowFontScaling style={{ color: colors.action }}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.light.spacing.md,
    paddingVertical: theme.light.spacing.sm,
    borderRadius: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: theme.light.fontSizes.md,
    fontFamily: theme.light.fontFamily,
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.light.spacing.md,
    paddingVertical: theme.light.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryText: {
    fontSize: theme.light.fontSizes.md,
    fontFamily: theme.light.fontFamily,
  },
  iconButton: {
    padding: theme.light.spacing.sm,
    borderRadius: 20,
    outlineWidth: 2,
    outlineColor: 'transparent',
  },
});
