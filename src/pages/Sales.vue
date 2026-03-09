<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { useExportAsCSV } from '@/composables/useExportAsCSV'
import { useToast } from '@/composables/useToast'
import DataTable from '@/components/common/DataTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { format, parseISO } from 'date-fns'
import { PlusIcon, TrashIcon, ArrowDownTrayIcon, PencilIcon } from '@heroicons/vue/24/outline'
import type { Sale } from '@/types'

const store = useDataStore()
const { isExporting, exportData } = useExportAsCSV()
const toast = useToast()

const isFormModalOpen = ref(false)
const isEditMode = ref(false)
const saleToEdit = ref<Sale | null>(null)

const isDeleteModalOpen = ref(false)
const saleIdToDelete = ref<string | null>(null)

const saleForm = reactive({
  customerName: '',
  productName: 'SaaS License Pro' as
    | 'SaaS License Basic'
    | 'SaaS License Pro'
    | 'SaaS License Enterprise',
  amount: 149,
  currency: 'USD',
  status: 'Pending' as 'Completed' | 'Pending' | 'Refunded',
})

const columns = [
  { key: 'customerName', label: 'Customer', sortable: true },
  { key: 'productName', label: 'Product', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
]

const handleExport = () => {
  exportData(store.filteredSales, columns, 'sales_export')
  if (store.filteredSales.length > 0) toast.success('CSV exported successfully')
}

const openAddModal = () => {
  isEditMode.value = false
  saleToEdit.value = null
  saleForm.customerName = ''
  saleForm.productName = 'SaaS License Pro'
  saleForm.amount = 149
  saleForm.status = 'Pending'
  isFormModalOpen.value = true
}

const openEditModal = (sale: Sale) => {
  isEditMode.value = true
  saleToEdit.value = sale
  saleForm.customerName = sale.customerName
  saleForm.productName = sale.productName as any
  saleForm.amount = sale.amount
  saleForm.status = sale.status
  isFormModalOpen.value = true
}

const handleSubmitSale = () => {
  if (isEditMode.value && saleToEdit.value) {
    store.updateSale({
      ...saleToEdit.value,
      ...saleForm,
    })
    toast.success('Sale record updated')
  } else {
    store.addSale({
      ...saleForm,
      date: new Date().toISOString(),
    })
    toast.success('Sale record added')
  }
  isFormModalOpen.value = false
}

const openDeleteModal = (id: string) => {
  saleIdToDelete.value = id
  isDeleteModalOpen.value = true
}

const confirmDelete = () => {
  if (saleIdToDelete.value) {
    store.deleteSale(saleIdToDelete.value)
    toast.success('Sale record deleted')
  }
  isDeleteModalOpen.value = false
  saleIdToDelete.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Sales Records</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">View and manage all transactions.</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="handleExport"
          :disabled="isExporting"
          class="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <ArrowDownTrayIcon class="w-5 h-5" />
          {{ isExporting ? 'Exporting...' : 'Export CSV' }}
        </button>
        <button
          @click="openAddModal"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusIcon class="w-5 h-5" />
          Add Sale
        </button>
      </div>
    </div>

    <!-- The Reusable Table -->
    <DataTable :columns="columns" :data="store.filteredSales">
      <template #cell-status="{ item }">
        <span
          :class="[
            item.status === 'Completed'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : item.status === 'Pending'
              ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
            'px-2 py-1 rounded-full text-xs font-medium',
          ]"
        >
          {{ item.status }}
        </span>
      </template>
      <template #cell-date="{ item }">
        {{ format(parseISO(item.date), 'MMM dd, yyyy') }}
      </template>
      <template #cell-amount="{ item }">
        <span class="font-medium text-gray-900 dark:text-white">${{ item.amount.toFixed(2) }}</span>
      </template>

      <template #actions-cell="{ item }">
        <div class="flex gap-1">
          <button
            @click="openEditModal(item)"
            class="p-2 hover:bg-gray-100 text-gray-400 hover:text-blue-600 rounded-lg transition-colors dark:hover:bg-gray-800"
            title="Edit Sale"
          >
            <PencilIcon class="w-5 h-5" />
          </button>
          <button
            @click="openDeleteModal(item.id)"
            class="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors dark:hover:bg-red-900/20"
            title="Delete Sale"
          >
            <TrashIcon class="w-5 h-5" />
          </button>
        </div>
      </template>
    </DataTable>

    <BaseModal v-model="isFormModalOpen" :title="isEditMode ? 'Edit Sale' : 'Add New Sale'">
      <form @submit.prevent="handleSubmitSale" class="space-y-4">
        <div>
          <label
            for="customerName"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Customer Name</label
          >
          <input
            v-model="saleForm.customerName"
            type="text"
            id="customerName"
            required
            class="mt-1 block w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white px-3 py-2.5"
          />
        </div>
        <div>
          <label
            for="productName"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Product</label
          >
          <select
            v-model="saleForm.productName"
            id="productName"
            class="mt-1 block w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white px-3 py-2.5"
          >
            <option>SaaS License Basic</option>
            <option>SaaS License Pro</option>
            <option>SaaS License Enterprise</option>
          </select>
        </div>
        <div>
          <label for="amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Amount (USD)</label
          >
          <input
            v-model.number="saleForm.amount"
            type="number"
            id="amount"
            required
            class="mt-1 block w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white px-3 py-2.5"
          />
        </div>
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Status</label
          >
          <select
            v-model="saleForm.status"
            id="status"
            class="mt-1 block w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white px-3 py-2.5"
          >
            <option>Pending</option>
            <option>Completed</option>
            <option>Refunded</option>
          </select>
        </div>
        <div class="pt-4 flex justify-end gap-3">
          <button
            type="button"
            @click="isFormModalOpen = false"
            class="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {{ isEditMode ? 'Save Changes' : 'Add Sale' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="isDeleteModalOpen"
      title="Delete Sale"
      message="Are you sure you want to delete this sale record? This action cannot be undone."
      @confirm="confirmDelete"
    />
  </div>
</template>