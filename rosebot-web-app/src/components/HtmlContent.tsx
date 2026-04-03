import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
import { sanitizeHtml } from '../utils/sanitize'

interface Props {
  html: string
  sx?: SxProps<Theme>
}

export function HtmlContent({ html, sx }: Props) {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      sx={{
        fontSize: 14,
        lineHeight: 1.65,
        color: '#424242',
        '& p': { mt: 0, mb: 1 },
        '& a': { color: 'primary.main', textDecoration: 'underline' },
        '& img': { maxWidth: '100%', borderRadius: 1 },
        '& ul, & ol': { pl: 2.5, mb: 1 },
        '& li': { mb: 0.25 },
        '& blockquote': {
          borderLeft: '3px solid #e0c8c0',
          pl: 2,
          ml: 0,
          color: 'text.secondary',
          fontStyle: 'italic',
          my: 1,
        },
        '& pre': {
          bgcolor: '#f5f5f5',
          p: 1.5,
          borderRadius: 1,
          overflowX: 'auto',
          fontSize: 13,
          my: 1,
        },
        '& code': {
          fontFamily: 'monospace',
          fontSize: '0.9em',
          bgcolor: '#f5f5f5',
          px: 0.5,
          borderRadius: 0.5,
        },
        '& table': { borderCollapse: 'collapse', width: '100%', my: 1 },
        '& th, & td': { border: '1px solid #ddd', p: '6px 10px', textAlign: 'left' },
        '& th': { bgcolor: '#f5f5f5', fontWeight: 600 },
        '& h1, & h2, & h3, & h4': { mt: 1.5, mb: 0.75, lineHeight: 1.3 },
        ...sx,
      }}
    />
  )
}
