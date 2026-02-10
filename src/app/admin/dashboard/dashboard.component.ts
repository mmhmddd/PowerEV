import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, map, take } from 'rxjs/operators';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { UserService } from '../../core/services/user.service';
import { AdapterService } from '../../core/services/adapter.service';
import { BoxService } from '../../core/services/box.service';
import { BreakerService } from '../../core/services/breaker.service';
import { CableService } from '../../core/services/cable.service';
import { ChargerService } from '../../core/services/charger.service';
import { OtherService } from '../../core/services/other.service';
import { PlugService } from '../../core/services/plug.service';
import { StationService } from '../../core/services/station.service';
import { WireService } from '../../core/services/wire.service';

interface StatCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
}

interface DepartmentCard {
  title: string;
  count: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  route: string;
  loading?: boolean;
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
  label: string;
  value: number;
  date?: Date;
}

interface OrderData {
  _id?: string;
  orderNumber?: string;
  name?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

type TimeRange = 'week' | 'month' | '6months' | 'year';

interface TimeRangeOption {
  value: TimeRange;
  label: string;
  active: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('ordersChartCanvas') ordersChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChartCanvas') revenueChartCanvas!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private ordersChart: Chart | null = null;
  private revenueChart: Chart | null = null;

  isLoadingStats = true;
  isLoadingDepartments = true;
  isLoadingOrders = true;
  isLoadingOrdersChart = true;
  isLoadingRevenueChart = true;

  // Populated dynamically from AuthService
  user = { name: 'مدير النظام', role: 'Admin' };

  selectedTimeRange: TimeRange = 'week';
  timeRangeOptions: TimeRangeOption[] = [
    { value: 'week', label: 'أسبوع', active: true },
    { value: 'month', label: 'شهر', active: false },
    { value: '6months', label: '6 أشهر', active: false },
    { value: 'year', label: 'سنة', active: false }
  ];

  stats: StatCard[] = [
    {
      title: 'إجمالي المبيعات', value: '0 ج.م', change: 0,
      changeLabel: 'مقارنة بالشهر الماضي', icon: 'dollar',
      iconColor: '#00ff41', iconBg: 'rgba(0, 255, 65, 0.1)', loading: true
    },
    {
      title: 'الطلبات الجديدة', value: '0', change: 0,
      changeLabel: 'مقارنة بالشهر الماضي', icon: 'cart',
      iconColor: '#6366f1', iconBg: 'rgba(99, 102, 241, 0.1)', loading: true
    },
    {
      // ← REPLACED: was "إجمالي المنتجات" — now "إجمالي المستخدمين"
      title: 'إجمالي المستخدمين', value: '0', change: 0,
      changeLabel: 'جميع المستخدمين', icon: 'users',
      iconColor: '#06b6d4', iconBg: 'rgba(6, 182, 212, 0.1)', loading: true
    }
  ];

  departments: DepartmentCard[] = [
    { title: 'شواحن', count: '0 منتج', icon: 'battery', iconColor: '#00ff41', iconBg: 'rgba(0, 255, 65, 0.1)', route: '/admin/chargers', loading: true },
    { title: 'محطات شحن', count: '0 منتج', icon: 'charging-station', iconColor: '#3b82f6', iconBg: 'rgba(59, 130, 246, 0.1)', route: '/admin/stations', loading: true },
    { title: 'كابلات', count: '0 منتج', icon: 'cable', iconColor: '#f59e0b', iconBg: 'rgba(245, 158, 11, 0.1)', route: '/admin/cables', loading: true },
    { title: 'أسلاك', count: '0 منتج', icon: 'cable', iconColor: '#8b5cf6', iconBg: 'rgba(139, 92, 246, 0.1)', route: '/admin/wires', loading: true },
    { title: 'محولات', count: '0 منتج', icon: 'plug', iconColor: '#06b6d4', iconBg: 'rgba(6, 182, 212, 0.1)', route: '/admin/adapters', loading: true },
    { title: 'قوابس', count: '0 منتج', icon: 'plug', iconColor: '#f97316', iconBg: 'rgba(249, 115, 22, 0.1)', route: '/admin/plugs', loading: true },
    { title: 'صناديق توزيع', count: '0 منتج', icon: 'box', iconColor: '#ef4444', iconBg: 'rgba(239, 68, 68, 0.1)', route: '/admin/boxes', loading: true },
    { title: 'قواطع كهربائية', count: '0 منتج', icon: 'switch', iconColor: '#10b981', iconBg: 'rgba(16, 185, 129, 0.1)', route: '/admin/breakers', loading: true },
    { title: 'منتجات أخرى', count: '0 منتج', icon: 'tool', iconColor: '#8b5cf6', iconBg: 'rgba(139, 92, 246, 0.1)', route: '/admin/others', loading: true }
  ];

  orders: Order[] = [];
  ordersChartData: ChartDataPoint[] = [];
  revenueChartData: ChartDataPoint[] = [];
  allOrdersData: OrderData[] = [];
  ordersChange = 0;
  revenueChange = 0;

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private userService: UserService,           // ← ADDED: replaces ProductService
    private adapterService: AdapterService,
    private boxService: BoxService,
    private breakerService: BreakerService,
    private cableService: CableService,
    private chargerService: ChargerService,
    private otherService: OtherService,
    private plugService: PlugService,
    private stationService: StationService,
    private wireService: WireService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadStatistics();
    this.loadDepartmentCounts();
    this.loadRecentOrders();
    this.loadChartData();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.ordersChart) this.ordersChart.destroy();
    if (this.revenueChart) this.revenueChart.destroy();
  }

  /**
   * Load current user info dynamically from AuthService.
   * Falls back to default values if no user is found.
   */
  private loadUserInfo(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user.name = currentUser.name || 'مدير النظام';
      this.user.role = currentUser.role === 'admin' ? 'مدير النظام' :
                       currentUser.role === 'employee' ? 'موظف' : 'مستخدم';
    }

    // Also subscribe to future changes (e.g. after getMe() refreshes the user)
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user) {
        this.user.name = user.name || 'مدير النظام';
        this.user.role = user.role === 'admin' ? 'مدير النظام' :
                         user.role === 'employee' ? 'موظف' : 'مستخدم';
      }
    });
  }

  /**
   * Load stats cards:
   *   Card 1 - Total Sales (from orders)
   *   Card 2 - New Orders count (from orders)
   *   Card 3 - Total Users count (from UserService.getAllUsers)
   */
  private loadStatistics(): void {
    this.isLoadingStats = true;

    forkJoin({
      orders: this.orderService.getAllOrders().pipe(
        map(response => {
          if (response.data && Array.isArray(response.data)) {
            return { orders: response.data as OrderData[], count: response.count || response.data.length };
          } else if ((response as any).orders && Array.isArray((response as any).orders)) {
            return {
              orders: (response as any).orders as OrderData[],
              count: (response as any).count || (response as any).orders.length
            };
          }
          return { orders: [] as OrderData[], count: 0 };
        }),
        catchError(err => {
          console.error('Error loading orders for stats:', err);
          return of({ orders: [] as OrderData[], count: 0 });
        })
      ),
      users: this.userService.getAllUsers().pipe(
        catchError(err => {
          console.error('Error loading users for stats:', err);
          return of({ success: false, users: [], count: 0 } as any);
        })
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        // Card 1: Total Sales
        const totalSales = this.calculateTotalSales(data.orders.orders);
        this.stats[0].value = `${totalSales.toLocaleString('ar-EG')} ج.م`;
        this.stats[0].change = this.calculatePercentageChange(
          this.calculateMonthSales(data.orders.orders, 1),
          this.calculateMonthSales(data.orders.orders, 0)
        );
        this.stats[0].loading = false;

        // Card 2: Orders Count
        this.stats[1].value = `${data.orders.count}`;
        this.stats[1].change = this.calculatePercentageChange(
          this.calculateMonthOrdersCount(data.orders.orders, 1),
          this.calculateMonthOrdersCount(data.orders.orders, 0)
        );
        this.stats[1].loading = false;

        // Card 3: Total Users (replaces Total Products)
        // UserService.getAllUsers() returns a UserResponse with users array
        const usersArray = (data.users as any)?.users ?? (data.users as any)?.data ?? [];
        const userCount = Array.isArray(usersArray) ? usersArray.length : 0;
        this.stats[2].value = `${userCount}`;
        this.stats[2].loading = false;

        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLoadingStats = false;
        this.stats.forEach(stat => stat.loading = false);
      }
    });
  }

  private loadDepartmentCounts(): void {
    this.isLoadingDepartments = true;

    forkJoin({
      chargers: this.chargerService.getAllChargers().pipe(catchError(() => of({ count: 0 }))),
      stations: this.stationService.getAllStations().pipe(catchError(() => of({ count: 0 }))),
      cables: this.cableService.getAllCables().pipe(catchError(() => of({ count: 0 }))),
      wires: this.wireService.getAllWires().pipe(catchError(() => of({ count: 0 }))),
      adapters: this.adapterService.getAllAdapters().pipe(catchError(() => of({ count: 0 }))),
      plugs: this.plugService.getAllPlugs().pipe(catchError(() => of({ count: 0 }))),
      boxes: this.boxService.getAllBoxes().pipe(catchError(() => of({ count: 0 }))),
      breakers: this.breakerService.getAllBreakers().pipe(catchError(() => of({ count: 0 }))),
      others: this.otherService.getAllOthers().pipe(catchError(() => of({ count: 0 })))
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.departments[0].count = `${data.chargers.count || 0} منتج`;
        this.departments[1].count = `${data.stations.count || 0} منتج`;
        this.departments[2].count = `${data.cables.count || 0} منتج`;
        this.departments[3].count = `${data.wires.count || 0} منتج`;
        this.departments[4].count = `${data.adapters.count || 0} منتج`;
        this.departments[5].count = `${data.plugs.count || 0} منتج`;
        this.departments[6].count = `${data.boxes.count || 0} منتج`;
        this.departments[7].count = `${data.breakers.count || 0} منتج`;
        this.departments[8].count = `${data.others.count || 0} منتج`;
        this.departments.forEach(d => d.loading = false);
        this.isLoadingDepartments = false;
      },
      error: () => {
        this.isLoadingDepartments = false;
        this.departments.forEach(d => d.loading = false);
      }
    });
  }

  private loadRecentOrders(): void {
    this.isLoadingOrders = true;
    this.orderService.getAllOrders().pipe(
      map(response => {
        if (response.data && Array.isArray(response.data)) return response.data;
        if ((response as any).orders && Array.isArray((response as any).orders)) return (response as any).orders;
        return [];
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (ordersList: OrderData[]) => {
        if (Array.isArray(ordersList) && ordersList.length > 0) {
          this.orders = ordersList.slice(0, 5).map(order => ({
            id: order.orderNumber || order._id || '',
            client: order.name || 'غير معروف',
            amount: `${(order.totalAmount || 0).toLocaleString('ar-EG')} ج.م`,
            status: this.translateOrderStatus(order.status || 'pending'),
            statusColor: this.getStatusColor(order.status || 'pending'),
            date: this.formatDate(order.createdAt)
          }));
        } else {
          this.orders = [];
        }
        this.isLoadingOrders = false;
      },
      error: () => { this.orders = []; this.isLoadingOrders = false; }
    });
  }

  private loadChartData(): void {
    this.isLoadingOrdersChart = true;
    this.isLoadingRevenueChart = true;
    this.orderService.getAllOrders().pipe(
      map(response => {
        if (response.data && Array.isArray(response.data)) return response.data;
        if ((response as any).orders && Array.isArray((response as any).orders)) return (response as any).orders;
        return [];
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (ordersList: OrderData[]) => {
        this.allOrdersData = ordersList;
        this.updateChartData();
        this.isLoadingOrdersChart = false;
        this.isLoadingRevenueChart = false;
      },
      error: () => { this.isLoadingOrdersChart = false; this.isLoadingRevenueChart = false; }
    });
  }

  private updateChartData(): void {
    switch (this.selectedTimeRange) {
      case 'week':
        this.ordersChartData = this.generateWeeklyOrdersData(this.allOrdersData);
        this.revenueChartData = this.generateWeeklySalesData(this.allOrdersData);
        break;
      case 'month':
        this.ordersChartData = this.generateMonthlyOrdersData(this.allOrdersData);
        this.revenueChartData = this.generateMonthlySalesData(this.allOrdersData);
        break;
      case '6months':
        this.ordersChartData = this.generate6MonthsOrdersData(this.allOrdersData);
        this.revenueChartData = this.generate6MonthsSalesData(this.allOrdersData);
        break;
      case 'year':
        this.ordersChartData = this.generateYearlyOrdersData(this.allOrdersData);
        this.revenueChartData = this.generateYearlySalesData(this.allOrdersData);
        break;
    }
    setTimeout(() => {
      this.createOrUpdateOrdersChart();
      this.createOrUpdateRevenueChart();
      this.calculateChanges();
    }, 100);
  }

  private createOrUpdateOrdersChart(): void {
    if (!this.ordersChartCanvas) return;
    const ctx = this.ordersChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.ordersChart) {
      this.ordersChart.data.labels = this.ordersChartData.map(d => d.label);
      this.ordersChart.data.datasets[0].data = this.ordersChartData.map(d => d.value);
      this.ordersChart.update();
    } else {
      this.ordersChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.ordersChartData.map(d => d.label),
          datasets: [{ label: 'عدد الطلبات', data: this.ordersChartData.map(d => d.value), backgroundColor: 'rgba(99, 102, 241, 0.8)', borderColor: 'rgba(99, 102, 241, 1)', borderWidth: 2, borderRadius: 8, barThickness: 40 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(31, 41, 55, 0.95)', titleColor: '#fff', bodyColor: '#fff', padding: 12, borderColor: 'rgba(99, 102, 241, 0.5)', borderWidth: 1, rtl: true, titleFont: { size: 14, weight: 'bold', family: 'Cairo' }, bodyFont: { size: 13, family: 'Cairo' }, callbacks: { title: c => c[0].label, label: c => `الطلبات: ${c.parsed.y}` } } },
          scales: { y: { beginAtZero: true, ticks: { color: '#6b7280', font: { size: 12, family: 'Cairo' }, precision: 0 }, grid: { color: 'rgba(229, 231, 235, 0.5)' } }, x: { ticks: { color: '#6b7280', font: { size: 12, family: 'Cairo' } }, grid: { display: false } } }
        }
      });
    }
  }

  private createOrUpdateRevenueChart(): void {
    if (!this.revenueChartCanvas) return;
    const ctx = this.revenueChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.revenueChart) {
      this.revenueChart.data.labels = this.revenueChartData.map(d => d.label);
      this.revenueChart.data.datasets[0].data = this.revenueChartData.map(d => d.value);
      this.revenueChart.update();
    } else {
      this.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.revenueChartData.map(d => d.label),
          datasets: [{ label: 'المبيعات', data: this.revenueChartData.map(d => d.value), backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 1)', borderWidth: 3, fill: true, tension: 0.4, pointBackgroundColor: 'rgba(16, 185, 129, 1)', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(31, 41, 55, 0.95)', titleColor: '#fff', bodyColor: '#fff', padding: 12, borderColor: 'rgba(16, 185, 129, 0.5)', borderWidth: 1, rtl: true, titleFont: { size: 14, weight: 'bold', family: 'Cairo' }, bodyFont: { size: 13, family: 'Cairo' }, callbacks: { title: c => c[0].label, label: c => `المبيعات: ${this.formatCurrency(c.parsed.y ?? 0)}` } } },
          scales: { y: { beginAtZero: true, ticks: { color: '#6b7280', font: { size: 12, family: 'Cairo' }, callback: v => typeof v === 'number' ? this.formatCurrencyShort(v) : v }, grid: { color: 'rgba(229, 231, 235, 0.5)' } }, x: { ticks: { color: '#6b7280', font: { size: 12, family: 'Cairo' } }, grid: { display: false } } }
        }
      });
    }
  }

  private calculateChanges(): void {
    const half = Math.floor(this.ordersChartData.length / 2);
    this.ordersChange = this.calculatePercentageChange(
      this.ordersChartData.slice(0, half).reduce((s, d) => s + d.value, 0),
      this.ordersChartData.slice(half).reduce((s, d) => s + d.value, 0)
    );
    this.revenueChange = this.calculatePercentageChange(
      this.revenueChartData.slice(0, half).reduce((s, d) => s + d.value, 0),
      this.revenueChartData.slice(half).reduce((s, d) => s + d.value, 0)
    );
  }

  changeTimeRange(range: TimeRange): void {
    this.selectedTimeRange = range;
    this.timeRangeOptions.forEach(o => o.active = o.value === range);
    this.updateChartData();
  }

  private calculateTotalSales(orders: OrderData[]): number {
    if (!Array.isArray(orders)) return 0;
    return orders.reduce((t, o) => t + (o.totalAmount || 0), 0);
  }

  private calculateMonthSales(orders: OrderData[], monthsAgo: number): number {
    if (!Array.isArray(orders)) return 0;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
    return orders.reduce((t, o) => {
      if (o.createdAt) { const d = new Date(o.createdAt); if (d >= start && d < end) return t + (o.totalAmount || 0); }
      return t;
    }, 0);
  }

  private calculateMonthOrdersCount(orders: OrderData[], monthsAgo: number): number {
    if (!Array.isArray(orders)) return 0;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
    return orders.filter(o => { if (o.createdAt) { const d = new Date(o.createdAt); return d >= start && d < end; } return false; }).length;
  }

  private calculatePercentageChange(oldVal: number, newVal: number): number {
    if (oldVal === 0) return newVal > 0 ? 100 : 0;
    return Math.round(((newVal - oldVal) / oldVal) * 100);
  }

  private generateWeeklyOrdersData(orders: OrderData[]): ChartDataPoint[] {
    const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const today = new Date(); today.setHours(23,59,59,999);
    const data: ChartDataPoint[] = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(today.getTime() - i*86400000); data.push({ label: days[d.getDay()], value: 0, date: d }); }
    orders?.forEach(o => { if (o.createdAt) { const od = new Date(o.createdAt); od.setHours(0,0,0,0); const m = data.find(p => { const pd = new Date(p.date!); pd.setHours(0,0,0,0); return pd.getTime()===od.getTime(); }); if (m) m.value+=1; } });
    return data;
  }

  private generateWeeklySalesData(orders: OrderData[]): ChartDataPoint[] {
    const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const today = new Date(); today.setHours(23,59,59,999);
    const data: ChartDataPoint[] = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(today.getTime() - i*86400000); data.push({ label: days[d.getDay()], value: 0, date: d }); }
    orders?.forEach(o => { if (o.createdAt) { const od = new Date(o.createdAt); od.setHours(0,0,0,0); const m = data.find(p => { const pd = new Date(p.date!); pd.setHours(0,0,0,0); return pd.getTime()===od.getTime(); }); if (m) m.value+=o.totalAmount||0; } });
    return data;
  }

  private generateMonthlyOrdersData(orders: OrderData[]): ChartDataPoint[] {
    const today = new Date(); today.setHours(23,59,59,999);
    const data: ChartDataPoint[] = [];
    for (let i = 3; i >= 0; i--) { const we = new Date(today.getTime()-i*7*86400000); const ws = new Date(we.getTime()-6*86400000); data.push({ label: `أسبوع ${4-i}`, value: 0, date: ws }); }
    orders?.forEach(o => { if (o.createdAt) { const od = new Date(o.createdAt); for (let i=0;i<data.length;i++) { const ws=new Date(data[i].date!); const we=new Date(ws.getTime()+6*86400000); we.setHours(23,59,59,999); if(od>=ws&&od<=we){data[i].value+=1;break;} } } });
    return data;
  }

  private generateMonthlySalesData(orders: OrderData[]): ChartDataPoint[] {
    const today = new Date(); today.setHours(23,59,59,999);
    const data: ChartDataPoint[] = [];
    for (let i = 3; i >= 0; i--) { const we = new Date(today.getTime()-i*7*86400000); const ws = new Date(we.getTime()-6*86400000); data.push({ label: `أسبوع ${4-i}`, value: 0, date: ws }); }
    orders?.forEach(o => { if (o.createdAt) { const od = new Date(o.createdAt); for (let i=0;i<data.length;i++) { const ws=new Date(data[i].date!); const we=new Date(ws.getTime()+6*86400000); we.setHours(23,59,59,999); if(od>=ws&&od<=we){data[i].value+=o.totalAmount||0;break;} } } });
    return data;
  }

  private generate6MonthsOrdersData(orders: OrderData[]): ChartDataPoint[] {
    const mn = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const today = new Date(); const data: ChartDataPoint[] = [];
    for (let i=5;i>=0;i--) { const d=new Date(today.getFullYear(),today.getMonth()-i,1); data.push({label:mn[d.getMonth()],value:0,date:d}); }
    orders?.forEach(o => { if (o.createdAt) { const od=new Date(o.createdAt); for(let i=0;i<data.length;i++){const ms=new Date(data[i].date!);const me=new Date(ms.getFullYear(),ms.getMonth()+1,0);me.setHours(23,59,59,999);if(od>=ms&&od<=me){data[i].value+=1;break;}} } });
    return data;
  }

  private generate6MonthsSalesData(orders: OrderData[]): ChartDataPoint[] {
    const mn = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const today = new Date(); const data: ChartDataPoint[] = [];
    for (let i=5;i>=0;i--) { const d=new Date(today.getFullYear(),today.getMonth()-i,1); data.push({label:mn[d.getMonth()],value:0,date:d}); }
    orders?.forEach(o => { if (o.createdAt) { const od=new Date(o.createdAt); for(let i=0;i<data.length;i++){const ms=new Date(data[i].date!);const me=new Date(ms.getFullYear(),ms.getMonth()+1,0);me.setHours(23,59,59,999);if(od>=ms&&od<=me){data[i].value+=o.totalAmount||0;break;}} } });
    return data;
  }

  private generateYearlyOrdersData(orders: OrderData[]): ChartDataPoint[] {
    const mn = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const today = new Date(); const data: ChartDataPoint[] = [];
    for (let i=11;i>=0;i--) { const d=new Date(today.getFullYear(),today.getMonth()-i,1); data.push({label:mn[d.getMonth()],value:0,date:d}); }
    orders?.forEach(o => { if (o.createdAt) { const od=new Date(o.createdAt); for(let i=0;i<data.length;i++){const ms=new Date(data[i].date!);const me=new Date(ms.getFullYear(),ms.getMonth()+1,0);me.setHours(23,59,59,999);if(od>=ms&&od<=me){data[i].value+=1;break;}} } });
    return data;
  }

  private generateYearlySalesData(orders: OrderData[]): ChartDataPoint[] {
    const mn = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const today = new Date(); const data: ChartDataPoint[] = [];
    for (let i=11;i>=0;i--) { const d=new Date(today.getFullYear(),today.getMonth()-i,1); data.push({label:mn[d.getMonth()],value:0,date:d}); }
    orders?.forEach(o => { if (o.createdAt) { const od=new Date(o.createdAt); for(let i=0;i<data.length;i++){const ms=new Date(data[i].date!);const me=new Date(ms.getFullYear(),ms.getMonth()+1,0);me.setHours(23,59,59,999);if(od>=ms&&od<=me){data[i].value+=o.totalAmount||0;break;}} } });
    return data;
  }

  private translateOrderStatus(status: string): string {
    const map: { [k: string]: string } = { pending:'قيد الانتظار', confirmed:'تم التأكيد', processing:'قيد المعالجة', shipped:'تم الشحن', delivered:'تم التسليم', cancelled:'ملغي' };
    return map[status] || status;
  }

  private getStatusColor(status: string): string {
    const map: { [k: string]: string } = { pending:'warning', confirmed:'info', processing:'info', shipped:'info', delivered:'success', cancelled:'danger' };
    return map[status] || 'info';
  }

  private formatDate(dateString: any): string {
    if (!dateString) return '';
    try { const d = new Date(dateString); if (isNaN(d.getTime())) return ''; return d.toLocaleDateString('ar-EG', { year:'numeric', month:'2-digit', day:'2-digit' }); }
    catch { return ''; }
  }

  navigateToDepartment(department: DepartmentCard): void { this.router.navigate([department.route]); }
  viewAllOrders(): void { this.router.navigate(['/admin/orders']); }
  formatCurrency(value: number): string { return `${value.toLocaleString('ar-EG')} ج.م`; }
  formatCurrencyShort(value: number): string {
    if (value === 0) return '0';
    if (value >= 1000000) return `${(value/1000000).toFixed(1)}م`;
    if (value >= 1000) return `${(value/1000).toFixed(1)}ألف`;
    return value.toLocaleString('ar-EG');
  }

  get totalOrdersForPeriod(): number { return this.ordersChartData.reduce((s, p) => s + p.value, 0); }
  get totalRevenueForPeriod(): number { return this.revenueChartData.reduce((s, p) => s + p.value, 0); }
}
