import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  // 扫码报修入口（免登录）
  {
    path: '/repair',
    name: 'RepairScan',
    component: () => import('../views/repair/RepairScan.vue')
  },
  // 扫码盘点入口（免登录）
  {
    path: '/inventory/scan',
    name: 'InventoryScan',
    component: () => import('../views/inventory/InventoryScan.vue')
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      // 首页
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },

      // ===== 13个一级菜单 =====
      // 1. 基本设置（含4个子功能）
      { path: 'settings', name: 'Settings', component: () => import('../views/Settings.vue') },

      // 2. 设备信息
      { path: 'equipment', name: 'Equipment', component: () => import('../views/Equipment.vue') },

      // 3. 我要报修
      { path: 'report', name: 'Report', component: () => import('../views/Report.vue') },

      // 4. 维修调度
      { path: 'dispatch', name: 'Dispatch', component: () => import('../views/Dispatch.vue') },

      // 5. 维修人员
      { path: 'maintenance-staff', name: 'MaintenanceStaff', component: () => import('../views/MaintenanceStaff.vue') },

      // 6. 报修查询
      { path: 'repair-query', name: 'RepairQuery', component: () => import('../views/RepairQuery.vue') },

      // 7. 维修查询
      { path: 'repair-history', name: 'RepairHistory', component: () => import('../views/RepairHistory.vue') },

      // 8. 维修耗材
      { path: 'materials', name: 'Materials', component: () => import('../views/Materials.vue') },

      // 9. 工时统计
      { path: 'work-hours', name: 'WorkHours', component: () => import('../views/WorkHours.vue') },

      // 10. 调度人员
      { path: 'dispatchers', name: 'Dispatchers', component: () => import('../views/Dispatchers.vue') },

      // 11. 维修及时率
      { path: 'timely-rate', name: 'TimelyRate', component: () => import('../views/TimelyRate.vue') },

      // 12. 物资领用
      { path: 'requisitions', name: 'Requisitions', component: () => import('../views/Requisitions.vue') },

      // 13. 资产采购
      { path: 'purchase-requests', name: 'PurchaseRequests', component: () => import('../views/PurchaseRequests.vue') },
      // 同步APP
      { path: 'sync-app', name: 'SyncApp', component: () => import('../views/SyncApp.vue') },

      // ===== 原有路由保留 =====
      { path: 'assets', name: 'Assets', component: () => import('../views/assets/AssetList.vue') },
      { path: 'assets/add', name: 'AssetAdd', component: () => import('../views/assets/AssetForm.vue') },
      { path: 'assets/edit/:id', name: 'AssetEdit', component: () => import('../views/assets/AssetForm.vue') },
      { path: 'assets/import', name: 'AssetImport', component: () => import('../views/assets/AssetImport.vue') },
      { path: 'categories', name: 'Categories', component: () => import('../views/assets/CategoryList.vue') },
      { path: 'inventory', name: 'Inventory', component: () => import('../views/inventory/InventoryList.vue') },
      { path: 'inventory/create', name: 'InventoryCreate', component: () => import('../views/inventory/InventoryForm.vue') },
      { path: 'inventory/:id', name: 'InventoryDetail', component: () => import('../views/inventory/InventoryDetail.vue') },
      { path: 'departments', name: 'Departments', component: () => import('../views/org/DepartmentList.vue') },
      { path: 'employees', name: 'Employees', component: () => import('../views/org/EmployeeList.vue') },
      { path: 'repairs', name: 'Repairs', component: () => import('../views/repair/RepairList.vue') },
      { path: 'operations', name: 'Operations', component: () => import('../views/assets/OperationList.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 公开路径，不需要登录即可访问
const publicPaths = ['/login', '/repair', '/inventory/scan']

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (publicPaths.includes(to.path)) {
    next()
  } else if (!userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
