'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Code2, RotateCcw, Copy, Check } from 'lucide-react';

const LANGUAGE_TEMPLATES: Record<string, string> = {
  python: `# Write your solution here
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

# Test execution
print(two_sum([2, 7, 11, 15], 9))
`,
  javascript: `// Write your solution here
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}

console.log(twoSum([2, 7, 11, 15], 9));
`,
  typescript: `// Write your solution here
function twoSum(nums: number[], target: number): number[] {
    const map = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff)!, i];
        }
        map.set(nums[i], i);
    }
    return [];
}
`,
  cpp: `// Write your solution here
#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> mp;
    for (int i = 0; i < nums.size(); i++) {
        int diff = target - nums[i];
        if (mp.find(diff) != mp.end()) {
            return {mp[diff], i};
        }
        mp[nums[i]] = i;
    }
    return {};
}
`,
  java: `// Write your solution here
import java.util.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (map.containsKey(diff)) {
                return new int[] { map.get(diff), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}
`,
  go: `package main

import "fmt"

func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        diff := target - num
        if idx, ok := seen[diff]; ok {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}
`,
  sql: `-- Write your SQL query here
SELECT 
    u.id, 
    u.name, 
    COUNT(b.id) AS total_interviews
FROM users u
JOIN bookings b ON u.id = b.candidate_id
GROUP BY u.id, u.name
ORDER BY total_interviews DESC;
`,
};

interface CodeEditorProps {
  interviewId?: string;
}

export function CodeEditor({ interviewId }: CodeEditorProps) {
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>(LANGUAGE_TEMPLATES.python);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!interviewId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    const socket = io(socketUrl, {
      path: '/socket.io',
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.emit('join_room', {
      interviewId,
      userId: 'editor_user',
      userName: 'Participant',
    });

    socket.on('code_updated', (data: { content: string; language?: string }) => {
      if (data.content !== undefined) setCode(data.content);
      if (data.language) setLanguage(data.language);
    });

    return () => {
      socket.disconnect();
    };
  }, [interviewId]);

  const handleCodeChange = (val: string | undefined) => {
    const newContent = val || '';
    setCode(newContent);

    if (interviewId && socketRef.current) {
      socketRef.current.emit('code_change', {
        interviewId,
        content: newContent,
        language,
      });

      // Periodic snapshot save
      socketRef.current.emit('save_snapshot', {
        interviewId,
        content: newContent,
        language,
      });
    }
  };

  const handleLanguageChange = (newLang: string | null) => {
    if (!newLang) return;
    setLanguage(newLang);
    const newContent = LANGUAGE_TEMPLATES[newLang] || '// Start coding...';
    setCode(newContent);

    if (interviewId && socketRef.current) {
      socketRef.current.emit('code_change', {
        interviewId,
        content: newContent,
        language: newLang,
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    const defaultCode = LANGUAGE_TEMPLATES[language] || '';
    setCode(defaultCode);

    if (interviewId && socketRef.current) {
      socketRef.current.emit('code_change', {
        interviewId,
        content: defaultCode,
        language,
      });
    }
  };

  return (
    <div className="flex flex-col h-full border border-border/50 rounded-xl bg-card overflow-hidden shadow-xl">
      {/* Top Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-primary">
            <Code2 className="h-4 w-4" /> Real-Time Collaborative Editor
          </div>

          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="python">Python 3</SelectItem>
              <SelectItem value="javascript">JavaScript (ES6)</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="cpp">C++ 20</SelectItem>
              <SelectItem value="java">Java 17</SelectItem>
              <SelectItem value="go">Go 1.21</SelectItem>
              <SelectItem value="sql">SQL (PostgreSQL)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 text-xs gap-1">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Reset Template
          </Button>
        </div>
      </div>

      {/* Monaco Editor Component */}
      <div className="flex-1 min-h-[450px]">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
          }}
        />
      </div>
    </div>
  );
}
