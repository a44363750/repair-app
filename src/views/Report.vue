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

    <!-- 扫码全屏弹窗 -->
    <div v-if="showScanner" class="scanner-modal" @click.self="closeScanner">
      <div class="scanner-header">
        <span>📷 扫码</span>
        <button class="close-btn" @click="closeScanner">✕</button>
      </div>
      <div class="scanner-body">
        <video ref="videoEl" class="scanner-video" autoplay playsinline></video>
        <canvas ref="canvasEl" class="scanner-canvas"></canvas>
        <div class="scanner-overlay">
          <div class="scan-frame"></div>
          <p class="scanner-tip">将二维码放入框内，自动扫描</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { repairApi } from '../api'
import jsQR from 'jsqr'

const route = useRoute()
const formRef = ref()
const submitting = ref(false)
const assetInfo = ref(null)

// 扫码相关 refs
const videoEl = ref(null)
const canvasEl = ref(null)
let mediaStream = null
let rafId = null
const showScanner = ref(false)

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

// Capacitor WebView 环境：navigator.mediaDevices 不存在，需要通过插件获取视频流


const scanLoop = () => {
  if (!showScanner.value || !videoEl.value || !canvasEl.value) return
  const video = videoEl.value
  const canvas = canvasEl.value
  if (!video.videoWidth) { rafId = requestAnimationFrame(scanLoop); return }
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  if (jsQR) {
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
    if (code && code.data) {
      stopCamera()
      onScanSuccess(code.data)
      return
    }
  }
  rafId = requestAnimationFrame(scanLoop)
}

const onScanSuccess = (code) => {
  const trimmed = (code || '').trim()
  if (!trimmed) {
    ElMessage.warning('二维码内容为空')
    return
  }
  form.value.asset_code = trimmed
  ElMessage.success('扫码成功：' + trimmed)
  onAssetBlur()
}



const stopCamera = () => {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null }
  if (videoEl.value) { videoEl.value.srcObject = null }
}

onUnmounted(() => stopCamera())

// 资产查询
const onAssetBlur = async () => {
  const code = form.value.asset_code.trim()
  if (!code) return
  try {
    const res = await repairApi.publicGetAssetInfo(code)
    if (res?.data?.data) {
      assetInfo.value = res.data.data
      form.value.asset_name = res.data.data.name || code
    } else {
      assetInfo.value = null
    }
  } catch (e) {
    assetInfo.value = null
  }
}

onMounted(() => {
  const code = route.query.code
  if (code) { form.value.asset_code = String(code); onAssetBlur() }
})

// 提交
const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await repairApi.createRepairOrder(form.value)
    ElMessage.success('报修提交成功')
    resetForm()
  } catch (e) {
    ElMessage.error('提交失败：' + (e?.response?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formRef.value.resetFields()
  assetInfo.value = null
}

// Web 标准 getUserMedia 扫码
const openScanner = async () => {
  try {
    // Capacitor App: use Camera plugin to capture photo
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera) {
      try {
        const result = await window.Capacitor.Plugins.Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'base64',
          source: 'CAMERA',
        })
        if (!result || !result.base64String) {
          ElMessage.error('未获取到图片')
          return
        }
        const img = new Image()
        img.onload = () => {
          const canvas = canvasEl.value
          if (!canvas) { ElMessage.error('Canvas 未就绪'); return }
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          if (jsQR) {
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
            if (code && code.data) {
              onScanSuccess(code.data)
            } else {
              ElMessage.warning('照片中未识别到二维码，请保持手机稳定并确保二维码清晰')
            }
          } else {
            ElMessage.error('二维码识别库未加载(jsqr)，请更新APP到最新版本')
          }
        }
        img.src = 'data:image/jpeg;base64,' + result.base64String
      } catch (camErr) {
        console.warn('Capacitor Camera error:', camErr)
        ElMessage.error('摄像头拍照失败：' + (camErr.message || String(camErr)))
      }
    } else {
      // Browser fallback: getUserMedia
      showScanner.value = true
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        showScanner.value = false
        ElMessage.error('当前浏览器不支持摄像头，请使用Chrome或系统浏览器')
        return
      }
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoEl.value) {
        videoEl.value.srcObject = mediaStream
        videoEl.value.onloadedmetadata = () => { videoEl.value.play(); scanLoop() }
      }
    }
  } catch (e) {
    console.warn('Camera error:', e)
    showScanner.value = false
    const msg = String(e.message || e)
    if (msg.includes('Permission') || msg.includes('permission')) {
      ElMessage.error('摄像头权限被拒绝，请在系统设置中开启相机权限')
    } else if (msg.includes('NotFoundError') || msg.includes('not found')) {
      ElMessage.error('未找到摄像头设备')
    } else if (msg.includes('getUserMedia_not_available')) {
      ElMessage.error('当前浏览器不支持摄像头，请使用Chrome或系统浏览器')
    } else {
      ElMessage.error('摄像头打开失败：' + msg)
    }
  }
}

const closeScanner = () => {
  stopCamera()
  showScanner.value = false
}
</script>

<style scoped>
.scanner-modal {
  position: fixed; inset: 0;
  background: #000; z-index: 9999;
  display: flex; flex-direction: column;
}
.scanner-header {
  background: rgba(0,0,0,0.8); color: #fff;
  padding: 16px 20px;
  display: flex; justify-content: space-between; font-size: 16px;
}
.scanner-body {
  flex: 1; position: relative;
  display: flex; align-items: center; justify-content: center;
}
.scanner-video { width: 100%; height: 100%; object-fit: cover; }
.scanner-canvas { display: none; }
.scanner-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
.scan-frame {
  width: 240px; height: 240px;
  border: 3px solid rgba(64,158,255,0.8);
  border-radius: 16px;
  box-shadow: 0 0 0 4000px rgba(0,0,0,0.5);
}
.scanner-tip {
  position: absolute; bottom: 80px;
  color: #fff; font-size: 14px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}
.close-btn {
  background: none; border: none; color: #fff;
  font-size: 20px; cursor: pointer; padding: 0;
}
</style>
