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
              <el-icon :size="30"><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalRepairs }}</div>
              <div class="stat-label">报修单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="30"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingRepairs }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="30"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.highUrgency }}</div>
              <div class="stat-label">紧急/加急</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- APP 版本信息 -->
    <el-row style="margin-top:20px">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span>APP 版本信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="构建版本">
              <el-tag type="success" size="large">v{{ appVersion.buildNumber }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="构建时间">
              {{ appVersion.buildTime }}
            </el-descriptions-item>
            <el-descriptions-item label="Commit">
              <code>{{ appVersion.commit }}</code>
            </el-descriptions-item>
            <el-descriptions-item label="APK 大小">
              {{ appVersion.apkSize }}
            </el-descriptions-item>
            <el-descriptions-item label="下载地址" :span="2">
              <el-link :href="appVersion.downloadUrl" target="_blank" type="primary">
                {{ appVersion.downloadUrl }}
              </el-link>
            </el-descriptions-item>
          </el-descriptions>
          <div style="margin-top:12px">
            <el-button type="primary" size="small" @click="refreshVersion" :loading="versionLoading">
              刷新版本信息
            </el-button>
            <el-button size="small" @click="$router.push('/sync-app')">
              查看历史版本
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 今日报修趋势 -->
    <el-row style="margin-top:20px" :gutter="20">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <span>最近报修</span>
            <el-button style="float:right" size="small" @click="$router.push('/repair-list')">查看全部</el-button>
          </template>
          <el-table :data="recentRepairs" max-height="300" style="width:100%">
            <el-table-column prop="order_no" label="单号" width="140" />
            <el-table-column prop="asset_code" label="资产编号" width="120" />
            <el-table-column prop="urgency_level" label="紧急程度" width="90">
              <template #default="{row}">
                <el-tag :type="urgencyType(row.urgency_level)" size="small">
                  {{ urgencyLabel(row.urgency_level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{row}">
                <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>快捷操作</span>
          </template>
          <el-space direction="vertical" style="width:100%" :size="12">
            <el-button type="primary" style="width:100%" @click="$router.push('/report')">
              我要报修
            </el-button>
            <el-button type="success" style="width:100%" @click="$router.push('/repair-list')">
              报修查询
            </el-button>
            <el-button type="warning" style="width:100%" @click="$router.push('/repair-scan')">
              扫码报修
            </el-button>
            <el-button type="info" style="width:100%" @click="$router.push('/inventory-list')">
              资产盘点
            </el-button>
          </el-space>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Box, Tickets, Clock, Warning } from '@element-plus/icons-vue'
import { repairApi } from '../api'

const stats = ref({ totalAssets: 0, totalRepairs: 0, pendingRepairs: 0, highUrgency: 0 })
const recentRepairs = ref([])
const appVersion = ref({ buildNumber: '-', buildTime: '-', commit: '-', downloadUrl: 'http://10.50.3.81/apk/设备报修及点检管理.apk', apkSize: '-' })
const versionLoading = ref(false)

const loadStats = async () => {
  try {
    const res = await repairApi.value.getStats()
    if (res?.data) stats.value = res.data
  } catch (_) {}
}

const loadRecent = async () => {
  try {
    const res = await repairApi.value.getRepairList({ page: 1, page_size: 10 })
    if (res?.data?.items) recentRepairs.value = res.data.items
  } catch (_) {}
}

const loadAppVersion = async () => {
  try {
    const res = await fetch('/api/sync/version')
    if (res.ok) {
      const data = await res.json()
      appVersion.value = data
    }
  } catch (_) {}
}

const refreshVersion = async () => {
  versionLoading.value = true
  await loadAppVersion()
  versionLoading.value = false
}

const urgencyType = (level) => ({ low: 'info', medium: 'warning', high: 'danger' }[level] || 'info')
const urgencyLabel = (level) => ({ low: '一般', medium: '紧急', high: '加急' }[level] || level)
const statusType = (s) => ({ pending: 'warning', assigned: 'primary', processing: 'warning', completed: 'success', closed: 'info' }[s] || 'info')

onMounted(() => { loadStats(); loadRecent(); loadAppVersion() })
</script>

<style scoped>
.stat-card { display: flex; align-items: center; gap: 16px; }
.stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.stat-info { flex: 1; }
.stat-value { font-size: 28px; font-weight: bold; line-height: 1; }
.stat-label { font-size: 13px; color: #999; margin-top: 6px; }
</style>
