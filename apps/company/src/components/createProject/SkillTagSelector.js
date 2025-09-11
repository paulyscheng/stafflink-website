import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../../contexts/LanguageContext';

const SkillTagSelector = ({ selectedSkills = [], onSkillsChange, availableSkills = [] }) => {
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState(['common']);

  // Group skills by category based on their context
  const groupSkillsByCategory = () => {
    const categories = {
      common: { name: '常用技能', skills: availableSkills.slice(0, 8) },
      professional: { name: '专业技能', skills: availableSkills.slice(8, 16) },
      other: { name: '其他技能', skills: availableSkills.slice(16) }
    };

    // Filter out empty categories
    const filteredCategories = {};
    Object.entries(categories).forEach(([key, value]) => {
      if (value.skills.length > 0) {
        filteredCategories[key] = value;
      }
    });

    return filteredCategories;
  };

  const categories = groupSkillsByCategory();

  // Toggle skill selection
  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      onSkillsChange(selectedSkills.filter(id => id !== skillId));
    } else {
      onSkillsChange([...selectedSkills, skillId]);
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderSkillTag = (skill) => {
    const isSelected = selectedSkills.includes(skill.id);

    return (
      <TouchableOpacity
        key={skill.id}
        style={[styles.skillTag, isSelected && styles.selectedTag]}
        onPress={() => toggleSkill(skill.id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tagText, isSelected && styles.selectedTagText]}>
          {skill.name}
        </Text>
        {isSelected && (
          <Icon name="check" size={16} color="#fff" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selected Skills Count */}
      {selectedSkills.length > 0 && (
        <View style={styles.selectedInfo}>
          <View style={styles.selectedCountContainer}>
            <Icon name="check-circle" size={18} color="#10B981" />
            <Text style={styles.selectedCountText}>
              已选择 {selectedSkills.length} 项技能
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onSkillsChange([])}
            style={styles.clearAllButton}
          >
            <Text style={styles.clearAllText}>清除</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skill Categories */}
      {Object.entries(categories).map(([categoryId, category]) => {
        const isExpanded = expandedCategories.includes(categoryId);
        const categorySelectedCount = category.skills.filter(skill => 
          selectedSkills.includes(skill.id)
        ).length;

        return (
          <View key={categoryId} style={styles.categorySection}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(categoryId)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryTitleContainer}>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                {categorySelectedCount > 0 && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{categorySelectedCount}</Text>
                  </View>
                )}
              </View>
              <Icon 
                name={isExpanded ? "expand-less" : "expand-more"} 
                size={24} 
                color="#6B7280" 
              />
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.tagContainer}>
                {category.skills.map(renderSkillTag)}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  selectedCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  clearAllText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  categorySection: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  categoryBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 42,
  },
  selectedTag: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  tagText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  selectedTagText: {
    color: '#FFFFFF',
  },
  checkIcon: {
    marginLeft: 6,
  },
});

export default SkillTagSelector;