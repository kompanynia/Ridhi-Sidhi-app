import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { trpcClient, isBackendConfigured } from '@/lib/trpc';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export default function TestConnectionScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>('Not tested');

  const fetchTodos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching todos...');
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching todos:', error);
        throw error;
      }

      console.log('Todos fetched successfully:', data?.length || 0);
      setTodos(data || []);
    } catch (err: any) {
      console.error('Error in fetchTodos:', err);
      setError(err.message || 'Failed to fetch todos');
    } finally {
      setIsLoading(false);
    }
  };

  const addTestTodo = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          { title: `Test todo ${Date.now()}`, completed: false }
        ])
        .select();

      if (error) throw error;

      console.log('Todo added:', data);
      fetchTodos(); // Refresh the list
    } catch (err: any) {
      console.error('Error adding todo:', err);
      Alert.alert('Error', err.message || 'Failed to add todo');
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing Supabase connection...');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('todos')
        .select('count', { count: 'exact' });

      if (error) {
        console.error('Connection test failed:', error);
        throw error;
      }

      console.log('Connection test successful. Todo count:', data);
      Alert.alert('Success', 'Supabase connection is working!');
      fetchTodos();
    } catch (err: any) {
      console.error('Connection test error:', err);
      setError(err.message || 'Connection test failed');
      Alert.alert('Connection Failed', err.message || 'Unable to connect to Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  const testOrdersFetch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing orders fetch...');
      
      // Test orders fetch with join
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (
            name,
            email,
            phone
          ),
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Orders fetch with join failed:', error);
        
        // Try separate fetch
        console.log('Trying separate fetch...');
        
        const { data: ordersOnly, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .order('created_at', { ascending: false });
        
        if (ordersError) {
          throw ordersError;
        }
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, phone');
        
        console.log('Users fetch result:', { 
          usersCount: usersData?.length || 0, 
          error: usersError,
          sampleUser: usersData?.[0] 
        });
        
        if (usersError) {
          console.error('Users fetch failed:', usersError);
        }
        
        const joinedData = ordersOnly?.map(order => ({
          ...order,
          users: usersData?.find(user => user.id === order.user_id) || null
        }));
        
        console.log('Manual join result:', {
          ordersCount: joinedData?.length || 0,
          sampleOrderWithUser: joinedData?.[0] ? {
            orderId: joinedData[0].id,
            userId: joinedData[0].user_id,
            userName: joinedData[0].users?.name
          } : null
        });
        
        Alert.alert('Success', `Orders fetch working with separate queries! Found ${joinedData?.length || 0} orders`);
        return;
      }

      console.log('Orders fetch successful. Orders count:', ordersData?.length || 0);
      console.log('Sample order with user:', ordersData?.[0] ? {
        orderId: ordersData[0].id,
        userId: ordersData[0].user_id,
        userName: ordersData[0].users?.name
      } : null);
      
      Alert.alert('Success', `Orders fetch working! Found ${ordersData?.length || 0} orders`);
    } catch (err: any) {
      console.error('Orders fetch error:', err);
      setError(err.message || 'Orders fetch failed');
      Alert.alert('Orders Fetch Failed', err.message || 'Unable to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const testUsersFetch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing users fetch...');
      
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role');
      
      if (error) {
        console.error('Users fetch failed:', error);
        throw error;
      }
      
      console.log('Users fetch successful:', {
        count: usersData?.length || 0,
        users: usersData
      });
      
      Alert.alert('Success', `Users fetch working! Found ${usersData?.length || 0} users`);
    } catch (err: any) {
      console.error('Users fetch error:', err);
      setError(err.message || 'Users fetch failed');
      Alert.alert('Users Fetch Failed', err.message || 'Unable to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setBackendStatus('Testing...');
    
    if (!isBackendConfigured()) {
      setBackendStatus('Backend not configured (EXPO_PUBLIC_RORK_API_BASE_URL not set)');
      return;
    }

    if (!trpcClient) {
      setBackendStatus('tRPC client not available');
      return;
    }

    try {
      const result = await trpcClient.example.hi.query();
      setBackendStatus(`Backend connected! Response: ${JSON.stringify(result)}`);
      Alert.alert('Backend Success', 'tRPC backend is working!');
    } catch (err: any) {
      console.error('Backend test error:', err);
      setBackendStatus(`Backend failed: ${err.message}`);
      Alert.alert('Backend Failed', err.message || 'Unable to connect to backend');
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <Text style={styles.todoTitle}>{item.title}</Text>
      <Text style={styles.todoStatus}>
        {item.completed ? 'Completed' : 'Pending'}
      </Text>
      <Text style={styles.todoDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supabase Connection Test</Text>
        <Text style={styles.subtitle}>Testing database connectivity</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Test Supabase Connection"
          onPress={testConnection}
          loading={isLoading}
          style={styles.button}
        />
        <Button
          title="Test Backend Connection"
          onPress={testBackendConnection}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Test Orders Fetch"
          onPress={testOrdersFetch}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Add Test Todo"
          onPress={addTestTodo}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Refresh Todos"
          onPress={fetchTodos}
          variant="outline"
          style={styles.button}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Supabase Error: {error}</Text>
        </View>
      )}

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Backend Status:</Text>
        <Text style={styles.statusText}>{backendStatus}</Text>
        <Text style={styles.statusTitle}>Backend Available:</Text>
        <Text style={styles.statusText}>{isBackendConfigured() ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.todosContainer}>
        <Text style={styles.todosTitle}>
          Todos ({todos.length})
        </Text>
        
        {todos.length === 0 && !isLoading ? (
          <Text style={styles.emptyText}>No todos found</Text>
        ) : (
          <FlatList
            data={todos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTodo}
            style={styles.todosList}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    marginBottom: 0,
  },
  errorContainer: {
    backgroundColor: 'rgba(229, 115, 115, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  statusContainer: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  todosContainer: {
    flex: 1,
  },
  todosTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  emptyText: {
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 20,
  },
  todosList: {
    flex: 1,
  },
  todoItem: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  todoStatus: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  todoDate: {
    fontSize: 12,
    color: colors.textLight,
  },
});