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

    <!-- QR scanner dialog -->
    <el-dialog v-model="showScanner" title="扫码资产编号" width="500px" :close-on-click-modal="false">
      <div v-if="scannerActive" id="qr-reader" style="width:100%;min-height:300px"></div>
      <div v-else style="text-align:center;padding:40px 0;color:#909399">
        <p>正在初始化摄像头...</p>
      </div>
      <template #footer>
        <el-button @click="stopScanner">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import { repairApi } from '../api'

const route = useRoute()
const formRef = ref()
const submitting = ref(false)
const assetInfo = ref(null)
const showScanner = ref(false)
const scannerActive = ref(false)
let html5Qr = null

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
    html5Qr = new Html5Qrcode('qr-reader')
    await html5Qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 280, height: 150 }, useBarCodeDetectorIfSupported: false },
      (decodedText) => {
        form.value.asset_code = decodedText.trim()
        ElMessage.success('扫码成功：' + decodedText)
        showScanner.value = false
        stopScanner()
        onAssetBlur()
      },
      () => {}
    )
    scannerActive.value = true
  } catch (e) {
    console.error('scanner error:', e)
    const msg = e?.message || String(e)
    if (msg.includes('permission') || msg.includes('NotAllowed')) {
      ElMessage.warning('摄像头权限被拒绝，请在系统设置中授权后重试')
    } else if (msg.includes('no camera')) {
      ElMessage.warning('未找到可用摄像头')
    } else {
      ElMessage.error('扫码失败：' + msg)
    }
    showScanner.value = false
    scannerActive.value = false
  }
}

const stopScanner = async () => {
  scannerActive.value = false
  if (html5Qr) {
    try { await html5Qr.stop() } catch (_) {}
    html5Qr = null
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
