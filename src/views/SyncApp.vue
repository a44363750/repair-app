<template>
  <div class="sync-container">
    <h2>同步APP</h2>
    <el-alert v-if="buildInfo" :type="alertType" :title="statusText" show-icon style="margin-bottom:20px" />

    <el-space direction="vertical" :size="20" style="width:100%">
      <el-card shadow="hover">
        <template #header>
          <span>手动同步APP</span>
        </template>
        <p style="color:#666;margin-bottom:16px">
          点击下方按钮，将最新代码构建为 Android 安装包（APK）。<br/>
          构建完成后，APK 自动部署到下载服务器（约需 5~8 分钟）。
        </p>
        <el-button type="primary" size="large" :loading="triggering" @click="triggerBuild">
          触发构建
        </el-button>
        <el-button size="large" @click="refresh">刷新状态</el-button>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span>最近构建记录</span>
        </template>
        <p v-if="!buildInfo" style="color:#999">点击「刷新状态」查看</p>
        <el-descriptions v-else :column="2" border>
          <el-descriptions-item label="状态">{{ buildInfo.status === 'completed' ? (buildInfo.conclusion === 'success' ? '构建成功' : '构建失败') : '进行中' }}</el-descriptions-item>
          <el-descriptions-item label="Commit">{{ buildInfo.head_sha }}</el-descriptions-item>
          <el-descriptions-item label="触发时间">{{ buildInfo.created_at }}</el-descriptions-item>
          <el-descriptions-item label="操作">
            <a :href="buildInfo.html_url" target="_blank" style="color:#409eff">在 GitHub 查看</a>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span>APK 下载</span>
        </template>
        <p style="color:#666;margin-bottom:12px">构建完成后，使用以下地址下载安装：</p>
        <el-input :value="apkUrl" readonly style="margin-bottom:12px">
          <template #append>
            <el-button @click="copyUrl">复制</el-button>
          </template>
        </el-input>
        <el-link type="success" :href="apkUrl" target="_blank" :underline="false">
          <el-icon><Download /></el-icon> 下载安装包
        </el-link>
      </el-card>
    </el-space>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

const triggering = ref(false)
const buildInfo = ref(null)
const apkUrl = 'http://10.50.3.81/apk/设备报修及点检管理.apk'

const alertType = computed(() => {
  if (!buildInfo.value) return 'info'
  if (buildInfo.value.status === 'completed' && buildInfo.value.conclusion === 'success') return 'success'
  return 'warning'
})

const statusText = computed(() => {
  if (!buildInfo.value) return '未知'
  if (buildInfo.value.status === 'completed') {
    return buildInfo.value.conclusion === 'success' ? '最近构建：成功' : '最近构建：失败'
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

const refresh = async () => {
  try {
    const res = await fetch('/api/sync')
    const data = await res.json()
    buildInfo.value = data
  } catch (e) {
    ElMessage.error('获取状态失败: ' + e.message)
  }
}

const copyUrl = () => {
  navigator.clipboard.writeText(apkUrl)
  ElMessage.success('链接已复制')
}

onMounted(refresh)
</script>

<style scoped>
.sync-container { padding: 24px; }
</style>
