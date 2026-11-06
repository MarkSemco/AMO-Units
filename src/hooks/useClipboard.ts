import { useState, useCallback } from 'react';

export interface ClipboardState {
  copiedText: string | null;
  hasCopied: boolean;
  copyToClipboard: (text: string, label?: string) => Promise<boolean>;
}

export function useClipboard(timeout = 2000): ClipboardState {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  const copyToClipboard = useCallback(
    async (text: string, label?: string): Promise<boolean> => {
      if (!text) return false;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older environments
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }

        setCopiedText(label || text);
        setHasCopied(true);

        setTimeout(() => {
          setHasCopied(false);
          setCopiedText(null);
        }, timeout);

        return true;
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
        return false;
      }
    },
    [timeout]
  );

  return { copiedText, hasCopied, copyToClipboard };
}
