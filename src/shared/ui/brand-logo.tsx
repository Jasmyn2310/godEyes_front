import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface BrandLogoProps {
  readonly size?: number;
  readonly showWordmark?: boolean;
  readonly subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 110,
  showWordmark = true,
  subtitle = 'Sistema de Monitoreo & Telemetría',
}) => {
  return (
    <View style={styles.container} accessible={true} accessibilityLabel="Logo GodEyes">
      <Image
        source={require('@/../assets/images/godeyes-brand-logo.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
        transition={200}
      />

      {showWordmark ? (
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titlePrimary}>God</Text>
            <Text style={styles.titleAccent}>Eyes</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titlePrimary: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#0F172A',
  },
  titleAccent: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#0284C7',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 3,
    letterSpacing: 0.2,
  },
});
