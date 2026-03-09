<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'; 
import { XMarkIcon } from '@heroicons/vue/24/outline'; 
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
}>();

const emit = defineEmits(['update:modelValue']);

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
                <div class="flex items-center justify-between">
                  <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {{ title }}
                  </DialogTitle>
                  <button @click="emit('update:modelValue', false)" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                    <XMarkIcon class="w-5 h-5" />
                  </button>
                </div>
                
                <!-- Content slot -->
                <div class="mt-4">
                  <slot />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </Teleport>
</template>