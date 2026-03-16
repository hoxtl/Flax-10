"""
Serialisers for calendar tags and categories.
"""

from rest_framework import serializers
from studyFlax.models import Tag
from studyFlax.models import Category

class CategorySerialiser(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'color', 'is_default']

class TagSerialiser(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = Tag
        fields = ['id', 'name', 'icon', 'default_duration', 'is_default', 'color', 'category', 'category_name']