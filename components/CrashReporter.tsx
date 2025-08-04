import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Button } from './Button';

interface CrashLog {
  error: string;
  stack: string;
  isFatal: boolean;
  timestamp: string;
}

export function CrashReporter({ children }: { children: React.ReactNode }) {
  const [lastCrash, setLastCrash] = useState<CrashLog | null>(null);

  useEffect(() => {
    checkForCrashes();
  }, []);

  const checkForCrashes = async () => {
    try {
      const crashLog = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + 'crash-log.json'
      );
      if (crashLog) {
        setLastCrash(JSON.parse(crashLog));
        // Clear after reading
        await FileSystem.deleteAsync(
          FileSystem.documentDirectory + 'crash-log.json',
          { idempotent: true }
        );
      }
    } catch (e) {
      // No crash log
    }
  };

  if (lastCrash) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>App crashed last time</Text>
        <Text style={styles.error}>Error: {lastCrash.error}</Text>
        <Text style={styles.timestamp}>
          Time: {new Date(lastCrash.timestamp).toLocaleString()}
        </Text>
        <Text style={styles.stack}>Stack: {lastCrash.stack}</Text>
        <Button title="Continue" onPress={() => setLastCrash(null)} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d32f2f',
  },
  error: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  stack: {
    marginTop: 10,
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
});