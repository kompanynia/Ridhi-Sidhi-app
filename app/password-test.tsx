import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

export default function PasswordTestScreen() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testPasswordSave = async () => {
    if (!userId || !password) {
      Alert.alert('Error', 'Please enter both User ID and Password');
      return;
    }

    setIsLoading(true);
    setResults([]);
    addResult('Starting password save test...');

    try {
      // Test 1: Direct update
      addResult('Test 1: Direct update method');
      const { data: directUpdate, error: directError } = await supabase
        .from('users')
        .update({ 
          password: password,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (directError) {
        addResult(`❌ Direct update failed: ${directError.message}`);
      } else {
        addResult(`✅ Direct update successful`);
        addResult(`Password in result: ${directUpdate?.password}`);
      }

      // Test 2: RPC function
      addResult('Test 2: RPC function method');
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('update_user_password', {
          user_id: userId,
          new_password: password
        });

        if (rpcError) {
          addResult(`❌ RPC update failed: ${rpcError.message}`);
        } else {
          addResult(`✅ RPC update result: ${rpcResult}`);
        }
      } catch (rpcException) {
        addResult(`❌ RPC exception: ${rpcException}`);
      }

      // Test 3: Alternative RPC function
      addResult('Test 3: Alternative RPC function method');
      try {
        const { data: altRpcResult, error: altRpcError } = await supabase.rpc('save_user_password', {
          user_id: userId,
          user_password: password
        });

        if (altRpcError) {
          addResult(`❌ Alt RPC update failed: ${altRpcError.message}`);
        } else {
          addResult(`✅ Alt RPC update successful`);
          addResult(`Result: ${JSON.stringify(altRpcResult)}`);
        }
      } catch (altRpcException) {
        addResult(`❌ Alt RPC exception: ${altRpcException}`);
      }

      // Test 4: Verification
      addResult('Test 4: Verification');
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('id, email, password')
        .eq('id', userId)
        .single();

      if (verifyError) {
        addResult(`❌ Verification failed: ${verifyError.message}`);
      } else {
        addResult(`✅ Verification successful`);
        addResult(`User: ${verifyData.email}`);
        addResult(`Password in DB: ${verifyData.password}`);
        addResult(`Expected: ${password}`);
        addResult(`Match: ${verifyData.password === password ? '✅' : '❌'}`);
      }

    } catch (error) {
      addResult(`❌ Test failed with exception: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setIsLoading(true);
    addResult('Fetching all users...');

    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, password')
        .order('created_at', { ascending: false });

      if (error) {
        addResult(`❌ Failed to fetch users: ${error.message}`);
      } else {
        addResult(`✅ Found ${users.length} users:`);
        users.forEach(user => {
          addResult(`- ${user.email} (${user.id}) - Password: ${user.password || 'NULL'}`);
        });
      }
    } catch (error) {
      addResult(`❌ Exception: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Password Save Test</Text>
          <Text style={styles.subtitle}>Debug password saving to database</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="User ID"
            placeholder="Enter user UUID"
            value={userId}
            onChangeText={setUserId}
          />

          <Input
            label="Password"
            placeholder="Enter password to save"
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title="Test Password Save"
            onPress={testPasswordSave}
            loading={isLoading}
            fullWidth
            style={styles.button}
          />

          <Button
            title="Fetch All Users"
            onPress={fetchAllUsers}
            loading={isLoading}
            fullWidth
            style={styles.button}
          />
        </View>

        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          <ScrollView style={styles.resultsScroll}>
            {results.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  form: {
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
  results: {
    flex: 1,
    marginTop: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  resultsScroll: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    maxHeight: 400,
  },
  resultText: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});