import ptBR from './pt-BR.ts'
import type { Widen } from '../../../i18n/types.ts'

const messages = {
  back: '返回目录',
  loading: '正在加载应用程序...',
  notFound: '未找到应用程序',
  notFoundHint: '目录中没有此标识符。',
  error: '无法获取此应用程序',
  errorHint: '请求失败，请重试。',
  eyebrow: '受监控的应用程序',
  identity: '标识信息和状态',
  id: '标识符',
  firstSeen: '首次记录',
  removedAt: '移除时间',
  location: '位置',
  regionCode: '区域代码',
  latitude: '纬度',
  longitude: '经度',
} satisfies Widen<typeof ptBR>

export default messages
