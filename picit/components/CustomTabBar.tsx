import React from 'react';
import * as TabBar from '@react-navigation/bottom-tabs';
import { View } from 'react-native';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <TabBar state={state} descriptors={descriptors} navigation={navigation} />
    </View>
  );
};

export default CustomTabBar;