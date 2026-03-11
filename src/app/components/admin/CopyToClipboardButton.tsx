import React, { useState } from 'react';
import { Button, Tooltip, Box } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface CopyToClipboardProps {
  textToCopy: string;
}

const CopyToClipboardButton: React.FC<CopyToClipboardProps> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset tooltip message after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {/* Optional: display the text you are copying */}
      <span>{textToCopy}</span> 
      
      <Tooltip title={copied ? "Copied!" : "Copy to clipboard"} placement="top">
        <Button 
          onClick={handleCopy} 
          sx={{ minWidth: '30px' }} 
          aria-label="copy to clipboard"
        >
          <ContentCopyIcon sx={{ height: '20px' }} />
        </Button>
      </Tooltip>
    </Box>
  );
};

export default CopyToClipboardButton;
