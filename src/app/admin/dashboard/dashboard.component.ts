import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

interface StatCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

interface DepartmentCard {
  title: string;
  count: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

interface Order {
  id: string;
  client: string;
  amount: string;
  status: string;
  statusColor: string;
  date: string;
}

interface ChartDataPoint {
  day: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  // Main statistics cards
  stats: StatCard[] = [
    {
      title: 'إجمالي المبيعات',
      value: '124,500 ج.م',
      change: 12,
      changeLabel: 'مقارنة بالشهر الماضي',
      icon: 'dollar',
      iconColor: '#00ff41',
      iconBg: 'rgba(0, 255, 65, 0.1)'
    },
    {
      title: 'الطلبات الجديدة',
      value: '45',
      change: 5,
      changeLabel: 'مقارنة بالشهر الماضي',
      icon: 'cart',
      iconColor: '#6366f1',
      iconBg: 'rgba(99, 102, 241, 0.1)'
    },
    {
      title: 'المنتجات',
      value: '89',
      change: 0,
      changeLabel: 'مقارنة بالشهر الماضي',
      icon: 'package',
      iconColor: '#f97316',
      iconBg: 'rgba(249, 115, 22, 0.1)'
    }
  ];

  // Department/Category cards
  departments: DepartmentCard[] = [
    { title: 'شواحن منزلية', count: '24 منتج', icon: 'battery', iconColor: '#00ff41', iconBg: 'rgba(0, 255, 65, 0.1)' },
    { title: 'محطات شحن', count: '8 منتج', icon: 'charging-station', iconColor: '#3b82f6', iconBg: 'rgba(59, 130, 246, 0.1)' },
    { title: 'كابلات وأسلاك', count: '35 منتج', icon: 'cable', iconColor: '#f59e0b', iconBg: 'rgba(245, 158, 11, 0.1)' },
    { title: 'محولات', count: '12 منتج', icon: 'plug', iconColor: '#8b5cf6', iconBg: 'rgba(139, 92, 246, 0.1)' },
    { title: 'إنفرتر', count: '15 منتج', icon: 'inverter', iconColor: '#06b6d4', iconBg: 'rgba(6, 182, 212, 0.1)' },
    { title: 'صناديق توزيع', count: '18 منتج', icon: 'box', iconColor: '#f97316', iconBg: 'rgba(249, 115, 22, 0.1)' },
    { title: 'قواطع كهربائية', count: '42 منتج', icon: 'switch', iconColor: '#ef4444', iconBg: 'rgba(239, 68, 68, 0.1)' },
    { title: 'اكسسوارات', count: '56 منتج', icon: 'tool', iconColor: '#10b981', iconBg: 'rgba(16, 185, 129, 0.1)' },
    { title: 'قطع غيار', count: '31 منتج', icon: 'gear', iconColor: '#8b5cf6', iconBg: 'rgba(139, 92, 246, 0.1)' },
    { title: 'أنظمة حماية', count: '9 منتج', icon: 'shield', iconColor: '#10b981', iconBg: 'rgba(16, 185, 129, 0.1)' },
    { title: 'عدادات ذكية', count: '14 منتج', icon: 'meter', iconColor: '#06b6d4', iconBg: 'rgba(6, 182, 212, 0.1)' },
    { title: 'لوحات تحكم', count: '7 منتج', icon: 'control', iconColor: '#ec4899', iconBg: 'rgba(236, 72, 153, 0.1)' }
  ];

  // Recent orders
  orders: Order[] = [
    {
      id: 'ORD-001#',
      client: 'محمد أحمد',
      amount: '2,350 ج.م',
      status: 'تم التسليم',
      statusColor: 'success',
      date: '2024-02-08'
    },
    {
      id: 'ORD-002#',
      client: 'شركة النور',
      amount: '15,400 ج.م',
      status: 'قيد الانتظار',
      statusColor: 'warning',
      date: '2024-02-08'
    },
    {
      id: 'ORD-003#',
      client: 'أحمد علي',
      amount: '3,200 ج.م',
      status: 'تم التسليم',
      statusColor: 'success',
      date: '2024-02-07'
    },
    {
      id: 'ORD-004#',
      client: 'مؤسسة الكهرباء',
      amount: '28,900 ج.م',
      status: 'قيد المعالجة',
      statusColor: 'info',
      date: '2024-02-07'
    },
    {
      id: 'ORD-005#',
      client: 'سارة محمود',
      amount: '1,800 ج.م',
      status: 'تم التسليم',
      statusColor: 'success',
      date: '2024-02-06'
    }
  ];

  // Chart data for sales
  chartData: ChartDataPoint[] = [
    { day: 'الجمعة', value: 3500 },
    { day: 'الخميس', value: 2800 },
    { day: 'الأربعاء', value: 2000 },
    { day: 'الثلاثاء', value: 2700 },
    { day: 'الاثنين', value: 2100 },
    { day: 'الأحد', value: 3000 },
    { day: 'السبت', value: 3400 }
  ];

  // User info
  user = {
    name: 'أحمد محمد',
    role: 'مدير النظام'
  };

  // Get max value for chart scaling
  get maxChartValue(): number {
    return Math.max(...this.chartData.map(d => d.value));
  }

  // Calculate chart point position
  getChartPoint(index: number, value: number): string {
    const width = 100;
    const height = 100;
    const padding = 10;

    const x = padding + (index / (this.chartData.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value / this.maxChartValue) * (height - 2 * padding));

    return `${x},${y}`;
  }

  // Generate SVG path for chart
  get chartPath(): string {
    const points = this.chartData.map((d, i) => this.getChartPoint(i, d.value));
    return `M ${points.join(' L ')}`;
  }

  // Generate SVG area path for chart fill
  get chartAreaPath(): string {
    const points = this.chartData.map((d, i) => this.getChartPoint(i, d.value));
    const firstPoint = this.getChartPoint(0, 0);
    const lastPoint = this.getChartPoint(this.chartData.length - 1, 0);

    return `M ${firstPoint} L ${points.join(' L ')} L ${lastPoint} Z`;
  }
}
