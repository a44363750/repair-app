<template>
  <div class="scan-page">
    <!-- 顶部 -->
    <div class="scan-header">
      <div class="logo-area">
        <span class="logo-icon">📦</span>
        <div>
          <h1>{{ taskName }}</h1>
          <p class="assignee" v-if="assigneeName">执行人：{{ assigneeName }}</p>
        </div>
      </div>
      <!-- 进度条 -->
      <div class="progress-area">
        <div class="progress-text">
          <span>已完成</span>
          <strong>{{ checkedCount }} / {{ totalCount }}</strong>
          <span class="rate">{{ completionRate }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: completionRate + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="status-card">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p>加载任务中...</p>
    </div>

    <!-- 任务不存在 -->
    <div v-else-if="notFound" class="status-card error">
      <div class="status-icon">❌</div>
      <h2>任务不存在</h2>
      <p>请检查任务编号是否正确</p>
    </div>

    <!-- 任务已完成 -->
    <div v-else-if="taskStatus === 'completed'" class="status-card success">
      <div class="status-icon">🎉</div>
      <h2>任务已完成！</h2>
      <p>所有资产已完成盘点</p>
      <p class="stat">已完成 {{ checkedCount }} / {{ totalCount }}</p>
    </div>

    <!-- 主工作区 -->
    <div v-else class="work-area">
      <!-- 扫码按钮 -->
      <div class="scan-action">
        <div class="scan-btn-wrap">
          <button class="scan-btn" @click="openScanner" :disabled="scanning">
            <span class="scan-icon">📷</span>
            <span>{{ scanning ? '扫描中...' : '扫码盘点' }}</span>
          </button>
          <p class="scan-tip">点击按钮，扫描设备上的二维码</p>
        </div>

        <div class="divider"><span>或</span></div>

        <!-- 手动输入 -->
        <div class="manual-input">
          <p class="manual-label">手动输入资产编号</p>
          <div class="input-row">
            <el-input
              v-model="manualCode"
              placeholder="请输入资产编号"
              size="large"
              @keyup.enter="handleManualCheck"
              :disabled="submitting"
            />
            <el-button
              type="primary"
              size="large"
              @click="handleManualCheck"
              :loading="submitting"
            >确定</el-button>
          </div>
        </div>
      </div>

      <!-- 已盘点列表（折叠） -->
      <div class="checked-list" v-if="recentChecked.length > 0">
        <div class="section-title" @click="showCheckedList = !showCheckedList">
          <span>✅ 已盘点的资产 ({{ recentChecked.length }})</span>
          <span class="toggle">{{ showCheckedList ? '▲' : '▼' }}</span>
        </div>
        <div v-if="showCheckedList" class="checked-items">
          <div
            v-for="item in recentChecked"
            :key="item.asset_code"
            class="checked-item"
          >
            <span class="code">{{ item.asset_code }}</span>
            <span class="name">{{ item.asset_name }}</span>
            <span class="time">{{ formatTime(item.checked_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 扫码弹窗 -->
      <div class="scanner-modal" v-if="showScanner">
        <div class="scanner-header">
          <span>扫描资产二维码</span>
          <button class="close-btn" @click="closeScanner">✕</button>
        </div>
        <div class="scanner-body">
          <div id="qr-reader" class="qr-reader"></div>
          <p class="scanner-tip">将二维码放入框内，自动扫描</p>
        </div>
        <div class="scanner-footer">
          <el-input
            v-model="manualCode"
            placeholder="未扫描到？直接输入资产编号"
            @keyup.enter="submitManualScan"
          />
          <el-button type="primary" @click="submitManualScan" :disabled="!manualCode">
            手动提交
          </el-button>
        </div>
      </div>
    </div>

    <!-- 结果提示（全局浮动） -->
    <Transition name="toast">
      <div v-if="toast.show" :class="['toast', toast.type]">
        <span v-if="toast.type === 'success'">✅</span>
        <span v-else-if="toast.type === 'error'">❌</span>
        <span v-else>ℹ️</span>
        <div class="toast-content">
          <strong>{{ toast.title }}</strong>
          <p>{{ toast.msg }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { Html5Qrcode } from 'html5-qrcode'

const route = useRoute()

// ========== 状态 ==========
const loading = ref(true)
const notFound = ref(false)
const taskId = ref(null)
const taskName = ref('')
const assigneeName = ref('')
const taskStatus = ref('pending')
const totalCount = ref(0)
const checkedCount = ref(0)
const recentChecked = ref([])
const showCheckedList = ref(false)
const completionRate = computed(() => {
  return totalCount.value > 0 ? Math.round(checkedCount.value / totalCount.value * 100) : 0
})

// 扫码
const scanning = ref(false)
const showScanner = ref(false)
const manualCode = ref('')
const submitting = ref(false)
let html5Qr = null

// Toast
const toast = reactive({ show: false, type: 'success', title: '', msg: '' })

// ========== 加载任务 ==========
const loadTask = async () => {
  loading.value = true
  notFound.value = false

  const id = route.query.task_id || route.params.task_id
  if (!id) {
    notFound.value = true
    loading.value = false
    return
  }

  taskId.value = id

  try {
    const res = await fetch(`/api/inventory/public/task/${id}`)
    if (!res.ok) {
      const err = await res.json()
      notFound.value = true
      ElMessage.error(err.detail || '任务不存在')
      loading.value = false
      return
    }

    const data = await res.json()
    taskName.value = data.task_name
    assigneeName.value = data.assignee_name || ''
    taskStatus.value = data.status
    totalCount.value = data.total_assets
    checkedCount.value = data.checked_assets

    // 收集已盘点的资产
    if (data.items) {
      recentChecked.value = data.items
        .filter(i => i.is_checked)
        .map(i => ({
          asset_code: i.asset_code,
          asset_name: i.asset_name,
          checked_at: i.checked_at
        }))
    }

  } catch (e) {
    notFound.value = true
    ElMessage.error('加载任务失败')
  } finally {
    loading.value = false
  }
}

// ========== 扫码（使用 html5-qrcode）==========
const openScanner = async () => {
  if (scanning.value) return
  showScanner.value = true
  manualCode.value = ''

  await nextTick()

  try {
    // 关闭之前的实例
    if (html5Qr) {
      try { await html5Qr.stop(); } catch (_) {}
      html5Qr = null
    }

    html5Qr = new Html5Qrcode('qr-reader')

    await html5Qr.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        useBarCodeDetectorIfSupported: false
      },
      (decodedText) => {
        // 扫码成功
        html5Qr.stop().catch(() => {})
        handleScanResult(decodedText.trim())
      },
      () => {
        // 扫码失败（无二维码），忽略继续扫描
      }
    )

    scanning.value = true
  } catch (e) {
    console.error('Camera error:', e)
    ElMessage.error('无法访问相机，请检查权限设置或使用手动输入')
    showScanner.value = false
    scanning.value = false
  }
}

const handleScanResult = async (assetCode) => {
  scanning.value = false
  showScanner.value = false
  stopCamera()

  await doCheck(assetCode)
}

const submitManualScan = () => {
  if (!manualCode.value.trim()) return
  handleScanResult(manualCode.value.trim())
}

const handleManualCheck = async () => {
  if (!manualCode.value.trim()) return
  await doCheck(manualCode.value.trim())
}

const doCheck = async (assetCode) => {
  if (submitting.value) return
  submitting.value = true
  manualCode.value = ''

  try {
    const res = await fetch(`/api/inventory/public/task/${taskId.value}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_code: assetCode })
    })

    const data = await res.json()

    if (!res.ok) {
      showToast('error', '盘点失败', data.detail || '未知错误')
      return
    }

    if (data.already_checked) {
      showToast('info', '已盘点过', `${data.asset_name || assetCode} 此前已盘点`)
      return
    }

    checkedCount.value = data.checked
    totalCount.value = data.total

    if (data.task_completed) {
      taskStatus.value = 'completed'
      showToast('success', '🎉 任务完成！', `所有资产已盘点完毕`)
    } else {
      showToast('success', '盘点成功', `${data.asset_name} 已标记为盘点`)
      // 更新已盘点列表
      recentChecked.value.unshift({
        asset_code: assetCode,
        asset_name: data.asset_name,
        checked_at: new Date().toISOString()
      })
    }

  } catch (e) {
    showToast('error', '网络错误', '请检查网络连接后重试')
  } finally {
    submitting.value = false
  }
}

const stopCamera = async () => {
  if (html5Qr) {
    try { await html5Qr.stop(); } catch (_) {}
    html5Qr = null
  }
  scanning.value = false
}

const closeScanner = async () => {
  await stopCamera()
  showScanner.value = false
}

// ========== Toast ==========
const showToast = (type, title, msg) => {
  toast.show = true
  toast.type = type
  toast.title = title
  toast.msg = msg
  setTimeout(() => { toast.show = false }, 3000)
}

const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ========== 清理 ==========
onUnmounted(async () => {
  await stopCamera()
})

onMounted(() => {
  loadTask()
})
</script>

<style scoped>
.scan-page {
  min-height: 100vh;
  background: #f0f2f5;
  padding-bottom: 40px;
}

/* 顶部 */
.scan-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 20px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.logo-icon {
  font-size: 36px;
}

.logo-area h1 {
  font-size: 20px;
  margin: 0 0 4px;
  color: #fff;
}

.assignee {
  font-size: 13px;
  color: #aab4c8;
  margin: 0;
}

.progress-area {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 12px 16px;
}

.progress-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 8px;
  color: #aab4c8;
}

.progress-text strong {
  font-size: 18px;
  color: #fff;
  flex: 1;
}

.rate {
  font-size: 18px;
  font-weight: bold;
  color: #67c23a;
}

.progress-bar {
  height: 8px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 4px;
  transition: width 0.4s ease;
}

/* 卡片 */
.status-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  margin: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.status-card h2 {
  margin: 0;
}

.status-card p {
  color: #666;
  margin: 0;
}

.status-icon {
  font-size: 52px;
}

.status-card.success {
  background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
}

.status-card.success h2 {
  color: #67c23a;
}

.status-card.error h2 {
  color: #f56c6c;
}

/* 工作区 */
.work-area {
  padding: 20px;
}

.scan-action {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
}

.scan-btn-wrap {
  text-align: center;
}

.scan-btn {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto 12px;
  box-shadow: 0 6px 24px rgba(64, 158, 255, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.scan-btn:active {
  transform: scale(0.96);
}

.scan-icon {
  font-size: 48px;
}

.scan-tip {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.divider {
  text-align: center;
  position: relative;
  margin: 20px 0;
  color: #bbb;
  font-size: 13px;
}

.divider::before, .divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 1px;
  background: #e4e4e4;
}

.divider::before { left: 0; }
.divider::after { right: 0; }

.manual-label {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px;
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-row .el-input {
  flex: 1;
}

/* 已盘点列表 */
.checked-list {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

.section-title {
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.checked-items {
  max-height: 300px;
  overflow-y: auto;
}

.checked-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}

.checked-item .code {
  color: #409eff;
  font-family: monospace;
  font-weight: bold;
  min-width: 120px;
}

.checked-item .name {
  flex: 1;
  color: #666;
}

.checked-item .time {
  color: #999;
  font-size: 12px;
}

/* 扫码弹窗 */
.scanner-modal {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.scanner-header {
  background: rgba(0,0,0,0.8);
  color: #fff;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.scanner-body {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qr-reader {
  width: 100%;
  max-width: 400px;
}

.qr-reader video {
  width: 100% !important;
  border-radius: 8px;
}

.scanner-tip {
  color: #fff;
  font-size: 14px;
  text-align: center;
  padding: 12px 0;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}

.scanner-footer {
  background: rgba(0,0,0,0.9);
  padding: 16px 20px;
  display: flex;
  gap: 10px;
}

/* Toast */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  z-index: 99999;
  max-width: 340px;
  width: calc(100% - 40px);
}

.toast.success { border-left: 4px solid #67c23a; }
.toast.error { border-left: 4px solid #f56c6c; }
.toast.info { border-left: 4px solid #409eff; }

.toast-content strong {
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
}

.toast-content p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
