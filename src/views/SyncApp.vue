<template>
  <div class="sync-container">
    <h2>APP 下载</h2>
    <el-alert v-if="latestBuild" :type="alertType" :title="statusText" show-icon style="margin-bottom:20px" />

    <el-space direction="vertical" :size="20" style="width:100%">

      <el-card shadow="hover">
        <template #header>
          <span>构建与同步</span>
        </template>
        <p style="color:#666;margin-bottom:16px">
          <strong>触发构建：</strong>将最新代码提交到 GitHub CI，构建 Android 安装包（约需 5~8 分钟）。<br/>
          <strong>手动同步APP：</strong>CI 构建完成后，将最新 APK 部署到下载服务器。
        </p>
        <el-button type="primary" size="large" :loading="triggering" @click="triggerBuild">
          触发构建
        </el-button>
        <el-button type="success" size="large" :loading="syncing" @click="syncApk">
          手动同步APP
        </el-button>
        <el-button size="large" @click="refresh">刷新状态</el-button>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span>版本历史（共 {{ versions.length }} 个版本）</span>
        </template>
        <p v-if="!versions.length" style="color:#999">暂无版本记录</p>
        <el-table v-else :data="versions" stripe style="width:100%">
          <el-table-column label="版本" width="110">
            <template #default="{row}">
              <el-tag :type="row.isCurrent ? 'success' : 'info'" size="small">
                {{ row.isCurrent ? '✓ ' : '' }}v{{ row.runNumber }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Commit" width="90">
            <template #default="{row}">
              <code>{{ row.commit }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="buildTime" label="构建时间" width="160" />
          <el-table-column prop="apkSize" label="大小" width="90" />
          <el-table-column label="构建结果" width="90">
            <template #default="{row}">
              <el-tag :type="row.conclusion === 'success' ? 'success' : 'danger'" size="small">
                {{ row.conclusion === 'success' ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="{row}">
              <el-button
                v-if="row.conclusion === 'success'"
                type="primary"
                size="small"
                @click="downloadApk(row)"
              >
                下载安装
              </el-button>
              <el-link v-if="row.htmlUrl" :href="row.htmlUrl" target="_blank" style="margin-left:8px" type="info">
                CI 日志
              </el-link>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="hover" style="background:#f0f9eb">
        <template #header>
          <span>📥 直接下载当前版本</span>
        </template>
        <p style="color:#666;margin-bottom:12px">
          点击下方链接，直接下载 APK 到您的设备（手机/电脑）：
        </p>
        <el-input :value="currentDownloadUrl" readonly style="margin-bottom:12px">
          <template #append>
            <el-button @click="copyLink">复制链接</el-button>
          </template>
        </el-input>
        <el-link type="success" :href="currentDownloadUrl" target="_blank" :underline="false">
          <el-icon><Download /></el-icon> 下载并安装 APK
        </el-link>
        <p style="color:#999;font-size:12px;margin-top:8px">
          安装说明：下载后打开 APK 文件即可安装。如提示"未知来源"，请在手机设置中开启允许安装未知应用。
        </p>
      </el-card>

    </el-space>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

const triggering = ref(false)
const syncing = ref(false)
const latestBuild = ref(null)
const versions = ref([])
const currentDownloadUrl = ref('http://10.50.3.81/apk/设备报修及点检管理.apk')

const alertType = computed(() => {
  if (!latestBuild.value) return 'info'
  if (latestBuild.value.status === 'completed' && latestBuild.value.conclusion === 'success') return 'success'
  return 'warning'
})

const statusText = computed(() => {
  if (!latestBuild.value) return '未知'
  if (latestBuild.value.status === 'completed') {
    const bn = latestBuild.value.buildNumber || latestBuild.value.runNumber || '?'
    return latestBuild.value.conclusion === 'success' ? `最近构建：成功（Build #${bn}）` : '最近构建：失败'
  }
  return '构建进行中...'
})

const triggerBuild = async () => {
  triggering.value = true
  try {
    const res = await fetch('/api/sync', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || '触发失败')
    ElMessage.success(data.message || '已触发构建')
    setTimeout(refresh, 3000)
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    triggering.value = false
  }
}

const syncApk = async () => {
  syncing.value = true
  try {
    const res = await fetch('/api/sync/download', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || '同步失败')
    ElMessage.success(data.message || 'APK 已同步到服务器')
    setTimeout(refresh, 2000)
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    syncing.value = false
  }
}

const downloadApk = async (row) => {
  // 直接跳转到 APK 下载地址（浏览器会触发下载）
  window.open(row.downloadUrl, '_blank')
}

const copyLink = () => {
  navigator.clipboard.writeText(currentDownloadUrl.value)
  ElMessage.success('链接已复制')
}

const refresh = async () => {
  try {
    const res = await fetch('/api/sync/versions')
    if (res.ok) {
      const data = await res.json()
      versions.value = data.versions || []
      latestBuild.value = versions.value.find(v => v.isCurrent) || versions.value[0] || null
      if (latestBuild.value) {
        currentDownloadUrl.value = latestBuild.value.downloadUrl || currentDownloadUrl.value
      }
    }
  } catch (e) {
    ElMessage.error('获取版本列表失败: ' + e.message)
  }
}

onMounted(refresh)
</script>

<style scoped>
.sync-container { padding: 24px; }
</style>
