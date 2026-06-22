<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="showDialog">新建领用单</el-button>
    </div>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="requisition_no" label="单据编号" width="160" />
      <el-table-column prop="applicant_name" label="申请人" width="100" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
      <el-table-column prop="created_at" label="申请时间" width="160">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button size="small" type="success" @click="approve(row)">审批</el-button>
            <el-button size="small" type="danger" @click="reject(row)">拒绝</el-button>
          </template>
          <el-button size="small" @click="viewItems(row)">查看明细</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" style="margin-top:16px" @current-change="fetchData" />

    <el-dialog v-model="dialogVisible" title="新建物资领用单" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="关联工单ID"><el-input v-model="form.repair_order_id" type="number" placeholder="可选" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remarks" type="textarea" /></el-form-item>
        <el-divider>领用明细</el-divider>
        <div v-for="(item, idx) in form.items" :key="idx" style="display:flex;gap:8px;margin-bottom:8px">
          <el-select v-model="item.material_id" placeholder="选择耗材" style="flex:2">
            <el-option v-for="m in materials" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
          <el-input v-model="item.quantity" type="number" placeholder="数量" style="flex:1" />
          <el-button @click="form.items.splice(idx, 1)">删除</el-button>
        </div>
        <el-button @click="form.items.push({ material_id: null, quantity: 1 })">添加物资</el-button>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSave">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { requisitionApi, materialApi } from '../api'
const tableData = ref([]), materials = ref([])
const loading = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const dialogVisible = ref(false)
const form = ref({ repair_order_id: null, remarks: '', items: [{ material_id: null, quantity: 1 }] })
const statusMap = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
const statusTypeMap = { pending: 'warning', approved: 'success', rejected: 'danger' }
const statusLabel = (s) => statusMap[s] || s
const statusType = (s) => statusTypeMap[s] || ''
const formatDate = (d) => d ? new Date(d).toLocaleString('zh-CN') : '-'
const fetchData = async () => {
  loading.value = true
  try {
    const res = await requisitionApi.list( { page: page.value, page_size: pageSize.value })
    tableData.value = res.data.data || res.data
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
const showDialog = async () => {
  const res = await materialApi.list()
  materials.value = res.data.data || res.data || []
  form.value = { repair_order_id: null, remarks: '', items: [{ material_id: null, quantity: 1 }] }
  dialogVisible.value = true
}
const handleSave = async () => {
  await requisitionApi.create( form.value)
  dialogVisible.value = false; fetchData(); ElMessage.success('提交成功')
}
const approve = async (row) => { await axios.put(`/api/requisitions/${row.id}/approve`); fetchData(); ElMessage.success('已批准') }
const reject = async (row) => { await axios.put(`/api/requisitions/${row.id}/reject`); fetchData(); ElMessage.success('已拒绝') }
const viewItems = (row) => ElMessage.info(`查看 ${row.requisition_no} 明细（待开发）`)
onMounted(fetchData)
</script>
