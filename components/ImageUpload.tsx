import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { supabase } from '@/lib/supabase';
import { Buffer } from 'buffer';

// Ensure Buffer is globally available (if not already)
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}


interface ImageUploadProps {
  value?: string;
  onImageChange: (imageUrl: string) => void;
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onImageChange,
  label = "Product Image"
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return false;
      }
    }
    return true;
  };

  const createBucketIfNeeded = async (bucketName: string) => {
    try {
      // Try to create the bucket
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error && !error.message.includes('already exists')) {
        console.log(`Failed to create bucket "${bucketName}":`, error.message);
        return false;
      }
      
      console.log(`Bucket "${bucketName}" created or already exists`);
      return true;
    } catch (error) {
      console.log(`Error creating bucket "${bucketName}":`, error);
      return false;
    }
  };

const uploadImageToSupabase = async (uri: string, fileName?: string, base64Data?: string) => {
  try {
    console.log('Starting upload process...');
    console.log('URI:', uri);
    console.log('FileName:', fileName);
    console.log('Platform:', Platform.OS);
    console.log('Has base64 data:', !!base64Data);
    
    // Determine file extension and MIME type
    let fileExt = 'jpg';
    let mimeType = 'image/jpeg';
    
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'png') {
        fileExt = 'png';
        mimeType = 'image/png';
      } else if (ext === 'webp') {
        fileExt = 'webp';
        mimeType = 'image/webp';
      } else if (ext === 'jpeg' || ext === 'jpg') {
        fileExt = 'jpg';
        mimeType = 'image/jpeg';
      }
    }
    
    // Handle different platforms and file formats
    let uploadData: any;
    
    if (Platform.OS === 'web') {
      // Web: convert to blob
      const response = await fetch(uri);
      console.log('Web response:', response);
      uploadData = await response.blob();
    } else {
      // Mobile: Handle base64 data differently
      console.log('Processing mobile image upload...');
      
      let base64String = base64Data;
      console.log('base64Data:', !!base64Data);
      
      // If no base64 data provided, read from file system as fallback
      if (!base64String) {
        console.log('No base64 data provided, reading from file system...');
        
        // First, get file info to check if file exists and get size
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log('File info:', fileInfo);
        
        if (!fileInfo.exists) {
          throw new Error('File does not exist at the provided URI');
        }
        
        // Read file as base64
        base64String = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      
      console.log('Base64 length:', base64String?.length || 0);
      
      if (!base64String || base64String.length === 0) {
        throw new Error('Failed to read file content or get base64 data');
      }

			uploadData = Buffer.from(base64String, 'base64');

      console.log('Successfully converted base64 to blob');
      console.log('Blob size:', uploadData.size, 'bytes');
      console.log('Blob type:', uploadData.type);
    }
    
    // Validate data size
    const dataSize = Platform.OS === 'web' ? uploadData.size : uploadData.length;
    if (dataSize === 0) {  
      throw new Error('File is empty or could not be read properly');
    }
    
    console.log('Upload data size:', dataSize, 'bytes');
    
    // Create unique filename
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    console.log('uniqueFileName:', uniqueFileName);
    const filePath = `products/${uniqueFileName}`;
    console.log('filePath:', filePath);
    
    // Try multiple bucket names and create them if needed
    const bucketNames = ['images', 'product-images', 'uploads', 'storage'];
    let uploadSuccess = false;
    let publicUrl = '';

    for (const bucketName of bucketNames) {
      try {
        // Upload options
        const uploadOptions: any = {
          contentType: mimeType,
          upsert: false
        };

        console.log('Uploading to bucket:', bucketName);
        console.log('Upload data size:', Platform.OS === 'web' ? uploadData.size : uploadData.length);
        console.log('Upload options:', uploadOptions);
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, uploadData, uploadOptions);
          
        console.log('Upload result:', { data, error });
        
        if (error) {
          // If bucket doesn't exist, try to create it
          if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
            console.log(`Bucket "${bucketName}" not found, attempting to create...`);
            const bucketCreated = await createBucketIfNeeded(bucketName);
            
            if (bucketCreated) {
              // Try upload again after creating bucket
              const { data: retryData, error: retryError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, uploadData, uploadOptions);
              
              if (retryError) {
                console.log(`Failed to upload to newly created bucket "${bucketName}":`, retryError.message);
                continue;
              }
              
              console.log('Upload successful after bucket creation:', retryData);
            } else {
              continue;
            }
          } else {
            console.log(`Failed to upload to bucket "${bucketName}":`, error.message);
            continue;
          }
        }

        // Get public URL
        const { data: { publicUrl: url } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        publicUrl = url;
        uploadSuccess = true;
        console.log(`Successfully uploaded to bucket "${bucketName}", URL: ${publicUrl}`);
        break;
      } catch (bucketError) {
        console.log(`Bucket "${bucketName}" error:`, bucketError);
        continue;
      }
    }

    if (!uploadSuccess) {
      const errorMsg = 'Unable to upload image to storage. Please ensure you have created a storage bucket named "images" in your Supabase dashboard, or use the URL option instead.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log('Upload completed successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Upload error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      uri,
      fileName,
      platform: Platform.OS
    });
    throw error;
  }
};

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
		console.log('hasPermission....',hasPermission);
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
        exif: false,
        base64: true, // Include base64 for proper mobile upload
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });
			console.log('result.....',result);

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        
        console.log('Gallery selection result:', {
          uri: asset.uri,
          fileName: asset.fileName,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          hasBase64: !!asset.base64
        });
        
        // Determine filename based on URI or use default
        let fileName = asset.fileName;

				console.log('fileName....',fileName);
        if (!fileName) {
          // Extract extension from URI if possible
          const uriParts = asset.uri.split('.');
          const extension = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
          fileName = `image.${extension}`;
          console.log('Generated filename:', fileName);
        }
        
        const publicUrl = await uploadImageToSupabase(asset.uri, fileName, asset.base64 ?? undefined);
        onImageChange(publicUrl);
      }
    } catch (error) {
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Bucket not found')) {
          errorMessage = 'Storage bucket not found. Please create a storage bucket named "images" in your Supabase dashboard.';
        } else if (error.message.includes('storage')) {
          errorMessage = 'Storage configuration issue. Please check your Supabase storage settings.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        'Upload Error', 
        errorMessage + '\n\nTip: You can use the URL option to add images from the web instead.',
        [
          { text: 'OK' },
          { text: 'Use URL', onPress: () => setShowUrlInput(true) }
        ]
      );
      console.error('Image upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web. Please use gallery instead.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
        base64: true, // Include base64 for proper mobile upload
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        
        console.log('Camera capture result:', {
          uri: asset.uri,
          fileName: asset.fileName,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          hasBase64: !!asset.base64
        });
        
        // Determine filename based on URI or use default
        let fileName = asset.fileName;
        if (!fileName) {
          // For camera photos, default to jpg
          fileName = 'photo.jpg';
          console.log('Generated filename for camera:', fileName);
        }
        
        const publicUrl = await uploadImageToSupabase(asset.uri, fileName, asset.base64 ?? undefined);
        onImageChange(publicUrl);
      }
    } catch (error) {
      let errorMessage = 'Failed to upload photo. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Bucket not found')) {
          errorMessage = 'Storage bucket not found. Please create a storage bucket named "images" in your Supabase dashboard.';
        } else if (error.message.includes('storage')) {
          errorMessage = 'Storage configuration issue. Please check your Supabase storage settings.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        'Upload Error', 
        errorMessage + '\n\nTip: You can use the URL option to add images from the web instead.',
        [
          { text: 'OK' },
          { text: 'Use URL', onPress: () => setShowUrlInput(true) }
        ]
      );
      console.error('Photo upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onImageChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const removeImage = () => {
    onImageChange('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label} *</Text>
      
      {value ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: value }} style={styles.previewImage} />
          <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
            <Ionicons name="close" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadArea}>
          <Ionicons name="cloud-upload" size={40} color={colors.textLight} />
          <Text style={styles.uploadText}>Upload Product Image</Text>
          <Text style={styles.uploadSubtext}>JPG, PNG, WEBP up to 10MB</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Gallery"
          onPress={pickImageFromGallery}
          variant="outline"
          size="small"
          loading={isUploading}
          style={styles.uploadButton}
          icon={<Ionicons name="image" size={16} color={colors.primary} />}
        />
        
        {Platform.OS !== 'web' && (
          <Button
            title="Camera"
            onPress={takePhoto}
            variant="outline"
            size="small"
            loading={isUploading}
            style={styles.uploadButton}
            icon={<Ionicons name="camera" size={16} color={colors.primary} />}
          />
        )}
        
        <Button
          title="URL"
          onPress={() => setShowUrlInput(!showUrlInput)}
          variant="outline"
          size="small"
          style={styles.uploadButton}
        />
      </View>

      {showUrlInput && (
        <View style={styles.urlInputContainer}>
          <Input
            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
            value={urlInput}
            onChangeText={setUrlInput}
            containerStyle={styles.urlInput}
          />
          <Button
            title="Add"
            onPress={handleUrlSubmit}
            size="small"
            style={styles.urlSubmitButton}
          />
        </View>
      )}

      {isUploading && (
        <Text style={styles.uploadingText}>Uploading image...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    backgroundColor: colors.card,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  uploadButton: {
    flex: 1,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  urlInput: {
    flex: 1,
    marginBottom: 0,
  },
  urlSubmitButton: {
    marginBottom: 16,
  },
  uploadingText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
});