import * as FileSystem from 'expo-file-system';

export const setupErrorHandling = () => {
  // Catch unhandled promises
  const originalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Log error to file
    const errorLog = {
      error: error.message,
      stack: error.stack,
      isFatal,
      timestamp: new Date().toISOString(),
    };
    
    // Save to file
    FileSystem.writeAsStringAsync(
      FileSystem.documentDirectory + 'crash-log.json',
      JSON.stringify(errorLog)
    ).catch(console.error);
    
    // Call original handler
    originalHandler(error, isFatal);
  });
};

export const checkCrashLogs = async () => {
  try {
    const crashLog = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + 'crash-log.json'
    );
    if (crashLog) {
      console.log('Previous crash detected:', JSON.parse(crashLog));
      // Clear after reading
      await FileSystem.deleteAsync(
        FileSystem.documentDirectory + 'crash-log.json',
        { idempotent: true }
      );
    }
  } catch (e) {
    // No crash log exists
  }
};