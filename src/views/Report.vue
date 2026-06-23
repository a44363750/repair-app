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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { BarcodeScanner } from '@capacitor-community/barcode-scanner'
import { repairApi } from '../api'

const route = useRoute()
const formRef = ref()
const submitting = ref(false)
const assetInfo = ref(null)

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

// 扫码入口
const openScanner = async () => {
  try {
    // 1. 检查摄像头权限
    const status = await BarcodeScanner.checkPermission({ force: true })
    if (!status.granted) {
      if (status.denied) {
        ElMessage.warning('摄像头权限被拒绝，请在系统设置中开启后重试')
      } else {
        ElMessage.warning('无法获取摄像头权限')
      }
      return
    }

    // 2. 停止一切可能的后台摄像头活动（防止重复）
    try { await BarcodeScanner.stopScan() } catch (_) {}

    // 3. 开始扫描
    const result = await BarcodeScanner.startScan()

    // 4. 解析结果
    if (result) {
      // hasContent 为 true 表示扫到了码，但 content 可能为 null
      if (result.hasContent && result.content != null && result.content !== '') {
        const code = (result.content || '').trim()
        form.value.asset_code = code
        ElMessage.success('扫码成功：' + code)
        await onAssetBlur()
      } else {
        // 扫到了但解析为 null（条码/二维码内容为空或格式无法识别）
        ElMessage.warning('无法解析二维码内容，请确保二维码清晰且包含文字/数字')
      }
    } else {
      // 用户取消或无结果
      ElMessage.info('未扫描到二维码')
    }
  } catch (e) {
    console.error('scan error:', e)
    const msg = e?.message || String(e)
    if (msg.includes('cancel') || msg.includes('CANCEL')) {
      ElMessage.info('扫码已取消')
    } else if (msg.includes('PERMISSION') || msg.includes('permission')) {
      ElMessage.warning('摄像头权限不足，请授权后重试')
    } else if (msg.includes('activity') || msg.includes('Activity')) {
      ElMessage.error('扫码失败：APP活动窗口异常，请重启APP后重试')
    } else {
      ElMessage.error('扫码失败：' + msg)
    }
  } finally {
    // 确保关闭摄像头
    try { await BarcodeScanner.stopScan() } catch (_) {}
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

// 页面销毁时确保摄像头关闭
onUnmounted(() => {
  BarcodeScanner.stopScan().catch(() => {})
})

onMounted(() => {
  if (route.query.code) {
    form.value.asset_code = route.query.code
    onAssetBlur()
  }
})
</script>


<style scoped>
.report-container { padding: 20px; max-width: 800px; margin: 0 auto; }
</style>
