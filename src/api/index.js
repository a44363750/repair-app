import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器 - 添加Token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me')
}

// Department API
export const departmentApi = {
  list: () => api.get('/departments'),
  get: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`)
}

// Employee API
export const employeeApi = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`)
}

// Category API
export const categoryApi = {
  list: () => api.get('/categories'),
  get: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
}

// Asset API
export const assetApi = {
  list: (params) => api.get('/assets', { params }),
  get: (id) => api.get(`/assets/${id}`),
  getByCode: (code) => api.get(`/assets/code/${code}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
  getQrCode: (id) => api.get(`/assets/${id}/qrcode`),
  getOperations: (id) => api.get(`/assets/${id}/operations`),
  import: (formData) => api.post('/assets/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadTemplate: () => {
    // 用原生 fetch 确保 Authorization header 正确发送
    const token = localStorage.getItem('token')
    fetch('/api/assets/template', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('下载失败，状态码：' + res.status)
        return res.blob()
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', '资产导入模板.xlsx')
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      })
      .catch(() => {
        window.open('/api/assets/template', '_blank')
      })
  }
}

// Inventory API
export const inventoryApi = {
  list: () => api.get('/inventory'),
  get: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  check: (taskId, assetId, data) => api.post(`/inventory/${taskId}/check`, null, {
    params: { asset_id: assetId, ...data }
  }),
  getReport: (id) => api.get(`/inventory/${id}/report`)
}

// Repair API
export const repairApi = {
  list: (params) => api.get('/repairs', { params }),
  get: (id) => api.get(`/repairs/${id}`),
  create: (data) => api.post('/repairs', data),
  handle: (id, data) => api.put(`/repairs/${id}/handle`, data),
  cancel: (id) => api.put(`/repairs/${id}/cancel`),
  getSummary: () => api.get('/repairs/stats/summary')
}

// ========== V2 模块 API ==========

// 区域管理
export const regionApi = {
  list: (params) => api.get('/regions', { params }),
  get: (id) => api.get(`/regions/${id}`),
  create: (data) => api.post('/regions', data),
  update: (id, data) => api.put(`/regions/${id}`, data),
  delete: (id) => api.delete(`/regions/${id}`)
}

// 使用单位
export const useUnitApi = {
  list: (params) => api.get('/use-units', { params }),
  get: (id) => api.get(`/use-units/${id}`),
  create: (data) => api.post('/use-units', data),
  update: (id, data) => api.put(`/use-units/${id}`, data),
  delete: (id) => api.delete(`/use-units/${id}`)
}

// 维修人员
export const maintenanceStaffApi = {
  list: (params) => api.get('/maintenance-staff', { params }),
  get: (id) => api.get(`/maintenance-staff/${id}`),
  create: (data) => api.post('/maintenance-staff', data),
  update: (id, data) => api.put(`/maintenance-staff/${id}`, data),
  delete: (id) => api.delete(`/maintenance-staff/${id}`)
}

// 调度人员
export const dispatcherApi = {
  list: (params) => api.get('/dispatchers', { params }),
  get: (id) => api.get(`/dispatchers/${id}`),
  create: (data) => api.post('/dispatchers', data),
  delete: (id) => api.delete(`/dispatchers/${id}`)
}

// 物资分类
export const materialCategoryApi = {
  list: () => api.get('/material-categories'),
  create: (data) => api.post('/material-categories', data),
  update: (id, data) => api.put(`/material-categories/${id}`, data),
  delete: (id) => api.delete(`/material-categories/${id}`)
}

// 物资（维修耗材）
export const materialApi = {
  list: (params) => api.get('/materials', { params }),
  get: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`)
}

// 物资领用
export const requisitionApi = {
  list: (params) => api.get('/requisitions', { params }),
  get: (id) => api.get(`/requisitions/${id}`),
  create: (data) => api.post('/requisitions', data),
  approve: (id) => api.put(`/requisitions/${id}/approve`),
  reject: (id) => api.put(`/requisitions/${id}/reject`)
}

// 工时统计
export const workHourApi = {
  list: (params) => api.get('/work-hours', { params }),
  create: (data) => api.post('/work-hours', data),
  delete: (id) => api.delete(`/work-hours/${id}`)
}

// 采购申请
export const purchaseRequestApi = {
  list: (params) => api.get('/purchase-requests', { params }),
  get: (id) => api.get(`/purchase-requests/${id}`),
  create: (data) => api.post('/purchase-requests', data),
  update: (id, data) => api.put(`/purchase-requests/${id}`, data),
  delete: (id) => api.delete(`/purchase-requests/${id}`)
}

// 维修调度
export const dispatchApi = {
  orders: (params) => api.get('/dispatch/orders', { params }),
  pending: () => api.get('/dispatch/pending'),
  assign: (data) => api.post('/dispatch/assign', data),
  reassign: (data) => api.post('/dispatch/reassign', data),
  start: (orderId) => api.post(`/dispatch/start/${orderId}`),
  complete: (orderId, data) => api.post(`/dispatch/complete/${orderId}`, data),
  availableStaff: () => api.get('/dispatch/staffs/available'),
  timelyRate: (params) => api.get('/dispatch/timely-rate', { params }),
  staffRate: (params) => api.get('/dispatch/staffs/rate', { params })
}

export default api
