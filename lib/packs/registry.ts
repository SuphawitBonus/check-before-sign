import rentalPackJson from '../../packs/rental/pack.json';
import { rentalPackRules } from '../../packs/rental/rules';
import { PackDefinition, PackRules } from '../engine/types';

export interface PackRegistryItem {
  meta: PackDefinition['meta'];
  pack: PackDefinition;
  rules: PackRules;
  isAvailable: boolean;
}

export interface FuturePackPreview {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  iconName: string;
  plannedSession: string;
}

// Active available packs
export const PACK_REGISTRY: Record<string, PackRegistryItem> = {
  rental: {
    meta: rentalPackJson.meta as PackDefinition['meta'],
    pack: rentalPackJson as PackDefinition,
    rules: rentalPackRules,
    isAvailable: true,
  },
};

// Planned future packs for upcoming sessions
export const FUTURE_PACKS: FuturePackPreview[] = [
  {
    id: 'loan-interest',
    title: 'ดอกเบี้ยเงินกู้และสัญญากู้ยืมเงิน',
    shortTitle: 'ดอกเบี้ยเงินกู้',
    description: 'ตรวจอัตราดอกเบี้ยเงินกู้นอกระบบและในระบบ เกณฑ์เพดาน 15% ต่อปีตาม พ.ร.บ. ห้ามเรียกดอกเบี้ยเกินอัตรา และประกาศ ธปท.',
    category: 'การเงินและหนี้สิน',
    iconName: 'BadgePercent',
    plannedSession: 'เฟสถัดไป',
  },
  {
    id: 'labor-rights',
    title: 'สิทธิแรงงานและการจ้างงาน',
    shortTitle: 'สิทธิ์ลูกจ้าง',
    description: 'ตรวจสัญญาจ้างงาน ค่าล่วงเวลา (OT) การบอกเลิกจ้าง และเงินชดเชยตาม พ.ร.บ. คุ้มครองแรงงาน พ.ศ. ๒๕๔๑',
    category: 'แรงงานและการจ้างงาน',
    iconName: 'Briefcase',
    plannedSession: 'เฟสถัดไป',
  },
  {
    id: 'flight-rights',
    title: 'สิทธิผู้โดยสารสายการบิน (เที่ยวบินล่าช้า/ยกเลิก)',
    shortTitle: 'สิทธิ์เที่ยวบิน',
    description: 'ตรวจสิทธิชดเชย อาหาร ที่พัก และเงินคืนตามประกาศกระทรวงคมนาคม เรื่องการคุ้มครองสิทธิผู้โดยสารสายการบินประจำภายในประเทศ',
    category: 'การเดินทางและขนส่ง',
    iconName: 'Plane',
    plannedSession: 'เฟสถัดไป',
  },
  {
    id: 'condo-purchase',
    title: 'สัญญาจะซื้อจะขายห้องชุดคอนโดมิเนียม',
    shortTitle: 'สัญญาซื้อคอนโด',
    description: 'ตรวจสัญญาจะซื้อจะขายอาคารชุดตามแบบมาตรฐาน สคบ. การคิดเบี้ยปรับ ค่าส่วนกลาง และการส่งมอบห้องล่าช้า',
    category: 'อสังหาริมทรัพย์',
    iconName: 'Building2',
    plannedSession: 'เฟสถัดไป',
  },
];

export function getAllActivePacks(): PackDefinition['meta'][] {
  return Object.values(PACK_REGISTRY).map(item => item.meta);
}

export function getPackById(id: string): PackRegistryItem | null {
  return PACK_REGISTRY[id] || null;
}
