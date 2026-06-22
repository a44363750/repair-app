<template>
  <div class="asset-form">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑资产' : '新增资产' }}</span>
      </template>
      
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产编码" prop="asset_code">
              <el-input v-model="form.asset_code" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产分类">
              <el-select v-model="form.category_id" placeholder="请选择" style="width: 100%">
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号">
              <el-input v-model="form.model" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="制造商">
              <el-input v-model="form.manufacturer" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购置日期">
              <el-date-picker v-model="form.purchase_date" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="购置价格">
              <el-input-number v-model="form.purchase_price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放位置">
              <el-input v-model="form.location" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属部门">
              <el-select v-model="form.department_id" placeholder="请选择" style="width: 100%">
                <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="form.responsible_person_id" placeholder="请选择" style="width: 100%">
                <el-option v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="正常" value="normal" />
                <el-option label="维修中" value="maintenance" />
                <el-option label="报废" value="scrap" />
                <el-option label="丢失" value="missing" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注">
          <el-input v-model="form.remarks" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { assetApi, categoryApi, departmentApi, employeeApi } from '../../api'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const isEdit = computed(() => !!route.params.id)

const form = reactive({
  asset_code: '',
  name: '',
  category_id: null,
  model: '',
  manufacturer: '',
  purchase_date: null,
  purchase_price: null,
  location: '',
  department_id: null,
  responsible_person_id: null,
  status: 'normal',
  remarks: ''
})

const rules = {
  asset_code: [{ required: true, message: '请输入资产编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入资产名称', trigger: 'blur' }]
}

const categories = ref([])
const departments = ref([])
const employees = ref([])

const loadOptions = async () => {
  categories.value = await categoryApi.list()
  departments.value = await departmentApi.list()
  employees.value = await employeeApi.list()
}

const loadData = async () => {
  if (isEdit.value) {
    const res = await assetApi.get(route.params.id)
    Object.assign(form, res)
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  
  try {
    if (isEdit.value) {
      await assetApi.update(route.params.id, form)
      ElMessage.success('更新成功')
    } else {
      await assetApi.create(form)
      ElMessage.success('创建成功')
    }
    router.push('/assets')
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '操作失败')
  }
}

onMounted(() => {
  loadOptions()
  if (isEdit.value) loadData()
})
</script>