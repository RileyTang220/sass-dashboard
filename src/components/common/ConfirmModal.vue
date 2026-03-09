<script setup lang="ts">
import { BellAlertIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';

const props = defineProps<{
  modelValue: boolean; 
  title: string;
  message: string;
}>();

const emit = defineEmits(['update:modelValue', 'confirm']);

const onConfirm = () => {
  emit('confirm');
  emit('update:modelValue', false);
};
</script>

<template>
  <Teleport to="body">
    <TransitionRoot appear :show="modelValue" as="template">
      <Dialog as="div" @close="emit('update:modelValue', false)" class="relative z-50">
        <!-- Backdrop -->
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </TransitionChild>

        <!-- Modal Panel -->
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div class="flex items-center">
                  <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <BellAlertIcon class="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                  </div>
                  <div class="ml-4 flex-1">
                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      {{ title }}
                    </DialogTitle>
                  </div>
                  <button @click="emit('update:modelValue', false)" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                    <XMarkIcon class="w-5 h-5" />
                  </button>
                </div>
                
                <div class="mt-4 ml-14">
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ message }}
                  </p>
                </div>

                <div class="mt-6 flex justify-end gap-3">
                  <button 
                    type="button" 
                    @click="emit('update:modelValue', false)"
                    class="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    @click="onConfirm"
                    class="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Confirm Delete
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </Teleport>
</template>