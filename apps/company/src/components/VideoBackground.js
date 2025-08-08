import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Video } from 'expo-av';

const VideoBackground = ({ children, videoSource, imageSource, style }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // If video fails to load or is not available, fallback to image
  if (videoError || !videoSource) {
    return (
      <ImageBackground source={imageSource} style={[styles.background, style]}>
        {children}
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.background, style]}>
      <Video
        source={videoSource}
        style={StyleSheet.absoluteFillObject}
        shouldPlay
        isLooping
        isMuted
        resizeMode="cover"
        onLoad={() => setVideoLoaded(true)}
        onError={() => setVideoError(true)}
      />
      {/* Fallback image while video loads */}
      {!videoLoaded && (
        <ImageBackground 
          source={imageSource} 
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});

export default VideoBackground;