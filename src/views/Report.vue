<template>
  <div class="report-container">
    <el-card>
      <template #header><span style="font-size:18px;font-weight:bold">我要报修</span></template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" style="max-width:600px">
        <el-form-item label="资产编号" prop="asset_code">
          <el-input v-model="form.asset_code" placeholder="请扫描或输入资产编号" @blur="onAssetBlur" style="width:320px" />
          <el-button type="primary" @click="showScanner = true" style="margin-left:8px">📷 扫码</el-button>
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

      <!-- QR scanner: native camera + jsQR -->
  <div v-if="showScanner" class="scanner-overlay">
    <div class="scanner-header">
      <span>扫二维码</span>
      <button class="close-btn" @click="stopScanner">✕</button>
    </div>
    <div class="scanner-body">
      <div class="scanner-video-wrap">
        <video id="qr-video" autoplay playsinline muted style="width:100%;border-radius:8px;background:#000;max-height:70vh;object-fit:contain;"></video>
        <div class="scan-region">
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>
        </div>
      </div>
      <p class="scanner-hint">将二维码放入框内即可自动识别</p>
    </div>
  </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
// Native camera + jsQR (no html5-qrcode)
import { repairApi } from '../api'

const route = useRoute()
const formRef = ref()
const submitting = ref(false)
const assetInfo = ref(null)
const showScanner = ref(false)
const scannerActive = ref(false)
let videoStream = null
let animationFrameId = null

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

watch(showScanner, async (val) => {
  if (val) {
    await startScanner()
  } else {
    await stopScanner()
  }
})

const startScanner = async () => {
  try {
    // Block any Capacitor BarcodeDetector to prevent plugin bridge errors
    // This must be set BEFORE any camera/scanner initialization
    Object.defineProperty(window, 'BarcodeDetector', {
      get: () => ({ detect: () => Promise.resolve([]), getSupportedFormats: () => Promise.resolve([]) }),
      configurable: true
    })
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })
    videoStream = stream
    const video = document.getElementById('qr-video')
    if (!video) { throw new Error('Video element not found') }
    video.srcObject = stream
    await video.play()
    showScanner.value = true
    scannerActive.value = true

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const decodeFrame = () => {
      if (!videoStream) return
      try {
        const w = video.videoWidth || 640
        const h = video.videoHeight || 480
        canvas.width = w
        canvas.height = h
        ctx.drawImage(video, 0, 0, w, h)
        const imageData = ctx.getImageData(0, 0, w, h)
        if (typeof window.jsQR === 'function') {
          const code = window.jsQR(imageData.data, w, h, { inversionAttempts: 'dontInvert' })
          if (code && code.data) {
            form.value.asset_code = code.data.trim()
            ElMessage.success('扫码成功：' + code.data)
            stopScanner()
            onAssetBlur()
            return
          }
        }
      } catch (e) {
        // Silent: no QR in frame is normal
      }
      animationFrameId = requestAnimationFrame(decodeFrame)
    }
    decodeFrame()
  } catch (e) {
    console.error('camera error:', e)
    const msg = e?.message || String(e)
    if (msg.includes('permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
      ElMessage.warning('摄像头权限被拒绝，请在系统设置中授权后重试')
    } else if (msg.includes('not found') || msg.includes('Unable to claim')) {
      ElMessage.warning('未找到可用摄像头')
    } else {
      ElMessage.error('摄像头打开失败：' + msg)
    }
    showScanner.value = false
    scannerActive.value = false
  }
}

const stopScanner = async () => {
  showScanner.value = false
  scannerActive.value = false
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (videoStream) {
    videoStream.getTracks().forEach(t => t.stop())
    videoStream = null
  }
}

const onAssetBlur = async () => {
  if (!form.value.asset_code) return
  try {
    const token = localStorage.getItem('token') || ''
    const res = await fetch(`/api/assets/public/code/${form.value.asset_code}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    if (!res.ok) {
      assetInfo.value = null
      form.value.asset_name = ''
      return
    }
    const data = await res.json()
    if (data && data.asset_code) {
      assetInfo.value = data
      form.value.asset_name = data.asset_name || data.name || ''
    } else {
      assetInfo.value = null
      form.value.asset_name = ''
      ElMessage.warning('未找到资产编号：' + form.value.asset_code)
    }
  } catch {
    assetInfo.value = null
    form.value.asset_name = ''
  }
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

onUnmounted(() => { stopScanner() })

if (route.query.code) {
  form.value.asset_code = route.query.code
  onAssetBlur()
}
</script>

<style scoped>
.report-container { padding: 20px; max-width: 800px; margin: 0 auto; }
</style>
