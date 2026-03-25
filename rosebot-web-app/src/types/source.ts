export interface SourceResponse {
  id: number
  type: 'NEWS' | 'REDDIT' | 'TWITTER'
  name: string
  url: string
  enabled: boolean
  createdAt: string
}
