'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  suggestedTags?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Data Structures',
  'Algorithms',
  'System Design',
  'React',
  'Node.js',
  'Python',
  'Java',
  'Go',
  'Behavioral',
  'SQL',
  'AWS',
  'Microservices',
];

export function TagSelector({ selectedTags, onChange, suggestedTags = DEFAULT_SUGGESTIONS }: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('');

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (selectedTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...selectedTags, trimmed]);
    setCustomTag('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(selectedTags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border rounded-md bg-background/50">
        {selectedTags.length === 0 && (
          <span className="text-sm text-muted-foreground self-center px-1">
            No topics/skills selected yet
          </span>
        )}
        {selectedTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Add Custom Tag */}
      <div className="flex gap-2">
        <Input
          placeholder="Add custom topic (e.g. Dynamic Programming)..."
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(customTag);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => addTag(customTag)}
          disabled={!customTag.trim()}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* Suggested Quick Add Chips */}
      <div>
        <span className="text-xs text-muted-foreground font-medium mb-1.5 block">
          Quick add suggested topics:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {suggestedTags
            .filter((tag) => !selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase()))
            .map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="text-xs px-2.5 py-1 rounded-full border border-border/60 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 transition-colors"
              >
                + {tag}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
