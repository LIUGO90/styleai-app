import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

// 启用 Android 的 LayoutAnimation
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function LayoutAnimationExample() {
  const [items, setItems] = useState(['项目1', '项目2', '项目3']);
  const [expanded, setExpanded] = useState(false);

  const addItem = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItems(prev => [...prev, `项目${prev.length + 1}`]);
  };

  const removeItem = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LayoutAnimation 示例</Text>

      <TouchableOpacity style={styles.button} onPress={addItem}>
        <Text style={styles.buttonText}>添加项目</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={toggleExpanded}>
        <Text style={styles.buttonText}>{expanded ? '收起' : '展开'}</Text>
      </TouchableOpacity>

      <View style={styles.itemsContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.itemText}>{item}</Text>
            <TouchableOpacity 
              style={styles.removeButton} 
              onPress={() => removeItem(index)}
            >
              <Text style={styles.removeButtonText}>删除</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.expandedText}>这是展开的内容</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  itemsContainer: {
    marginTop: 20,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
  },
  expandedContent: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expandedText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
