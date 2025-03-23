import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';

const MarkdownEditor = ({ initialValue, onChange, readOnly = false }) => {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  const handleChange = (newValue) => {
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  if (readOnly) {
    return (
      <div data-color-mode="light" style={{ height: '100%', overflow: 'auto' }}>
        <MDEditor.Markdown 
          source={value}
          style={{ 
            padding: '16px',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            minHeight: '100%'
          }}
        />
      </div>
    );
  }

  return (
    <div data-color-mode="light" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MDEditor
        value={value}
        onChange={handleChange}
        height="100%"
        preview="live"
        hideToolbar={false}
        enableScroll={true}
        highlightEnable={true}
        visibleDragbar={false}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        previewOptions={{
          style: {
            height: '100%',
            overflow: 'auto'
          }
        }}
        textareaProps={{
          spellCheck: true,
          placeholder: "Write your markdown content here...",
          style: {
            height: '100%',
            overflow: 'auto'
          }
        }}
      />
    </div>
  );
};

export default MarkdownEditor; 