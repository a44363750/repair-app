<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalAssets }}</div>
              <div class="stat-label">资产总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="30"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.normalAssets }}</div>
              <div class="stat-label">正常资产</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="30"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.maintenanceAssets }}</div>
              <div class="stat-label">维修中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="30"><Tools /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingRepairs }}</div>
              <div class="stat-label">待处理报修</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近报修</span>
          </template>
          <el-table :data="recentRepairs" size="small">
            <el-table-column prop="asset.name" label="设备" />
            <el-table-column prop="fault_description" label="故障描述" :show-overflow-tooltip="true" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>资产分类分布</span>
          </template>
          <div class="category-list">
            <div v-for="cat in categories" :key="cat.id" class="category-item">
              <span>{{ cat.name }}</span>
              <el-tag>{{ cat.count }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { assetApi, repairApi, categoryApi } from '../api'

const stats = ref({
  totalAssets: 0,
  normalAssets: 0,
  maintenanceAssets: 0,
  pendingRepairs: 0
})

const recentRepairs = ref([])
const categories = ref([])

const getStatusType = (status) => {
  const map = { pending: 'warning', handling: 'primary', completed: 'success', cancelled: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待处理', handling: '处理中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

onMounted(async () => {
  try {
    // 获取资产列表统计
    const assetRes = await assetApi.list({ limit: 1000 })
    stats.value.totalAssets = assetRes.total
    stats.value.normalAssets = assetRes.items.filter(a => a.status === 'normal').length
    stats.value.maintenanceAssets = assetRes.items.filter(a => a.status === 'maintenance').length
    
    // 获取报修统计
    const repairRes = await repairApi.getSummary()
    stats.value.pendingRepairs = repairRes.pending
    
    // 获取最近报修
    const repairs = await repairApi.list({ limit: 5 })
    recentRepairs.value = repairs
    
    // 获取分类统计
    const cats = await categoryApi.list()
    categories.value = cats.map(c => ({ ...c, count: 0 }))
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #999;
  font-size: 14px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
</style>