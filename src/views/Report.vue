<template>
  <div class="report-container">
    <el-card>
      <template #header><span style="font-size:18px;font-weight:bold">我要报修</span></template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" style="max-width:600px">
        <el-form-item label="资产编号" prop="asset_code">
          <el-input v-model="form.asset_code" placeholder="请扫描或输入资产编号" @blur="onAssetBlur" style="width:320px" />
          <el-button type="primary" @click="openScanner" style="margin-left:8px">📷 扫码</el-button>
        </el-form-item>
        <el-form-item label="资产名称" prop="asset_name">
          <el-input v-model="form.asset_name" placeholder="自动填充" disabled />
          <span v-if="assetInfo" style="color:#67c23a;font-size:12px;margin-left:8px">
            {{ assetInfo.location }} / {{ assetInfo.use_person }}
          </span>
        </el-form-item>
        <el-form-item label="故障位置" prop="fault_location">
          <el-input v-model="form.fault_location" placeholder="描述故障位置" />
        </el-form-item>
        <el-form-item label="故障描述" prop="fault_description">
          <el-input v-model="form.fault_description" type="textarea" :rows="4" placeholder="请详细描述故障现象" />
        </el-form-item>
        <el-form-item label="紧急程度" prop="urgency_level">
          <el-radio-group v-model="form.urgency_level">
            <el-radio label="low">一般</el-radio>
            <el-radio label="medium">紧急</el-radio>
            <el-radio label="high">加急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="报修人" prop="reporter_name">
          <el-input v-model="form.reporter_name" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="form.contact_phone" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交报修</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 扫码摄像头对话框 -->
    <el-dialog
      v-model="scanDialogVisible"
      title="扫码资产编号"
      width="420px"
      :close-on-click-modal="true"
      destroy-on-close
      @opened="onDialogOpened"
      @close="onDialogClose"
    >
      <div style="text-align:center">
        <video ref="videoEl" autoplay playsinline muted style="width:100%;max-width:360px;border-radius:8px;border:1px solid #ddd;background:#000"></video>
        <div style="margin-top:12px;color:#666;font-size:13px">
          <span v-if="scanning">🔍 对准二维码扫描中...</span>
          <span v-else-if="scanError" style="color:#e6a23c">{{ scanError }}</span>
          <span v-else>⏳ 正在打开摄像头...</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeScanner">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { repairApi } from '../api'

const route = useRoute()
const formRef = ref()
const submitting = ref(false)
const assetInfo = ref(null)
const scanDialogVisible = ref(false)
const videoEl = ref()
let mediaStream = null
let detectTimer = null
let barcodeDetector = null
const scanning = ref(false)
const scanError = ref('')

const form = ref({
  asset_code: '', asset_name: '', fault_location: '', fault_description: '',
  urgency_level: 'low', reporter_name: '', contact_phone: ''
})
const rules = {
  asset_code: [{ required: true, message: '请输入资产编号', trigger: 'blur' }],
  fault_description: [{ required: true, message: '请描述故障', trigger: 'blur' }],
  reporter_name: [{ required: true, message: '请输入报修人', trigger: 'blur' }],
  contact_phone: [{ required: true, message: '请输入电话', trigger: 'blur' }]
}

/** 打开对话框（仅设置 visible，实际初始化在 @opened 钩子中） */
const openScanner = () => {
  scanError.value = ''
  scanning.value = false
  scanDialogVisible.value = true
}

/** dialog 动画完成、DOM 已挂载后触发 */
const onDialogOpened = async () => {
  // 此时 videoEl 必定已渲染
  if (!videoEl.value) {
    scanError.value = '视频组件未就绪，请刷新页面后重试'
    return
  }
  try {
    // 检查浏览器能力
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('您的浏览器不支持摄像头调用，请使用 Chrome/Edge 浏览器')
    }
    if ('BarcodeDetector' in window) {
      barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39'] })
    } else {
      console.warn('BarcodeDetector not supported, scan disabled')
    }
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: 640, height: 480 }
    })
    videoEl.value.srcObject = mediaStream
    await videoEl.value.play()
    scanning.value = true
    detectBarcode()
  } catch (e) {
    const msg = e.message || String(e)
    if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('PermissionDenied')) {
      scanError.value = '摄像头权限被拒绝，请在浏览器地址栏左侧点击📷图标允许摄像头访问'
    } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
      scanError.value = '未检测到摄像头设备'
    } else if (msg.includes('NotReadable') || msg.includes('TrackStart')) {
      scanError.value = '摄像头被其他程序占用'
    } else if (msg.includes('NotSupportedError') || msg.includes('secure context')) {
      scanError.value = '当前页面需要 HTTPS 才能调用摄像头（或使用 localhost 访问）'
    } else {
      scanError.value = '摄像头打开失败：' + msg
    }
    scanning.value = false
  }
}

const detectBarcode = () => {
  if (!scanDialogVisible.value || !scanning.value) return
  if (!barcodeDetector || !videoEl.value) {
    detectTimer = setTimeout(detectBarcode, 300)
    return
  }
  barcodeDetector.detect(videoEl.value)
    .then(codes => {
      if (codes.length > 0) {
        const code = codes[0].rawValue
        closeScanner()
        form.value.asset_code = code
        onAssetBlur()
        ElMessage.success('扫码成功：' + code)
      } else {
        detectTimer = setTimeout(detectBarcode, 200)
      }
    })
    .catch(err => {
      console.warn('detect error:', err)
      detectTimer = setTimeout(detectBarcode, 300)
    })
}

const onDialogClose = () => {
  closeScanner()
}

const closeScanner = () => {
  scanning.value = false
  if (detectTimer) { clearTimeout(detectTimer); detectTimer = null }
  if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null }
  scanDialogVisible.value = false
}

const onAssetBlur = async () => {
  if (!form.value.asset_code) return
  try {
    const token = localStorage.getItem('token') || ''
    const res = await fetch(`/api/assets/public/code/${form.value.asset_code}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    assetInfo.value = data
    form.value.asset_name = data.asset_name || data.name || ''
  } catch { assetInfo.value = null }
}
const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await repairApi.create(form.value)
    ElMessage.success('报修提交成功！')
    resetForm()
  } catch (e) {
    ElMessage.error('提交失败：' + (e.response?.data?.detail || e.message))
  } finally { submitting.value = false }
}
const resetForm = () => { formRef.value?.resetFields(); assetInfo.value = null }

onMounted(() => {
  if (route.query.code) { form.value.asset_code = route.query.code; onAssetBlur() }
})
</script>

<style scoped>
.report-container { padding: 20px; max-width: 800px; margin: 0 auto; }
</style>
