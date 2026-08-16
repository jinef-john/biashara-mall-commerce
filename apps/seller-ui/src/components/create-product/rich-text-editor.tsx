'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ReactQuill
      theme="snow"
      value={value ?? ''}
      onChange={onChange}
      className="bg-surface-container-lowest text-on-surface"
    />
  );
}
