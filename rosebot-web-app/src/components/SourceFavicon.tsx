import { useState } from 'react'
import { Box } from '@mui/material'

interface Props {
  url: string
  size?: number
}

export function SourceFavicon({ url, size = 16 }: Props) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  try {
    const hostname = new URL(url).hostname
    return (
      <Box
        component="img"
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
        alt=""
        onError={() => setFailed(true)}
        sx={{ width: size, height: size, flexShrink: 0, borderRadius: '2px' }}
      />
    )
  } catch {
    return null
  }
}
