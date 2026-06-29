<template>
  <div class="scan-container">
    <el-card>
      <template #header>
        <span style="font-size:16px;font-weight:bold">扫码盘点</span>
      </template>

      <div v-if="!scanning" style="text-align:center;padding:40px 0">
        <el-button type="primary" size="large" @click="startScan" style="padding:20px 40px;font-size:16px">
          📷 开始扫码
        </el-button>
        <p style="color:#888;margin-top:16px">点击按钮，用摄像头扫描资产二维码</p>
      </div>

      <div v-else class="scan-area">
        <div class="scan-header">
          <span>📷 扫码中</span>
          <button class="close-btn" @click="stopScan">✕</button>
        </div>
        <div class="scan-body">
          <video ref="videoEl" class="scan-video" autoplay playsinline></video>
          <canvas ref="canvasEl" class="scan-canvas"></canvas>
          <div class="scan-overlay">
            <div class="scan-frame"></div>
          </div>
          <button class="capture-btn" @click="capturePhoto">📸 拍照</button>
        <button class="album-btn" @click="pickFromAlbum" style="position:absolute;bottom:20px;right:20px;background:#67c23a;color:#fff;border:none;padding:10px 20px;border-radius:20px;font-size:14px;cursor:pointer">🖼️ 相册</button>
        </div>
      </div>
    </el-card>

    <!-- 扫码结果 -->
    <el-card v-if="scannedItems.length" style="margin-top:16px">
      <template #header>已扫描 {{ scannedItems.length }} 个资产</template>
      <el-table :data="scannedItems" size="small">
        <el-table-column prop="asset_code" label="资产编号" />
        <el-table-column prop="asset_name" label="资产名称" />
        <el-table-column prop="location" label="存放地点" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.checked ? 'success' : 'info'" size="small">
              {{ row.checked ? '已盘点' : '待确认' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right">
        <el-button type="success" @click="submitInventory">提交盘点</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { inventoryApi } from '../../api'

const videoEl = ref(null)
const canvasEl = ref(null)
let mediaStream = null
let rafId = null
const scanning = ref(false)
const scannedItems = ref([])

const startScan = async () => {
  scanning.value = true
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      videoEl.value.srcObject = mediaStream
      videoEl.value.onloadedmetadata = () => {
        videoEl.value.play()
        scanLoop()
      }
      return
    } catch (e) { console.warn('getUserMedia:', e) }
  }
  // Fallback to Capacitor Camera
  await tryCapacitorCamera()
}


const pickFromAlbum = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      scanImageData(ev.target.result).then(ok => {
        if (!ok) ElMessage.warning('未在图片中识别到二维码')
        scanning.value = false
      })
    }
    reader.readAsDataURL(file)
  }
  input.click()
}
const scanLoop = () => {
  if (!scanning.value || !videoEl.value || !canvasEl.value) return
  const video = videoEl.value
  const canvas = canvasEl.value
  if (!video.videoWidth) { rafId = requestAnimationFrame(scanLoop); return }
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' }) : null
  if (code && code.data) {
    stopScan()
    onScanSuccess(code.data)
    return
  }
  rafId = requestAnimationFrame(scanLoop)
}

const capturePhoto = async () => {
  if (!videoEl.value || !videoEl.value.videoWidth) return
  stopScan()
  const canvas = canvasEl.value
  canvas.width = videoEl.value.videoWidth
  canvas.height = videoEl.value.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoEl.value, 0, 0)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  await scanImageData(dataUrl)
}

const tryCapacitorCamera = async () => {
  const Camera = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera
  if (!Camera) {
    ElMessage.error('摄像头不可用，请升级APP')
    scanning.value = false
    return
  }
  try {
    const perm = await Camera.requestPermission().catch(() => 'denied')
    const photo = await Camera.getPhoto({ quality: 90, allowEditing: false, resultType: 'base64', source: 'CAMERA' })
    const dataUrl = 'data:image/jpeg;base64,' + photo.base64StringData
    await scanImageData(dataUrl)
  } catch (e) {
    ElMessage.error('拍照失败: ' + (e.message || String(e)))
    scanning.value = false
  }
}

const scanImageData = async (dataUrl) => {
  const canvas = canvasEl.value
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' }) : null
    if (code && code.data) {
      onScanSuccess(code.data)
    } else {
      ElMessage.warning('未识别到二维码')
      scanning.value = false
    }
  }
  img.onerror = () => { ElMessage.error('图片加载失败'); scanning.value = false }
  img.src = dataUrl
}

const onScanSuccess = async (code) => {
  code = (code || '').trim()
  if (!code) return
  if (scannedItems.value.some(i => i.asset_code === code)) {
    ElMessage.warning('该资产已扫描')
    scanning.value = false
    return
  }
  try {
    const res = await inventoryApi().getAssetByCode(code)
    if (res?.data?.data) {
      scannedItems.value.push({ ...res.data.data, checked: true })
      ElMessage.success('识别成功：' + code)
    } else {
      scannedItems.value.push({ asset_code: code, asset_name: '未知', location: '-', checked: false })
      ElMessage.warning('资产未找到：' + code)
    }
  } catch (e) {
    scannedItems.value.push({ asset_code: code, asset_name: '未知', location: '-', checked: false })
  }
  scanning.value = false
}

const stopScan = () => {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null }
  if (videoEl.value) videoEl.value.srcObject = null
}

const submitInventory = async () => {
  if (!scannedItems.value.length) return
  ElMessage.info('提交功能开发中')
}
</script>

<style scoped>
.scan-area { position: fixed; inset: 0; background: #000; z-index: 9999; display: flex; flex-direction: column; }
.scan-header { background: rgba(0,0,0,0.8); color: #fff; padding: 16px 20px; display: flex; justify-content: space-between; font-size: 16px; }
.scan-body { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.scan-video { width: 100%; height: 100%; object-fit: cover; }
.scan-canvas { display: none; }
.scan-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.scan-frame { width: 240px; height: 240px; border: 3px solid rgba(64,158,255,0.8); border-radius: 16px; box-shadow: 0 0 0 4000px rgba(0,0,0,0.5); }
.close-btn { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; padding: 0; }
.capture-btn { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: #409EFF; color: #fff; border: none; padding: 12px 32px; border-radius: 30px; font-size: 16px; cursor: pointer; }
</style>