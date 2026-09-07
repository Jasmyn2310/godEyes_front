import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface BrandLogoProps {
  readonly size?: number;
  readonly showWordmark?: boolean;
  readonly subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 72,
  showWordmark = true,
  subtitle = 'Sistema de Monitoreo & Telemetría',
}) => {
  return (
    <View style={styles.container} accessible={true} accessibilityLabel="Logo GodEyes">
      <View
        style={[
          styles.imageWrapper,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.28),
          },
        ]}
      >
        <Image
          source={require('../../../assets/images/godeyes-brand-logo.png')}
          style={[styles.logoImage, { width: size, height: size }]}
          contentFit="cover"
          transition={300}
        />
      </View>

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
  imageWrapper: {
    overflow: 'hidden',
    backgroundColor: '#090D16',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    borderRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titlePrimary: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#0F172A',
  },
  titleAccent: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#0284C7',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
