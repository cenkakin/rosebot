export interface SourceResponse {
  id: number
  type: 'NEWS' | 'REDDIT' | 'TWITTER'
  name: string
  url: string
  homepage: string
  enabled: boolean
  createdAt: string
}
